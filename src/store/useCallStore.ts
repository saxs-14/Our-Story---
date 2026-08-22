import { create } from 'zustand';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '@/lib/firebase';
import { webrtc } from '@/lib/webrtc';
import type { PersonId } from '@/store/useAuthStore';
import { personById, partnerOf } from '@/store/useAuthStore';

export type CallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';
export type CallType = 'voice' | 'video';

interface CallStore {
  callState: CallState;
  callType: CallType;
  callId: string | null;
  callerId: PersonId | null;
  calleeId: PersonId | null;
  callerName: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  durationSeconds: number;

  startCall: (type: CallType, callerId: PersonId) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
  listenForIncomingCalls: (currentUserId: PersonId) => Unsubscribe | null;
}

let timerInterval: number | null = null;

export const useCallStore = create<CallStore>((set, get) => {
  // Bind WebRTC events to store
  webrtc.onRemoteStream = (remoteStream) => {
    set({ remoteStream });
  };

  webrtc.onCallConnected = () => {
    set({ callState: 'connected' });
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
      set((s) => ({ durationSeconds: s.durationSeconds + 1 }));
    }, 1000);
  };

  webrtc.onCallEnded = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    const currentLocal = get().localStream;
    if (currentLocal) {
      currentLocal.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
    }
    const currentRemote = get().remoteStream;
    if (currentRemote) {
      currentRemote.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
    }
    set({
      callState: 'idle',
      callId: null,
      callerId: null,
      calleeId: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoOff: false,
      durationSeconds: 0,
    });
  };

  return {
    callState: 'idle',
    callType: 'voice',
    callId: null,
    callerId: null,
    calleeId: null,
    callerName: '',
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOff: false,
    durationSeconds: 0,

    startCall: async (type: CallType, callerId: PersonId) => {
      const calleeId = partnerOf(callerId);
      const callerName = personById(callerId).nickname;

      set({
        callState: 'calling',
        callType: type,
        callerId,
        calleeId,
        callerName,
        durationSeconds: 0,
        isMuted: false,
        isVideoOff: false,
      });

      try {
        const stream = await webrtc.getLocalStream(type);
        set({ localStream: stream });
        const callId = await webrtc.makeCall(type, callerId, callerName, calleeId);
        set({ callId });
      } catch (err) {
        console.error('Call initialization failed:', err);
        webrtc.onCallEnded?.();
      }
    },

    answerCall: async () => {
      const { callId, callType } = get();
      if (!callId) return;

      try {
        const stream = await webrtc.getLocalStream(callType);
        set({ localStream: stream, callState: 'connected' });
        await webrtc.answerCall(callId, callType);
      } catch (err) {
        console.error('Answering call failed:', err);
        webrtc.onCallEnded?.();
      }
    },

    rejectCall: async () => {
      const { callId } = get();
      if (callId) {
        await webrtc.rejectCall(callId);
      }
      webrtc.onCallEnded?.();
    },

    endCall: async () => {
      await webrtc.endCall();
    },

    toggleMute: () => {
      const newMuted = !get().isMuted;
      webrtc.toggleMute(newMuted);
      set({ isMuted: newMuted });
    },

    toggleVideo: () => {
      const newVideoOff = !get().isVideoOff;
      webrtc.toggleVideo(newVideoOff);
      set({ isVideoOff: newVideoOff });
    },

    switchCamera: () => {
      void webrtc.switchCamera();
    },

    listenForIncomingCalls: (currentUserId: PersonId) => {
      if (!FIREBASE_CONFIGURED || !db) return null;

      const q = query(
        collection(db, 'calls'),
        where('calleeId', '==', currentUserId),
        where('status', '==', 'offering'),
      );

      const unsub = onSnapshot(q, (snapshot) => {
        if (get().callState !== 'idle') return; // already in a call

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            // Verify call is fresh (< 60 seconds old)
            if (Date.now() - (data.createdAt || 0) < 60000) {
              set({
                callState: 'incoming',
                callId: change.doc.id,
                callType: data.type || 'voice',
                callerId: data.callerId,
                calleeId: currentUserId,
                callerName: data.callerName || personById(data.callerId).nickname,
                durationSeconds: 0,
              });
            }
          }
        });
      });

      return unsub;
    },
  };
});
