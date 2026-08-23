/**
 * Free WebRTC Peer-to-Peer Audio & Video Calling Service
 *
 * Uses public Google STUN servers (free) and Firebase Firestore for signaling.
 * Handles offers, answers, ICE candidates, local/remote media tracks, and cleanup.
 */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '@/lib/firebase';
import type { PersonId } from '@/store/useAuthStore';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export interface CallData {
  id: string;
  callerId: PersonId;
  callerName: string;
  calleeId: PersonId;
  type: 'voice' | 'video';
  status: 'offering' | 'connected' | 'rejected' | 'ended';
  createdAt: number;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
}

export class WebRTCService {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callDocId: string | null = null;
  private callUnsub: Unsubscribe | null = null;
  private candidateUnsub: Unsubscribe | null = null;
  private reconnectTimer: number | null = null;

  public onRemoteStream?: (stream: MediaStream) => void;
  public onCallEnded?: () => void;
  public onCallConnected?: () => void;
  public onReconnecting?: (reconnecting: boolean) => void;

  /** Initialize local audio / video stream */
  public async getLocalStream(type: 'voice' | 'video'): Promise<MediaStream> {
    // If a previous stream is still open, ensure all hardware tracks are stopped first
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      this.localStream = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn('Could not access real media devices, falling back to simulated stream:', err);
      // Fallback: create empty media stream so UI flows seamlessly
      const fallbackStream = new MediaStream();
      this.localStream = fallbackStream;
      return fallbackStream;
    }
  }

  /** Start an outgoing call to the partner */
  public async makeCall(
    type: 'voice' | 'video',
    callerId: PersonId,
    callerName: string,
    calleeId: PersonId,
  ): Promise<string> {
    const stream = await this.getLocalStream(type);
    this.createPeerConnection();

    stream.getTracks().forEach((track) => {
      if (this.pc && this.localStream) {
        this.pc.addTrack(track, this.localStream);
      }
    });

    const callId = `call-${callerId}-${Date.now()}`;
    this.callDocId = callId;

    if (FIREBASE_CONFIGURED && db) {
      const callDocRef = doc(db, 'calls', callId);
      const offerCandidatesRef = collection(db, 'calls', callId, 'offerCandidates');

      // Register local ICE candidates to Firestore
      this.pc!.onicecandidate = (event) => {
        if (event.candidate) {
          const candRef = doc(offerCandidatesRef);
          void setDoc(candRef, event.candidate.toJSON());
        }
      };

      // Create RTC Offer
      const offerDescription = await this.pc!.createOffer();
      await this.pc!.setLocalDescription(offerDescription);

      const callPayload = {
        callerId,
        callerName,
        calleeId,
        type,
        status: 'offering',
        offer: {
          type: offerDescription.type,
          sdp: offerDescription.sdp,
        },
        createdAt: Date.now(),
        timestamp: serverTimestamp(),
      };

      await setDoc(callDocRef, callPayload);

      // Listen for Answer from callee
      this.callUnsub = onSnapshot(callDocRef, async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;

        if (data.status === 'rejected' || data.status === 'ended') {
          this.endCall();
          return;
        }

        if (data.answer && !this.pc?.currentRemoteDescription) {
          const answerDescription = new RTCSessionDescription(data.answer);
          await this.pc?.setRemoteDescription(answerDescription);
          this.onCallConnected?.();
        }
      });

      // Listen for Callee ICE candidates
      const answerCandidatesRef = collection(db, 'calls', callId, 'answerCandidates');
      this.candidateUnsub = onSnapshot(answerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            void this.pc?.addIceCandidate(candidate);
          }
        });
      });
    }

    return callId;
  }

  /** Answer an incoming call */
  public async answerCall(callId: string, type: 'voice' | 'video'): Promise<void> {
    this.callDocId = callId;
    const stream = await this.getLocalStream(type);
    this.createPeerConnection();

    stream.getTracks().forEach((track) => {
      if (this.pc && this.localStream) {
        this.pc.addTrack(track, this.localStream);
      }
    });

    if (FIREBASE_CONFIGURED && db) {
      const callDocRef = doc(db, 'calls', callId);
      const callSnap = await getDoc(callDocRef);
      const callData = callSnap.data();

      if (!callData || !callData.offer) {
        throw new Error('Call offer not found');
      }

      const answerCandidatesRef = collection(db, 'calls', callId, 'answerCandidates');

      this.pc!.onicecandidate = (event) => {
        if (event.candidate) {
          const candRef = doc(answerCandidatesRef);
          void setDoc(candRef, event.candidate.toJSON());
        }
      };

      // Set Remote Description (Caller's Offer)
      const offerDescription = new RTCSessionDescription(callData.offer);
      await this.pc!.setRemoteDescription(offerDescription);

      // Create Local Answer
      const answerDescription = await this.pc!.createAnswer();
      await this.pc!.setLocalDescription(answerDescription);

      await updateDoc(callDocRef, {
        answer: {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        },
        status: 'connected',
      });

      this.onCallConnected?.();

      // Listen for Offer ICE candidates from caller
      const offerCandidatesRef = collection(db, 'calls', callId, 'offerCandidates');
      this.candidateUnsub = onSnapshot(offerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const candidate = new RTCIceCandidate(change.doc.data());
            void this.pc?.addIceCandidate(candidate);
          }
        });
      });

      // Listen for call termination
      this.callUnsub = onSnapshot(callDocRef, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'ended' || data?.status === 'rejected') {
          this.endCall();
        }
      });
    }
  }

  /** Reject an incoming call */
  public async rejectCall(callId: string): Promise<void> {
    if (FIREBASE_CONFIGURED && db) {
      const callDocRef = doc(db, 'calls', callId);
      await updateDoc(callDocRef, { status: 'rejected' }).catch(() => {});
    }
    this.cleanup();
  }

  /** Terminate the active call */
  public async endCall(): Promise<void> {
    if (this.callDocId && FIREBASE_CONFIGURED && db) {
      const callDocRef = doc(db, 'calls', this.callDocId);
      await updateDoc(callDocRef, { status: 'ended' }).catch(() => {});
      // Clean up doc after brief delay
      setTimeout(() => {
        if (this.callDocId && db) {
          deleteDoc(doc(db, 'calls', this.callDocId)).catch(() => {});
        }
      }, 5000);
    }
    this.cleanup();
    this.onCallEnded?.();
  }

  public toggleMute(muted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public toggleVideo(videoOff: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoOff;
      });
    }
  }

  public async switchCamera(): Promise<void> {
    if (!this.localStream) return;
    const currentTrack = this.localStream.getVideoTracks()[0];
    if (!currentTrack) return;

    try {
      const currentFacing = currentTrack.getSettings().facingMode;
      const newFacing = currentFacing === 'user' ? 'environment' : 'user';

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
      });
      const newTrack = newStream.getVideoTracks()[0];

      if (this.pc) {
        const sender = this.pc.getSenders().find((s) => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newTrack);
        }
      }

      currentTrack.stop();
      this.localStream.removeTrack(currentTrack);
      this.localStream.addTrack(newTrack);
    } catch (err) {
      console.warn('Could not switch camera:', err);
    }
  }

  private createPeerConnection(): RTCPeerConnection {
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();

    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream?.addTrack(track);
      });
      if (this.remoteStream) {
        this.onRemoteStream?.(this.remoteStream);
      }
    };

    this.pc.onconnectionstatechange = () => {
      const state = this.pc?.connectionState;

      // 'failed'/'closed' are terminal — no point waiting.
      if (state === 'failed' || state === 'closed') {
        this.endCall();
        return;
      }

      // 'disconnected' is often a brief blip (Wi-Fi <-> cellular handoff,
      // a dropped packet) that WebRTC recovers from on its own within a
      // few seconds — ending the call immediately here was hanging up on
      // momentary network hiccups instead of riding them out. Give it a
      // grace period, and nudge ICE to retry, before giving up for real.
      if (state === 'disconnected') {
        if (this.reconnectTimer) return; // already waiting
        this.onReconnecting?.(true);
        this.reconnectTimer = window.setTimeout(() => {
          this.reconnectTimer = null;
          if (this.pc?.connectionState === 'disconnected' || this.pc?.connectionState === 'failed') {
            this.endCall();
          }
        }, 10_000);
        try {
          this.pc?.restartIce();
        } catch {
          /* not supported everywhere — the timeout fallback still applies */
        }
        return;
      }

      // Recovered (back to 'connected') — cancel any pending grace-period end.
      if (state === 'connected' && this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
        this.onReconnecting?.(false);
      }
    };

    return this.pc;
  }

  public cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.callUnsub) {
      this.callUnsub();
      this.callUnsub = null;
    }
    if (this.candidateUnsub) {
      this.candidateUnsub();
      this.candidateUnsub = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
      this.remoteStream = null;
    }
    if (this.pc) {
      try {
        this.pc.getSenders().forEach((s) => {
          if (s.track) {
            try {
              s.track.stop();
            } catch {
              /* ignore */
            }
          }
        });
        this.pc.close();
      } catch {
        /* ignore */
      }
      this.pc = null;
    }
    this.callDocId = null;
  }
}

export const webrtc = new WebRTCService();
