import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PRIMARY_NAV, MORE_NAV } from '@/config/navigation';
import { MenuIcon, CloseIcon, HeartFilledIcon } from '@/components/icons';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';
import { useProgressStore } from '@/store/useProgressStore';

/**
 * A floating glass dock: 5 primary destinations + a central "More" control
 * that opens a full-screen grid of every section (UX: bottom nav ≤5 items,
 * overflow lives in a discoverable menu).
 */
export function BottomNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const secretUnlocked = useProgressStore((s) => s.secretUnlocked);

  const moreItems = MORE_NAV.filter((n) => !n.secret || secretUnlocked);
  const moreActive = moreItems.some((n) => n.path === location.pathname);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
      >
        <div className="glass-strong flex items-center gap-1 rounded-full px-2 py-2 shadow-glass-lg">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => haptic('tap')}
              className="tap relative flex flex-col items-center justify-center rounded-full px-3 py-1.5"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-rosegold-300/40 to-champagne-300/40"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span
                    className={cn(
                      'relative z-10 transition-colors',
                      isActive ? 'text-rosegold-700' : 'text-[color:var(--ink-soft)]',
                    )}
                  >
                    <item.icon width={22} height={22} />
                  </span>
                  <span
                    className={cn(
                      'relative z-10 mt-0.5 text-[0.6rem] font-medium tracking-wide',
                      isActive ? 'text-rosegold-700' : 'text-[color:var(--ink-soft)]',
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          <button
            type="button"
            aria-label="More sections"
            aria-expanded={open}
            onClick={() => {
              haptic('tap');
              setOpen(true);
            }}
            className="tap relative flex flex-col items-center justify-center rounded-full px-3 py-1.5"
          >
            <span className={cn('relative z-10', moreActive ? 'text-rosegold-700' : 'text-[color:var(--ink-soft)]')}>
              <MenuIcon width={22} height={22} />
            </span>
            <span className={cn('relative z-10 mt-0.5 text-[0.6rem] font-medium tracking-wide', moreActive ? 'text-rosegold-700' : 'text-[color:var(--ink-soft)]')}>
              More
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-plum-900/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              role="dialog"
              aria-label="All sections"
              className="glass-strong relative z-10 mb-0 w-full max-w-lg rounded-t-5xl px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[color:var(--ink-soft)]/30" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl text-[color:var(--ink-strong)]">Explore our story</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="tap flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--ink-soft)]"
                >
                  <CloseIcon width={22} height={22} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {moreItems.map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.04 * i, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <NavLink
                      to={item.path}
                      onClick={() => {
                        haptic('tap');
                        setOpen(false);
                      }}
                      className={cn(
                        'glass flex h-full flex-col items-center gap-2 rounded-3xl px-2 py-4 text-center transition-transform active:scale-95',
                        item.secret && 'ring-1 ring-rosegold-300/50',
                      )}
                    >
                      <span className="text-rosegold-600">
                        {item.secret ? <HeartFilledIcon width={26} height={26} /> : <item.icon width={26} height={26} />}
                      </span>
                      <span className="text-xs font-medium text-[color:var(--ink-strong)]">{item.label}</span>
                    </NavLink>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
