import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { CloseIcon } from '@/components/icons';
import { VAULT, type OpenWhenLetter } from '@/data/vault';
import { useProgressStore } from '@/store/useProgressStore';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';

function EnvelopeCard({ letter, onOpen, opened }: { letter: OpenWhenLetter; onOpen: () => void; opened: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onOpen}
      className="tap group relative block w-full text-left"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-glass" style={{ background: 'linear-gradient(150deg, #fff8f1, #f3ddd4)' }}>
        {/* envelope flap */}
        <div
          className="absolute inset-x-0 top-0 h-1/2 origin-top"
          style={{
            background: 'linear-gradient(160deg, #f6ddd2, #e9c3b7)',
            clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
          }}
        />
        {/* wax seal */}
        <div
          className="absolute left-1/2 top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-lg shadow-soft"
          style={{ background: `radial-gradient(circle at 35% 30%, ${letter.seal}, ${letter.seal}cc)` }}
        >
          <span aria-hidden>{letter.emoji}</span>
        </div>
        {opened && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-warmwhite/80 px-2 py-0.5 text-[0.55rem] uppercase tracking-luxe text-rosegold-600">
            opened
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <p className="text-[0.6rem] uppercase tracking-luxe text-plum-700/70">Open when</p>
          <p className="font-display text-base leading-tight text-plum-900">{letter.tab}</p>
        </div>
      </div>
    </motion.button>
  );
}

function LetterView({ letter, onClose }: { letter: OpenWhenLetter; onClose: () => void }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button type="button" aria-label="Close letter" className="absolute inset-0 bg-plum-900/55 backdrop-blur-md" onClick={onClose} />

      <motion.div
        role="dialog"
        aria-label={letter.occasion}
        className="perspective relative z-10 w-full max-w-md"
      >
        {/* Envelope opening */}
        {!reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-x-6 top-0 z-20 h-24 origin-top"
            style={{ background: 'linear-gradient(160deg, #f6ddd2, #e9c3b7)', clipPath: 'polygon(0 0,100% 0,50% 100%)' }}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: -165 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Letter paper sliding out */}
        <motion.div
          className="glass-strong relative z-10 max-h-[80dvh] overflow-y-auto rounded-4xl p-7 shadow-glass-lg"
          initial={{ y: reduce ? 0 : 60, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-luxe text-rosegold-500">{letter.occasion}</p>
            <button type="button" aria-label="Close" onClick={onClose} className="tap flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ink-soft)]">
              <CloseIcon width={20} height={20} />
            </button>
          </div>
          <div className="space-y-4 font-serif text-lg leading-relaxed text-[color:var(--ink-strong)]">
            {letter.body.map((p, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (reduce ? 0 : 0.5) + i * 0.12 }}
              >
                {p}
              </motion.p>
            ))}
          </div>
          {letter.media?.song && (
            <p className="mt-5 rounded-2xl bg-rosegold-100/60 px-4 py-2 text-sm text-rosegold-700">
              🎵 {letter.media.song.title} — {letter.media.song.artist}
            </p>
          )}
          <p className="mt-6 text-right font-script text-2xl text-rosegold-600">— Phathu</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function Vault() {
  const opened = useProgressStore((s) => s.vaultOpened);
  const openVault = useProgressStore((s) => s.openVault);
  const playSound = useSound();
  const [active, setActive] = useState<OpenWhenLetter | null>(null);

  const open = (letter: OpenWhenLetter) => {
    haptic('soft');
    playSound('open');
    openVault(letter.id);
    setActive(letter);
  };

  return (
    <PageShell
      eyebrow="The Open When vault"
      title="Open when…"
      subtitle="Sealed letters for every kind of day. Open the one that fits how you feel — I wrote each just for you."
    >
      <div className="grid grid-cols-2 gap-4">
        {VAULT.map((letter, i) => (
          <motion.div
            key={letter.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <EnvelopeCard letter={letter} opened={opened.includes(letter.id)} onOpen={() => open(letter)} />
          </motion.div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-[color:var(--ink-soft)]">
        {opened.length} of {VAULT.length} opened
      </p>

      <AnimatePresence>{active && <LetterView letter={active} onClose={() => setActive(null)} />}</AnimatePresence>
    </PageShell>
  );
}
