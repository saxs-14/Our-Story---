import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallStore } from '@/store/useCallStore';
import { useAuthStore, personById, partnerOf } from '@/store/useAuthStore';
import { useContentStore } from '@/store/useContentStore';
import { useMediaUrl } from '@/hooks/useMediaUrl';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CallModal() {
  const {
    callState,
    callType,
    callerName,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    durationSeconds,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
    listenForIncomingCalls,
  } = useCallStore();

  const userId = useAuthStore((s) => s.userId);
  const playSound = useSound();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // App-wide incoming call listener
  useEffect(() => {
    if (!userId) return;
    const unsub = listenForIncomingCalls(userId);
    return () => unsub?.();
  }, [userId, listenForIncomingCalls]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callState]);

  // Sound effects for ringing
  useEffect(() => {
    if (callState === 'incoming' || callState === 'calling') {
      const interval = setInterval(() => {
        playSound('sparkle');
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [callState, playSound]);

  if (callState === 'idle') return null;

  const partnerId = userId ? partnerOf(userId) : 'her';
  const partner = personById(partnerId);
  const partnerPhotoId = useContentStore.getState().profiles[partnerId]?.photoMediaId;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex flex-col items-center justify-between overflow-hidden p-6 text-warmwhite"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #20081a 0%, #110410 50%, #080208 100%)',
        }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        {/* Background Video Stream (if video call and connected) */}
        {callType === 'video' && remoteStream && (
          <div className="absolute inset-0 z-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </div>
        )}

        {/* --- TOP BAR / CALL STATUS --- */}
        <div className="relative z-10 flex w-full max-w-md items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center">
              <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-luxe text-rosegold-300">
              {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'}
            </span>
          </div>

          <div className="rounded-full bg-black/40 px-4 py-1 text-sm font-medium tabular-nums backdrop-blur-md">
            {callState === 'connected'
              ? formatDuration(durationSeconds)
              : callState === 'incoming'
              ? 'Incoming call…'
              : 'Calling…'}
          </div>
        </div>

        {/* --- CENTER: PARTNER AVATAR & AUDIO RIPPLE (Voice Mode or Before Video Connects) --- */}
        {(!remoteStream || callType === 'voice') && (
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
            {/* Audio Waves / Ripple Animation */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute h-44 w-44 rounded-full border border-rosegold-400/30"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute h-56 w-56 rounded-full border border-rosegold-300/20"
                animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />

              {/* Avatar circle */}
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-rosegold-400 bg-gradient-to-br from-[#b76e79] to-[#580816] shadow-[0_0_35px_rgba(227,70,95,0.5)]">
                {partnerPhotoId ? (
                  <img
                    src={useMediaUrl(partnerPhotoId) || ''}
                    alt={partner.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-display text-4xl font-bold text-warmwhite">
                    {partner.initial}
                  </span>
                )}
              </div>
            </div>

            <h2 className="mt-6 font-display text-3xl font-medium text-warmwhite">
              {callState === 'incoming' ? callerName : partner.nickname}
            </h2>
            <p className="mt-1 text-sm text-rosegold-200/80">
              {callState === 'connected'
                ? 'Connected ♥'
                : callState === 'incoming'
                ? 'wants to talk to you'
                : 'Ringing…'}
            </p>
          </div>
        )}

        {/* --- PICTURE-IN-PICTURE (PIP) LOCAL VIDEO (Video Mode) --- */}
        {callType === 'video' && localStream && (
          <motion.div
            drag
            dragConstraints={{ left: -100, right: 100, top: -200, bottom: 200 }}
            className="absolute bottom-28 right-6 z-20 h-44 w-32 overflow-hidden rounded-3xl border-2 border-rosegold-400/60 bg-black/80 shadow-2xl backdrop-blur-md"
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-xs text-rosegold-300">
                Camera Off
              </div>
            )}
          </motion.div>
        )}

        {/* --- BOTTOM CONTROLS BAR --- */}
        <div className="relative z-20 flex w-full max-w-sm items-center justify-around pb-6">
          {callState === 'incoming' ? (
            /* Incoming call: Accept or Decline */
            <div className="flex w-full items-center justify-around">
              {/* Reject / Decline */}
              <button
                type="button"
                onClick={() => {
                  haptic('soft');
                  void rejectCall();
                }}
                className="tap flex h-16 w-16 flex-col items-center justify-center rounded-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-transform active:scale-90"
                aria-label="Decline call"
              >
                <span className="text-2xl">✕</span>
              </button>

              {/* Accept */}
              <button
                type="button"
                onClick={() => {
                  haptic('success');
                  void answerCall();
                }}
                className="tap flex h-20 w-20 flex-col items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.7)] transition-transform active:scale-90"
                aria-label="Accept call"
              >
                <span className="text-3xl">📞</span>
              </button>
            </div>
          ) : (
            /* Active call controls */
            <div className="flex w-full items-center justify-between gap-3">
              {/* Mic Toggle */}
              <button
                type="button"
                onClick={() => {
                  haptic('tap');
                  toggleMute();
                }}
                className={`tap flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                  isMuted ? 'bg-red-500/80 text-white' : 'bg-warmwhite/20 text-warmwhite'
                }`}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <span className="text-xl">{isMuted ? '🔇' : '🎙️'}</span>
              </button>

              {/* Video Camera Toggle (if video call) */}
              {callType === 'video' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      haptic('tap');
                      toggleVideo();
                    }}
                    className={`tap flex h-14 w-14 items-center justify-center rounded-full backdrop-blur-md transition-all ${
                      isVideoOff ? 'bg-red-500/80 text-white' : 'bg-warmwhite/20 text-warmwhite'
                    }`}
                    aria-label={isVideoOff ? 'Turn video on' : 'Turn video off'}
                  >
                    <span className="text-xl">{isVideoOff ? '🚫' : '📹'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      haptic('tap');
                      switchCamera();
                    }}
                    className="tap flex h-14 w-14 items-center justify-center rounded-full bg-warmwhite/20 text-warmwhite backdrop-blur-md"
                    aria-label="Switch camera"
                  >
                    <span className="text-xl">🔄</span>
                  </button>
                </>
              )}

              {/* End Call Button */}
              <button
                type="button"
                onClick={() => {
                  haptic('soft');
                  void endCall();
                }}
                className="tap flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-[0_0_25px_rgba(220,38,38,0.7)] transition-transform active:scale-90"
                aria-label="End call"
              >
                <span className="text-2xl">🔴</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
