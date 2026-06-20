import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, personById, type PersonId } from '@/store/useAuthStore';
import { useContentStore } from '@/store/useContentStore';
import { useMediaUrl } from '@/hooks/useMediaUrl';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { HeartFilledIcon } from '@/components/icons';
import { ParticleField } from '@/components/fx/ParticleField';
import relationship from '@/config/relationship';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';

function Avatar({ id, size = 80 }: { id: PersonId; size?: number }) {
  const photoId = useContentStore((s) => s.profiles[id].photoMediaId);
  const url = useMediaUrl(photoId);
  const person = personById(id);
  if (url) {
    return <img src={url} alt={person.name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="flex items-center justify-center rounded-full font-display font-semibold text-warmwhite"
      style={{ width: size, height: size, fontSize: size * 0.4, background: 'linear-gradient(135deg, #e2a294, #b76e79)' }}
    >
      {person.initial}
    </div>
  );
}

export function LoginGate() {
  const verify = useAuthStore((s) => s.verify);
  const login = useAuthStore((s) => s.login);
  const playSound = useSound();
  const [picked, setPicked] = useState<PersonId | null>(null);
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!picked) return;
    if (verify(picked, pw)) {
      haptic('success');
      playSound('unlock');
      void login(picked);
    } else {
      setError(true);
      haptic('soft');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden px-6"
      style={{ background: 'radial-gradient(circle at 50% 30%, #2a172a, #160b16 60%, #0d060d)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 opacity-50">
        <ParticleField kind="fireflies" density={22} />
      </div>

      <GlassCard strong className="relative w-full max-w-sm p-7 text-center">
        <span className="mx-auto mb-3 inline-flex text-rosegold-400">
          <HeartFilledIcon width={36} height={36} />
        </span>
        <h1 className="font-display text-3xl text-[color:var(--ink-strong)]">Welcome to Our Story</h1>

        <AnimatePresence mode="wait">
          {!picked ? (
            <motion.div key="who" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <p className="mb-5 mt-1 text-sm text-[color:var(--ink-soft)]">Who's opening it?</p>
              <div className="grid grid-cols-2 gap-3">
                {(['her', 'him'] as PersonId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { haptic('tap'); setPicked(id); }}
                    className="glass tap flex flex-col items-center gap-2 rounded-3xl p-4 transition-transform active:scale-95"
                  >
                    <Avatar id={id} />
                    <span className="font-medium text-[color:var(--ink-strong)]">{personById(id).nickname}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.form key="pw" onSubmit={submit} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="mb-4 mt-4 flex flex-col items-center gap-2">
                <Avatar id={picked} size={72} />
                <p className="text-sm text-[color:var(--ink-soft)]">
                  Hi {personById(picked).nickname} — what's the date our story began?
                </p>
              </div>
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(false); }}
                placeholder="DD/MM/YYYY"
                aria-label="Password: the date you started dating"
                aria-invalid={error}
                className="w-full rounded-2xl bg-warmwhite/70 px-4 py-3 text-center text-lg tracking-widest text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)]/60 focus:outline-none focus:ring-2 focus:ring-rosegold-300"
              />
              {error && (
                <p role="alert" className="mt-2 text-sm text-dustyrose-500">
                  Not quite — it's the day we made it official. 💗
                </p>
              )}
              <div className="mt-5 flex gap-2">
                <Button type="button" variant="ghost" onClick={() => { setPicked(null); setPw(''); setError(false); }}>
                  Back
                </Button>
                <Button type="submit" variant="primary" className="flex-1">
                  Come in ♥
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="mt-6 text-[0.65rem] text-[color:var(--ink-soft)]">
          A private place for {relationship.her.nickname} & {relationship.him.nickname}.
        </p>
      </GlassCard>
    </motion.div>
  );
}
