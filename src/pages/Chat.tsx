/**
 * Real-time chat page — powered by Firebase Firestore.
 * Works offline (messages queue and sync when reconnected).
 * Supports text, images, videos, and audio messages.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { useChatStore, type ChatMessage } from '@/store/useChatStore';
import { useAuthStore, personById, partnerOf } from '@/store/useAuthStore';
import { FIREBASE_CONFIGURED } from '@/lib/firebase';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

function formatTime(ms: number) {
  const d = new Date(ms);
  return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDay(ms: number) {
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
}

function MediaPreview({ url, type }: { url: string; type: 'image' | 'video' | 'audio' }) {
  if (type === 'image') {
    return (
      <img
        src={url}
        alt="Shared photo"
        className="mt-2 max-h-60 max-w-full rounded-2xl object-cover"
        loading="lazy"
      />
    );
  }
  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        className="mt-2 max-h-60 max-w-full rounded-2xl"
        preload="metadata"
      />
    );
  }
  return (
    <audio src={url} controls className="mt-2 w-full" preload="metadata" />
  );
}

function Bubble({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  return (
    <motion.div
      className={cn('flex max-w-[78%] flex-col', isMine ? 'self-end items-end' : 'self-start items-start')}
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {!isMine && (
        <p className="mb-0.5 px-2 text-[0.6rem] font-semibold uppercase tracking-luxe text-lavender-600">
          {msg.senderName}
        </p>
      )}
      <div
        className={cn(
          'rounded-3xl px-4 py-2.5 text-sm leading-relaxed shadow-soft',
          isMine
            ? 'rounded-br-md bg-gradient-to-br from-rosegold-500 to-rosegold-600 text-white'
            : 'rounded-bl-md bg-gradient-to-br from-lavender-100 to-lavender-200 text-plum-900',
          msg.local && 'opacity-70',
        )}
      >
        {msg.text && <p>{msg.text}</p>}
        {msg.mediaUrl && msg.mediaType && (
          <MediaPreview url={msg.mediaUrl} type={msg.mediaType} />
        )}
      </div>
      <div className={cn('mt-0.5 flex items-center gap-1 px-1 text-[0.55rem] text-[color:var(--ink-soft)]', isMine ? 'flex-row-reverse' : '')}>
        <span>{formatTime(msg.timestamp)}</span>
        {isMine && (
          <span className={msg.read ? 'text-rosegold-500' : ''}>
            {msg.read ? '✓✓' : msg.local ? '⏳' : '✓'}
          </span>
        )}
      </div>
    </motion.div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-[color:var(--ink-soft)]/20" />
      <span className="text-[0.6rem] font-medium uppercase tracking-luxe text-[color:var(--ink-soft)]">{label}</span>
      <div className="h-px flex-1 bg-[color:var(--ink-soft)]/20" />
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="mx-4 mb-2 rounded-2xl bg-champagne-100/80 px-4 py-2 text-center text-xs text-champagne-700">
      ☁️ Firebase not connected — messages saved locally only. See .env.example to enable sync.
    </div>
  );
}

export default function Chat() {
  const userId = useAuthStore((s) => s.userId);
  const { messages, unreadCount, sendMessage, sendMedia, markRead, uploading, uploadProgress } =
    useChatStore();
  const [text, setText] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ file: File; preview: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  if (!userId) return null;
  const me = personById(userId);
  const partner = personById(partnerOf(userId));

  // The app-wide ChatNotifier owns the Firestore subscription; here we just
  // mark the conversation read whenever it's open and new messages arrive.
  useEffect(() => {
    markRead(userId);
  }, [messages.length, userId, markRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !mediaPreview) return;
    haptic('tap');

    if (mediaPreview) {
      await sendMedia(mediaPreview.file, userId, me.nickname, trimmed);
      setMediaPreview(null);
      URL.revokeObjectURL(mediaPreview.preview);
    } else {
      await sendMessage(trimmed, userId, me.nickname);
    }
    setText('');
    textRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setMediaPreview({ file, preview });
  };

  // Group messages by day
  const grouped: Array<{ day: string; messages: ChatMessage[] }> = [];
  let lastDay = '';
  for (const msg of messages) {
    const day = formatDay(msg.timestamp);
    if (day !== lastDay) {
      grouped.push({ day, messages: [msg] });
      lastDay = day;
    } else {
      grouped[grouped.length - 1].messages.push(msg);
    }
  }

  return (
    <PageShell eyebrow={`${me.nickname} & ${partner.nickname}`} title="Our Chat" className="pb-0">
      {!FIREBASE_CONFIGURED && <OfflineBanner />}

      {/* Message list */}
      <div className="flex min-h-[60vh] flex-col gap-0.5 overflow-y-auto px-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="text-4xl">💬</span>
            <p className="font-display text-xl text-[color:var(--ink-strong)]">Start the conversation</p>
            <p className="text-sm text-[color:var(--ink-soft)]">
              Send a message, a photo, a voice note — anything. It stays between you two.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {grouped.map((group) => (
            <div key={group.day}>
              <DayDivider label={group.day} />
              <div className="flex flex-col gap-1.5">
                {group.messages.map((msg) => (
                  <Bubble key={msg.id} msg={msg} isMine={msg.senderId === userId} />
                ))}
              </div>
            </div>
          ))}
        </AnimatePresence>

        {/* Upload progress */}
        {uploading && (
          <div className="mt-3 rounded-2xl bg-warmwhite/70 p-3">
            <p className="mb-1 text-xs text-rosegold-600">Uploading… {uploadProgress}%</p>
            <div className="h-1.5 overflow-hidden rounded-full bg-warmwhite/50">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-rosegold-400 to-champagne-400"
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Media preview strip */}
      {mediaPreview && (
        <div className="relative mx-4 mb-2">
          {mediaPreview.file.type.startsWith('image/') ? (
            <img src={mediaPreview.preview} alt="Preview" className="h-24 rounded-2xl object-cover" />
          ) : mediaPreview.file.type.startsWith('video/') ? (
            <video src={mediaPreview.preview} className="h-24 rounded-2xl" />
          ) : (
            <div className="flex h-16 items-center gap-2 rounded-2xl bg-lavender-100 px-4">
              <span>🎵</span>
              <span className="text-sm text-plum-700">{mediaPreview.file.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => { URL.revokeObjectURL(mediaPreview.preview); setMediaPreview(null); }}
            className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rosegold-500 text-white text-xs shadow-md"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input bar */}
      <GlassCard strong className="sticky bottom-[calc(env(safe-area-inset-bottom)+4rem)] mx-4 mb-2 flex items-end gap-2 p-2">
        {/* Attach media */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,audio/*"
          className="hidden"
          onChange={handleFile}
        />
        <button
          type="button"
          aria-label="Attach photo, video or audio"
          onClick={() => fileRef.current?.click()}
          className="tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-rosegold-500 text-xl"
        >
          📎
        </button>

        {/* Text input */}
        <textarea
          ref={textRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Message ${partner.nickname}…`}
          rows={1}
          aria-label="Type a message"
          className="flex-1 resize-none bg-transparent py-2 text-sm text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none"
          style={{ maxHeight: '120px' }}
        />

        {/* Send button */}
        <motion.button
          type="button"
          aria-label="Send message"
          onClick={handleSend}
          whileTap={{ scale: 0.9 }}
          disabled={!text.trim() && !mediaPreview}
          className={cn(
            'tap flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition-all',
            (text.trim() || mediaPreview)
              ? 'bg-gradient-to-br from-rosegold-500 to-rosegold-600 shadow-md'
              : 'bg-warmwhite/50 text-[color:var(--ink-soft)]',
          )}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22 11 13 2 9l20-7Z" />
          </svg>
        </motion.button>
      </GlassCard>

      {/* Unread badge (if user scrolled up) */}
      {unreadCount > 0 && (
        <button
          type="button"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-32 right-5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-rosegold-500 text-white shadow-lg text-xs font-bold"
        >
          {unreadCount}
        </button>
      )}
    </PageShell>
  );
}
