/**
 * One-time "turn on notifications?" banner, shown after login.
 *
 * This exists because ChatNotifier previously tried to request permission
 * automatically in a useEffect right after login — which silently does
 * nothing on iOS Safari. iOS requires Notification.requestPermission() to
 * be called synchronously from within a real user gesture (a tap), not
 * from an effect that merely runs as a *consequence* of one; Safari treats
 * those as different things and won't show the prompt for the latter. This
 * banner's button click is a genuine tap, so the request actually works
 * there — and everywhere else too.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { requestNotificationPermission } from '@/lib/notify';
import { enablePushNotifications, isPushSupported, currentNotificationPermission } from '@/lib/push';
import { haptic } from '@/lib/haptics';
import { BellIcon, CloseIcon } from '@/components/icons';

export function NotificationPrompt() {
  const userId = useAuthStore((s) => s.userId);
  const notificationsOn = useAppStore((s) => s.notificationsOn);
  const dismissed = useAppStore((s) => s.notificationPromptDismissed);
  const dismiss = useAppStore((s) => s.dismissNotificationPrompt);
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);

  const show =
    Boolean(userId) &&
    notificationsOn &&
    !dismissed &&
    visible &&
    currentNotificationPermission() === 'default';

  const enable = async () => {
    if (!userId || busy) return;
    setBusy(true);
    haptic('tap');
    const granted = await requestNotificationPermission();
    if (granted && (await isPushSupported())) {
      await enablePushNotifications(userId);
    }
    setBusy(false);
    setVisible(false);
    dismiss();
  };

  const skip = () => {
    haptic('soft');
    setVisible(false);
    dismiss();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="notif-prompt"
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed inset-x-0 z-[79] flex justify-center px-3"
          style={{ top: 'calc(env(safe-area-inset-top) + 5rem)' }}
        >
          <div className="glass-strong flex w-[min(420px,92vw)] items-center gap-3 rounded-2xl px-4 py-3 shadow-glass-lg">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rosegold-500/15 text-rosegold-600">
              <BellIcon width={18} height={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[color:var(--ink-strong)]">
                Never miss a message ♥
              </span>
              <span className="block text-xs text-[color:var(--ink-soft)]">
                Turn on notifications for chats & calls
              </span>
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => void enable()}
              className="tap shrink-0 rounded-full bg-gradient-to-br from-rosegold-400 to-rosegold-600 px-3.5 py-1.5 text-xs font-semibold text-warmwhite disabled:opacity-60"
            >
              {busy ? '…' : 'Enable'}
            </button>
            <button
              type="button"
              aria-label="Not now"
              onClick={skip}
              className="tap shrink-0 text-[color:var(--ink-soft)]"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
