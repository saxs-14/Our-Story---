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

// STUN alone can only establish a direct peer-to-peer connection when at
// least one side is behind an easy (full-cone/restricted) NAT — it cannot
// get through symmetric NAT, which is exactly what most mobile-data/carrier
// connections use (very common on South African mobile networks). Without a
// relay fallback, two phones both on mobile data could complete the SDP
// handshake (the app would say "Connected") while zero actual audio/video
// ever flows. The Open Relay Project (metered.ca) publishes these TURN
// credentials publicly and for free, specifically for cases like this one —
// they're not a secret to protect, they're a shared community relay. It's a
// best-effort free service (rate/bandwidth limited, no SLA), not a
// replacement for a dedicated TURN account if call volume ever grows enough
// to need one, but it's a real, working fallback where today there was none.
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:openrelay.metered.ca:80' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
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
  // ICE candidates from the other side can arrive over Firestore before
  // this side has finished processing setRemoteDescription — two
  // independent onSnapshot listeners (one for the SDP answer/offer, one for
  // candidates) with no ordering guarantee between them. addIceCandidate()
  // before a remote description exists is unreliable across browsers
  // (Safari in particular has a real history of rejecting or silently
  // dropping early candidates). Queue anything that arrives too early and
  // flush it right after setRemoteDescription succeeds.
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private hasConnectedOnce = false;

  public onRemoteStream?: (stream: MediaStream) => void;
  public onCallEnded?: () => void;
  public onCallConnected?: () => void;
  public onReconnecting?: (reconnecting: boolean) => void;
  /** Fired when getUserMedia genuinely fails (permission denied, no device) —
   *  the call still proceeds with an empty stream so it doesn't crash, but
   *  the UI needs to tell the user why they can't be seen/heard instead of
   *  failing silently. */
  public onMediaError?: (message: string) => void;

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
      console.warn('Could not access real media devices, falling back to an empty stream:', err);
      const message =
        err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
          ? "Microphone/camera access was denied — the other person won't be able to see or hear you."
          : "Couldn't access your microphone/camera — the other person won't be able to see or hear you.";
      this.onMediaError?.(message);
      // Fallback: empty stream so the call attempt doesn't crash/throw —
      // the other side still gets a ring and can talk even if this side
      // can't be heard, rather than the whole call failing outright.
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
          // Actual "connected" is now reported by onconnectionstatechange
          // once ICE/DTLS genuinely completes (see createPeerConnection) —
          // this call used to fire here immediately on SDP exchange alone,
          // which meant the UI could say "Connected" while media never
          // actually flowed (e.g. NAT traversal failing with no TURN
          // fallback — see RTC_CONFIG).
          await this.flushPendingCandidates();
        }
      });

      // Listen for Callee ICE candidates
      const answerCandidatesRef = collection(db, 'calls', callId, 'answerCandidates');
      this.candidateUnsub = onSnapshot(answerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            void this.addIceCandidateSafely(change.doc.data() as RTCIceCandidateInit);
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
      await this.flushPendingCandidates();

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

      // Real "connected" now comes from onconnectionstatechange (see
      // createPeerConnection) once ICE/DTLS genuinely completes, not from
      // reaching this point in the signaling exchange — this line used to
      // fire immediately after sending the answer, so the UI could say
      // "Connected" the instant you tapped Accept, before any actual
      // media handshake happened.

      // Listen for Offer ICE candidates from caller
      const offerCandidatesRef = collection(db, 'calls', callId, 'offerCandidates');
      this.candidateUnsub = onSnapshot(offerCandidatesRef, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            void this.addIceCandidateSafely(change.doc.data() as RTCIceCandidateInit);
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

      // The single source of truth for "actually connected" — ICE/DTLS has
      // genuinely completed, meaning media really can flow. Previously
      // onCallConnected was invoked manually right after the SDP
      // offer/answer exchange (and, for whoever answered, even earlier —
      // the instant they tapped Accept) — the UI could say "Connected" and
      // start counting a timer while the underlying connection had not
      // actually succeeded, e.g. NAT traversal failing with no TURN
      // fallback (see RTC_CONFIG). onCallConnected only fires once per call
      // (hasConnectedOnce) — a later 'connected' after a reconnect blip just
      // clears the "Reconnecting…" banner below, it doesn't need to redo
      // the initial-connect side effects (starting the duration timer etc).
      if (state === 'connected') {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.onReconnecting?.(false);
        if (!this.hasConnectedOnce) {
          this.hasConnectedOnce = true;
          this.onCallConnected?.();
        }
        return;
      }

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
      }
    };

    return this.pc;
  }

  /** Add an ICE candidate if the remote description is already set;
   *  otherwise queue it for flushPendingCandidates() to apply once it is. */
  private async addIceCandidateSafely(candidate: RTCIceCandidateInit): Promise<void> {
    if (this.pc?.remoteDescription) {
      try {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Failed to add ICE candidate:', err);
      }
    } else {
      this.pendingCandidates.push(candidate);
    }
  }

  private async flushPendingCandidates(): Promise<void> {
    const queued = this.pendingCandidates;
    this.pendingCandidates = [];
    for (const candidate of queued) {
      try {
        await this.pc?.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Failed to add queued ICE candidate:', err);
      }
    }
  }

  public cleanup(): void {
    this.pendingCandidates = [];
    this.hasConnectedOnce = false;
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
