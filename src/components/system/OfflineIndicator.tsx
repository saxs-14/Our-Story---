/**
 * The only signal anywhere in the app for the user's OWN connectivity —
 * everything else (chat "online"/"offline") reflects the partner's
 * presence, not the local device's network state. Without this, a genuine
 * network drop looks identical to nothing happening: sends silently queue
 * or fail (see useChatStore.ts's mediaError/failed-message handling), and
 * there was previously no visible cue that the device itself was offline.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' && 'onLine' in navigator ? !navigator.onLine : false,
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          // pointer-events-none on the wrapper: this is a full-width strip
          // (inset-x-0) at the same vertical band as several other fixed UI
          // elements (e.g. MediaViewerModal's close button) — without this,
          // a purely informational banner would silently swallow taps
          // across its whole width, not just its visible pill, at a higher
          // z-index than what it's covering. Re-enabled on the pill itself
          // since that's the only part that's ever meant to be seen/touched.
          className="pointer-events-none fixed inset-x-0 z-[90] flex justify-center px-3"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
          role="status"
          aria-live="polite"
        >
          <div className="glass-strong flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-[color:var(--ink-strong)] shadow-glass-lg">
            <span className="h-2 w-2 shrink-0 rounded-full bg-rosegold-500" />
            You're offline — messages will send once you're back online
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
