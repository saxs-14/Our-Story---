import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore, personById, partnerOf } from '@/store/useAuthStore';
import { useAppStore, type ChatWallpaperType } from '@/store/useAppStore';
import { useCallStore } from '@/store/useCallStore';
import { usePresenceStore } from '@/store/usePresenceStore';
import { useContentStore, getUploadPath } from '@/store/useContentStore';
import { useMediaUrl } from '@/hooks/useMediaUrl';
import { saveMedia } from '@/lib/idb';
import { CloseIcon, ChevronLeftIcon } from '@/components/icons';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';
import { useSound } from '@/hooks/useSound';

const QUICK_EMOJIS = ['❤️', '🌹', '🥹', '🔥', '❄️', '✨', '😘', '💍'];

function formatTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDay(ms: number) {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

function formatAudioDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** In-bubble Audio Voice Note Player */
function VoiceNoteBubble({
  audioUrl,
  duration,
  isMe,
}: {
  audioUrl: string;
  duration?: number;
  isMe: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<1 | 1.5 | 2>(1);

  const togglePlay = () => {
    if (!audioRef.current) return;
    haptic('tap');
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = speed;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleSpeed = () => {
    haptic('tap');
    const nextSpeed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || duration || 1;
    setCurrentTime(cur);
    setProgress(cur / dur);
  };

  const onEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  return (
    <div className="flex w-full min-w-[210px] max-w-[270px] items-center gap-2.5 py-1">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
        preload="metadata"
      />

      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          'tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base transition-transform active:scale-90',
          isMe
            ? 'bg-emerald-400 text-emerald-950 shadow-md'
            : 'bg-rosegold-500 text-warmwhite shadow-md',
        )}
        aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="flex flex-1 flex-col justify-center gap-1">
        {/* Waveform Bars */}
        <div className="flex h-6 items-center gap-[2.5px]">
          {Array.from({ length: 22 }).map((_, i) => {
            const barProgress = i / 22;
            const isPlayed = barProgress <= progress;
            const barHeight = 6 + ((Math.sin(i * 0.9) + 1) / 2) * 16;
            return (
              <div
                key={i}
                className={cn(
                  'w-[3px] rounded-full transition-all duration-150',
                  isPlayed
                    ? isMe
                      ? 'bg-emerald-300'
                      : 'bg-rosegold-300'
                    : isMe
                    ? 'bg-emerald-900/60'
                    : 'bg-white/20',
                )}
                style={{ height: `${barHeight}px` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[0.62rem] opacity-80">
          <span>{formatAudioDuration(isPlaying ? currentTime : duration || 0)}</span>
          <button
            type="button"
            onClick={toggleSpeed}
            className="tap rounded px-1 font-bold text-[0.6rem] bg-black/20 hover:bg-black/40"
          >
            {speed}×
          </button>
        </div>
      </div>
    </div>
  );
}

/** Chat Wallpaper Customizer Modal */
function WallpaperModal({ onClose }: { onClose: () => void }) {
  const userId = useAuthStore((s) => s.userId);
  const chatWallpaper = useAppStore((s) => s.chatWallpaper);
  const setChatWallpaper = useAppStore((s) => s.setChatWallpaper);
  const setChatCustomImage = useAppStore((s) => s.setChatCustomImage);
  const setChatCustomVideo = useAppStore((s) => s.setChatCustomVideo);
  const uploadMedia = useContentStore((s) => s.uploadMedia);
  const [videoInput, setVideoInput] = useState('');

  const PRESETS: { type: ChatWallpaperType; label: string; preview: string }[] = [
    { type: 'doodle', label: 'WhatsApp Doodle', preview: 'bg-[#0b141a]' },
    { type: 'velvet', label: 'Midnight Velvet', preview: 'bg-gradient-to-b from-[#2a0b1c] to-[#0b020a]' },
    { type: 'emerald', label: 'WhatsApp Emerald', preview: 'bg-gradient-to-b from-[#082a20] to-[#04120e]' },
    { type: 'dark', label: 'AMOLED Charcoal', preview: 'bg-[#000000]' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-label="Customize Chat Wallpaper"
        className="glass-strong relative z-10 w-full max-w-md rounded-4xl border border-rosegold-400/30 p-6 shadow-2xl"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-luxe text-rosegold-400">Personalize Chat</span>
            <h2 className="font-display text-2xl text-warmwhite">Chat Wallpaper</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="tap flex h-9 w-9 items-center justify-center rounded-full text-rosegold-300 hover:text-white"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        {/* Preset Wallpapers */}
        <label className="mb-2 block text-xs uppercase tracking-luxe text-rosegold-400">
          Preset Themes
        </label>
        <div className="mb-4 grid grid-cols-2 gap-2.5">
          {PRESETS.map((p) => (
            <button
              key={p.type}
              onClick={() => {
                haptic('success');
                setChatWallpaper(p.type);
                onClose();
              }}
              className={cn(
                'tap flex flex-col items-center gap-2 rounded-2xl border p-3 text-xs transition-all',
                p.preview,
                chatWallpaper === p.type
                  ? 'border-emerald-400 ring-2 ring-emerald-400/50 font-bold text-warmwhite'
                  : 'border-white/10 text-rosegold-200/70 hover:border-white/30',
              )}
            >
              <div className="h-10 w-full rounded-xl border border-white/10 opacity-80" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Image Upload */}
        <label className="mb-2 block text-xs uppercase tracking-luxe text-rosegold-400">
          Custom Photo Wallpaper
        </label>
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            id="chat-bg-file"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file || !userId) return;
              // Save locally first (IndexedDB) so the wallpaper shows instantly
              // and survives reload even before the cloud upload finishes —
              // then close right away; the cloud upload finishes in the background.
              const record = await saveMedia(file, file.name);
              setChatCustomImage(record.id, null);
              haptic('success');
              onClose();
              void uploadMedia(file, getUploadPath(userId, file.name)).then((url) => {
                if (url) setChatCustomImage(record.id, url);
              });
            }}
          />
          <label
            htmlFor="chat-bg-file"
            className="tap flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-rosegold-400/40 bg-rosegold-500/10 p-3 text-xs text-warmwhite hover:bg-rosegold-500/20"
          >
            📷 Upload Image as Chat Background
          </label>
        </div>

        {/* Custom Video Upload */}
        <label className="mb-2 block text-xs uppercase tracking-luxe text-rosegold-400">
          Custom Video Background
        </label>
        <div className="mb-2">
          <input
            type="file"
            accept="video/*"
            id="chat-bg-video-file"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (!file || !userId) return;
              const record = await saveMedia(file, file.name);
              setChatCustomVideo(record.id, null);
              haptic('success');
              onClose();
              void uploadMedia(file, getUploadPath(userId, file.name)).then((url) => {
                if (url) setChatCustomVideo(record.id, url);
              });
            }}
          />
          <label
            htmlFor="chat-bg-video-file"
            className="tap flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-rosegold-400/40 bg-rosegold-500/10 p-3 text-xs text-warmwhite hover:bg-rosegold-500/20"
          >
            🎬 Upload Video as Chat Background
          </label>
        </div>

        <p className="mb-2 text-center text-[0.65rem] uppercase tracking-luxe text-rosegold-400/60">or paste a hosted URL</p>
        <div className="flex gap-2">
          <input
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            placeholder="https://example.com/video.mp4"
            className="w-full rounded-2xl bg-white/10 px-3.5 py-2 text-xs text-warmwhite placeholder:text-rosegold-200/40 focus:outline-none focus:ring-1 focus:ring-rosegold-400"
          />
          <button
            type="button"
            onClick={() => {
              if (videoInput.trim()) {
                haptic('success');
                setChatCustomVideo(null, videoInput.trim());
                setVideoInput('');
                onClose();
              }
            }}
            className="tap shrink-0 whitespace-nowrap rounded-2xl bg-rosegold-500 px-3 py-2 text-xs font-semibold text-warmwhite"
          >
            Apply
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReactionPicker({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="glass-strong absolute -top-12 left-2 z-30 flex items-center gap-1.5 rounded-full border border-rosegold-400/40 px-3 py-1.5 shadow-2xl backdrop-blur-xl"
      initial={{ scale: 0.8, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            haptic('tap');
            onSelect(emoji);
            onClose();
          }}
          className="tap text-lg transition-transform hover:scale-125"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}

/** Full-screen WhatsApp-style media viewer for a tapped image/video attachment. */
function MediaViewerModal({
  url,
  type,
  onClose,
}: {
  url: string;
  type: 'image' | 'video';
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/95 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="tap absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-warmwhite"
      >
        <CloseIcon width={22} height={22} />
      </button>
      {type === 'image' ? (
        <motion.img
          src={url}
          alt="Attachment"
          className="max-h-full max-w-full rounded-lg object-contain"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <motion.video
          src={url}
          controls
          autoPlay
          playsInline
          className="max-h-full max-w-full rounded-lg object-contain"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </motion.div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center justify-center">
      <span className="rounded-full bg-black/60 px-3.5 py-1 text-[0.62rem] font-bold uppercase tracking-widest text-rosegold-300 shadow-sm backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.userId);
  const {
    messages,
    partnerTyping,
    sendMessage,
    sendMedia,
    reactToMessage,
    setTyping,
    markRead,
    uploading,
    uploadProgress,
  } = useChatStore();

  const chatWallpaper = useAppStore((s) => s.chatWallpaper);
  const customImageCloudUrl = useAppStore((s) => s.chatCustomImageUrl);
  const customImageMediaId = useAppStore((s) => s.chatCustomImageMediaId);
  const customVideoCloudUrl = useAppStore((s) => s.chatCustomVideoUrl);
  const customVideoMediaId = useAppStore((s) => s.chatCustomVideoMediaId);
  const customImageLocalUrl = useMediaUrl(customImageMediaId);
  const customVideoLocalUrl = useMediaUrl(customVideoMediaId);
  // Cloud (Firebase Storage) URL wins once available — durable across
  // reloads and visible to both partners. Local IndexedDB blob covers the
  // gap before the upload finishes, or when Firebase isn't configured.
  const customImageUrl = customImageCloudUrl || customImageLocalUrl;
  const customVideoUrl = customVideoCloudUrl || customVideoLocalUrl;

  const startCall = useCallStore((s) => s.startCall);
  const partnerOnline = usePresenceStore((s) => s.partnerOnline);
  const playSound = useSound();

  const [text, setText] = useState('');
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);
  const [viewerMedia, setViewerMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Long-press (touch) or double-click (mouse) to open the reaction picker —
  // WhatsApp-style. A move beyond a small threshold cancels it, so scrolling
  // the message list doesn't accidentally trigger it.
  const pressRef = useRef<{ id: string; timer: number; x: number; y: number } | null>(null);
  const startPress = (id: string, x: number, y: number) => {
    pressRef.current = {
      id,
      x,
      y,
      timer: window.setTimeout(() => {
        haptic('soft');
        setSelectedMsgId(id);
        pressRef.current = null;
      }, 420),
    };
  };
  const movePress = (x: number, y: number) => {
    if (!pressRef.current) return;
    if (Math.hypot(x - pressRef.current.x, y - pressRef.current.y) > 10) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
  };
  const cancelPress = () => {
    if (pressRef.current) {
      clearTimeout(pressRef.current.timer);
      pressRef.current = null;
    }
  };

  // Audio Voice Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);

  const partnerId = userId ? partnerOf(userId) : 'her';
  const partner = personById(partnerId);
  const partnerPhotoId = useContentStore((s) => s.profiles[partnerId]?.photoMediaId);
  const partnerAvatarUrl = useMediaUrl(partnerPhotoId);

  useEffect(() => {
    if (userId) {
      markRead(userId);
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, userId, markRead]);

  // Lock pinch/double-tap zoom while in the chat — restore the normal
  // zoomable viewport everywhere else when leaving.
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const original = meta?.getAttribute('content') ?? null;
    meta?.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no');
    return () => {
      if (original !== null) meta?.setAttribute('content', original);
    };
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!userId) return;
    setTyping(userId, true);
    if (typingTimer.current) window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => {
      setTyping(userId, false);
    }, 2000);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !userId) return;
    haptic('soft');
    playSound('sparkle');
    const senderName = personById(userId).nickname;
    void sendMessage(text.trim(), userId, senderName);
    setText('');
    setTyping(userId, false);
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        if (recordSeconds >= 1 && userId) {
          const senderName = personById(userId).nickname;
          void sendMedia(audioBlob, userId, senderName, '🎙️ Voice Note', recordSeconds);
          haptic('success');
          playSound('sparkle');
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      haptic('tap');

      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      alert('Microphone access is required to record voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      haptic('soft');
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    haptic('success');
    const senderName = personById(userId).nickname;
    void sendMedia(file, userId, senderName, '📷 Media Attachment');
  };

  return (
    <PageShell bleed fixed>
      <div className="relative flex h-full flex-col overflow-hidden overscroll-none [touch-action:pan-y]">
        {/* ── CHAT WALLPAPERS ────────────────────────────────────────── */}
        {chatWallpaper === 'doodle' && (
          <div
            className="absolute inset-0 -z-10 bg-[#0b141a]"
            style={{
              backgroundImage: `radial-gradient(#1f2c34 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
        )}
        {chatWallpaper === 'velvet' && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#2a0b1c] via-[#150512] to-[#080208]" />
        )}
        {chatWallpaper === 'emerald' && (
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#082a20] via-[#051a14] to-[#020b08]" />
        )}
        {chatWallpaper === 'dark' && <div className="absolute inset-0 -z-10 bg-black" />}
        {chatWallpaper === 'custom-image' && customImageUrl && (
          <div
            className="absolute inset-0 -z-10 bg-cover bg-center"
            style={{ backgroundImage: `url(${customImageUrl})` }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          </div>
        )}
        {chatWallpaper === 'custom-video' && customVideoUrl && (
          <video
            autoPlay
            loop
            muted
            playsInline
            src={customVideoUrl}
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60"
          />
        )}

        {/* ── WHATSAPP APP BAR HEADER ───────────────────────────────── */}
        <div className="relative z-30 flex shrink-0 items-center justify-between border-b border-white/10 bg-[#1f2c34]/90 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.625rem)] text-warmwhite shadow-md backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {/* Back to Home */}
            <button
              type="button"
              aria-label="Back to Home"
              onClick={() => {
                haptic('tap');
                navigate('/');
              }}
              className="tap -ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-warmwhite hover:bg-white/10"
            >
              <ChevronLeftIcon width={22} height={22} />
            </button>

            {/* Avatar with live online beacon */}
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-emerald-500/60 shadow-md">
              {partnerAvatarUrl ? (
                <img src={partnerAvatarUrl} alt={partner.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-800 font-display text-lg font-bold text-white">
                  {partner.initial}
                </div>
              )}
              {partnerOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#1f2c34]" />
              )}
            </div>

            <div>
              <h2 className="font-display text-base font-bold leading-tight text-warmwhite">
                {partner.nickname}
              </h2>
              <p className={cn('text-[0.68rem]', partnerOnline ? 'text-emerald-400' : 'text-white/40')}>
                {partnerTyping ? 'typing…' : partnerOnline ? 'online ♥' : 'offline'}
              </p>
            </div>
          </div>

          {/* Calling Triggers & Wallpaper Switcher */}
          <div className="flex items-center gap-1.5">
            {/* Audio Call 📞 */}
            <button
              type="button"
              aria-label="Start Voice Call"
              onClick={() => {
                haptic('soft');
                if (userId) void startCall('voice', userId);
              }}
              className="tap flex h-9 w-9 items-center justify-center rounded-full text-emerald-400 hover:bg-white/10"
            >
              📞
            </button>

            {/* Video Call 📹 */}
            <button
              type="button"
              aria-label="Start Video Call"
              onClick={() => {
                haptic('soft');
                if (userId) void startCall('video', userId);
              }}
              className="tap flex h-9 w-9 items-center justify-center rounded-full text-emerald-400 hover:bg-white/10"
            >
              📹
            </button>

            {/* Wallpaper Settings */}
            <button
              type="button"
              aria-label="Change Wallpaper"
              onClick={() => {
                haptic('tap');
                setShowWallpaperModal(true);
              }}
              className="tap flex h-9 w-9 items-center justify-center rounded-full text-rosegold-300 hover:bg-white/10"
            >
              🎨
            </button>
          </div>
        </div>

        {/* ── CHAT MESSAGES SCROLL VIEW ─────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 [scrollbar-width:none] [touch-action:pan-y]">
          {messages.map((m, i) => {
            const isMe = m.senderId === userId;
            const prev = messages[i - 1];
            const showDay = !prev || formatDay(prev.timestamp) !== formatDay(m.timestamp);

            return (
              <React.Fragment key={m.id}>
                {showDay && <DayDivider label={formatDay(m.timestamp)} />}

                <div
                  className={cn(
                    'group relative mb-2 flex flex-col',
                    isMe ? 'items-end' : 'items-start',
                  )}
                >
                  <AnimatePresence>
                    {selectedMsgId === m.id && (
                      <ReactionPicker
                        onSelect={(emoji) => {
                          if (userId) void reactToMessage(m.id, userId, emoji);
                        }}
                        onClose={() => setSelectedMsgId(null)}
                      />
                    )}
                  </AnimatePresence>

                  {/* WhatsApp Speech Bubble */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    onDoubleClick={() => setSelectedMsgId(m.id)}
                    onPointerDown={(e) => startPress(m.id, e.clientX, e.clientY)}
                    onPointerMove={(e) => movePress(e.clientX, e.clientY)}
                    onPointerUp={cancelPress}
                    onPointerLeave={cancelPress}
                    onPointerCancel={cancelPress}
                    onContextMenu={(e) => e.preventDefault()}
                    className={cn(
                      'relative max-w-[82%] px-3.5 py-2 text-sm shadow-md transition-all [touch-action:pan-y]',
                      isMe
                        ? 'rounded-2xl rounded-tr-xs bg-[#005c4b] text-warmwhite shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
                        : 'rounded-2xl rounded-tl-xs bg-[#202c33] text-warmwhite shadow-[0_1px_2px_rgba(0,0,0,0.3)]',
                    )}
                  >
                    {/* Media Image / Video Attachment — tap to open full-screen viewer */}
                    {m.mediaUrl && m.mediaType === 'image' && (
                      <button
                        type="button"
                        aria-label="View image"
                        onClick={() => setViewerMedia({ url: m.mediaUrl!, type: 'image' })}
                        className="tap mb-1.5 block w-full overflow-hidden rounded-2xl border border-white/10"
                      >
                        <img
                          src={m.mediaUrl}
                          alt="Attachment"
                          className="max-h-60 w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    )}
                    {m.mediaUrl && m.mediaType === 'video' && (
                      <button
                        type="button"
                        aria-label="View video"
                        onClick={() => setViewerMedia({ url: m.mediaUrl!, type: 'video' })}
                        className="tap group/video relative mb-1.5 block w-full overflow-hidden rounded-2xl border border-white/10"
                      >
                        <video src={m.mediaUrl} className="max-h-60 w-full object-cover" preload="metadata" />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover/video:bg-black/30">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-2xl text-warmwhite">
                            ▶
                          </span>
                        </span>
                      </button>
                    )}

                    {/* Audio Voice Note Bubble */}
                    {m.mediaUrl && m.mediaType === 'audio' ? (
                      <VoiceNoteBubble
                        audioUrl={m.mediaUrl}
                        duration={m.audioDuration}
                        isMe={isMe}
                      />
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    )}

                    {/* Time & Double Checkmark status */}
                    <div className="mt-1 flex items-center justify-end gap-1 text-[0.62rem] text-white/60">
                      <span>{formatTime(m.timestamp)}</span>
                      {isMe && (
                        <span className="font-bold text-[#53bdeb]" title="Delivered & Read">
                          ✓✓
                        </span>
                      )}
                    </div>

                    {/* Reactions Pill */}
                    {m.reactions && Object.keys(m.reactions).length > 0 && (
                      <div className="absolute -bottom-2.5 right-2 flex items-center gap-0.5 rounded-full bg-[#111b21] px-2 py-0.5 text-xs shadow-md border border-white/10">
                        {Object.values(m.reactions).map((r, ri) => (
                          <span key={ri}>{r}</span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* ── UPLOAD PROGRESS BAR ───────────────────────────────────── */}
        {uploading && (
          <div className="h-1 w-full bg-emerald-950">
            <motion.div
              className="h-full bg-emerald-400"
              style={{ width: `${uploadProgress * 100}%` }}
            />
          </div>
        )}

        {/* ── BOTTOM DOCK: WHATSAPP INPUT & VOICE RECORDER ─────────── */}
        <div className="relative z-30 shrink-0 bg-[#202c33] px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          {isRecording ? (
            /* Live Voice Note Recorder Bar */
            <div className="flex items-center justify-between rounded-full bg-[#111b21] px-4 py-2 text-warmwhite shadow-inner">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 animate-ping rounded-full bg-rose-500" />
                <span className="font-mono text-sm font-semibold text-rose-400">
                  {formatAudioDuration(recordSeconds)}
                </span>
                <span className="text-xs text-rosegold-300">Recording voice note…</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="tap rounded-full bg-white/10 px-3 py-1 text-xs text-rose-300 hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="tap flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-black font-bold shadow-md"
                >
                  ✓
                </button>
              </div>
            </div>
          ) : (
            /* Standard WhatsApp Input Bar */
            <form onSubmit={handleSend} className="flex items-center gap-2">
              {/* Media Attachment Paperclip */}
              <input
                type="file"
                accept="image/*,video/*"
                id="chat-media-upload"
                className="hidden"
                onChange={handleFileSelected}
              />
              <label
                htmlFor="chat-media-upload"
                className="tap flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-rosegold-300 hover:bg-white/10 text-lg"
                title="Attach photo or video"
              >
                📎
              </label>

              {/* Text Input */}
              <div className="relative flex flex-1 items-center rounded-full bg-[#2a3942] px-4 py-2 shadow-inner">
                <input
                  type="text"
                  value={text}
                  onChange={handleTextChange}
                  placeholder="Message..."
                  aria-label="Type message"
                  className="w-full bg-transparent text-sm text-warmwhite placeholder:text-white/40 focus:outline-none"
                />
              </div>

              {/* Send Button or Voice Note Mic */}
              {text.trim() ? (
                <button
                  type="submit"
                  className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-lg transition-transform active:scale-90"
                  aria-label="Send message"
                >
                  ➤
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-lg transition-transform active:scale-90"
                  aria-label="Record voice note"
                >
                  🎙️
                </button>
              )}
            </form>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showWallpaperModal && <WallpaperModal onClose={() => setShowWallpaperModal(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {viewerMedia && (
          <MediaViewerModal
            url={viewerMedia.url}
            type={viewerMedia.type}
            onClose={() => setViewerMedia(null)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
