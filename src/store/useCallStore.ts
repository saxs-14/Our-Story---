import { create } from 'zustand';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '@/lib/firebase';
import { webrtc } from '@/lib/webrtc';
import type { PersonId } from '@/store/useAuthStore';
import { personById, partnerOf, useAuthStore } from '@/store/useAuthStore';
import { logCallEvent } from '@/store/useChatStore';

const RING_TIMEOUT_MS = 45_000;

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
  isReconnecting: boolean;
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
let ringTimeout: number | null = null;

function clearRingTimeout() {
  if (ringTimeout) {
    clearTimeout(ringTimeout);
    ringTimeout = null;
  }
}

export const useCallStore = create<CallStore>((set, get) => {
  // Bind WebRTC events to store
  webrtc.onRemoteStream = (remoteStream) => {
    set({ remoteStream });
  };

  webrtc.onReconnecting = (isReconnecting) => set({ isReconnecting });

  webrtc.onCallConnected = () => {
    clearRingTimeout();
    set({ callState: 'connected', isReconnecting: false });
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = window.setInterval(() => {
      set((s) => ({ durationSeconds: s.durationSeconds + 1 }));
    }, 1000);
  };

  webrtc.onCallEnded = () => {
    clearRingTimeout();
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    // Only the caller's device logs the outcome, so a completed/missed call
    // doesn't get written twice (once from each side). Skip logging if the
    // call was already idle/reset when this fired (avoids double-logging).
    const { callState, callerId, calleeId, callerName, callType, durationSeconds } = get();
    const localUserId = useAuthStore.getState().userId;
    const wasActive = callState === 'connected' || callState === 'calling' || callState === 'incoming';
    if (callerId && calleeId && localUserId === callerId && wasActive) {
      const outcome = callState === 'connected' ? 'completed' : 'missed';
      void logCallEvent(callerId, callerName, callType, outcome, durationSeconds);
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
      isReconnecting: false,
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
    isReconnecting: false,
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

        // No native "ringing" concept on this signaling layer — if the
        // callee's device never answers (offline, asleep, ignored), the
        // call would otherwise hang in 'calling' forever. Time it out like
        // a real phone.
        clearRingTimeout();
        ringTimeout = window.setTimeout(() => {
          if (get().callState === 'calling') void get().endCall();
        }, RING_TIMEOUT_MS);
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
