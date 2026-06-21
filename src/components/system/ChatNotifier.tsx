/**
 * App-wide chat notifier.
 *
 * Mounted once (logged-in branch of App) so the Firestore chat listener stays
 * alive on every page — not just the Chat page. When the partner sends a new
 * message while the app is open/backgrounded, it fires:
 *   • a system notification (Android app + supported browsers), and
 *   • an in-app banner (works everywhere, incl. iPhone PWA), and
 *   • a soft sound + haptic.
 * It ignores your own messages, the history loaded on launch, and stays quiet
 * while you're already on the Chat page.
 */
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore, personById, partnerOf } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { useSound } from '@/hooks/useSound';
import { haptic } from '@/lib/haptics';
import { ChatIcon } from '@/components/icons';
import {
  requestNotificationPermission,
  showMessageNotification,
  registerNotificationTap,
} from '@/lib/notify';

function previewOf(text: string, mediaType?: 'image' | 'video' | 'audio'): string {
  if (text?.trim()) return text;
  if (mediaType === 'image') return '📷 Photo';
  if (mediaType === 'video') return '🎬 Video';
  if (mediaType === 'audio') return '🎙️ Voice note';
  return 'New message';
}

export function ChatNotifier() {
  const userId = useAuthStore((s) => s.userId);
  const messages = useChatStore((s) => s.messages);
  const subscribe = useChatStore((s) => s.subscribe);
  const notificationsOn = useAppStore((s) => s.notificationsOn);
  const soundOn = useAppStore((s) => s.soundOn);
  const playSound = useSound();
  const location = useLocation();
  const navigate = useNavigate();

  const seen = useRef<Set<string>>(new Set());
  const sinceMs = useRef<number>(Date.now());
  const [toast, setToast] = useState<{ name: string; text: string } | null>(null);

  // Single app-wide subscription to the chat. Baseline resets per user.
  useEffect(() => {
    if (!userId) return;
    seen.current = new Set();
    sinceMs.current = Date.now();
    const unsub = subscribe(userId);
    return () => unsub?.();
  }, [userId, subscribe]);

  // Ask permission once after login (only if notifications are enabled).
  useEffect(() => {
    if (userId && notificationsOn) void requestNotificationPermission();
  }, [userId, notificationsOn]);

  // Tapping a native notification opens the chat.
  useEffect(() => {
    registerNotificationTap(() => navigate('/chat'));
  }, [navigate]);

  // Detect genuinely-new incoming messages and alert.
  useEffect(() => {
    if (!userId) return;
    const incoming = messages.filter((m) => {
      if (seen.current.has(m.id)) return false;
      seen.current.add(m.id);
      return (
        m.senderId !== userId && // not mine
        !m.local && // not an optimistic echo
        m.timestamp >= sinceMs.current // arrived after the app opened (skips backlog)
      );
    });
    if (incoming.length === 0) return;
    if (!notificationsOn) return;
    if (location.pathname === '/chat') return; // they can already see it

    const last = incoming[incoming.length - 1];
    const name = last.senderName || personById(partnerOf(userId)).nickname;
    const text = previewOf(last.text, last.mediaType);

    void showMessageNotification(name, text);
    if (soundOn) playSound('chime');
    haptic('soft');
    setToast({ name, text });
  }, [messages, userId, notificationsOn, soundOn, location.pathname, playSound]);

  // Auto-dismiss the in-app banner.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="chat-toast"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed inset-x-0 z-[80] flex justify-center px-3"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
          aria-live="polite"
        >
          <button
            type="button"
            onClick={() => { haptic('tap'); setToast(null); navigate('/chat'); }}
            className="glass-strong flex w-[min(420px,92vw)] items-center gap-3 rounded-2xl px-4 py-3 text-left shadow-glass-lg"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rosegold-500/15 text-rosegold-600">
              <ChatIcon width={18} height={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[color:var(--ink-strong)]">{toast.name}</span>
              <span className="block truncate text-xs text-[color:var(--ink-soft)]">{toast.text}</span>
            </span>
            <span className="shrink-0 text-[0.6rem] uppercase tracking-luxe text-rosegold-500">Open</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
