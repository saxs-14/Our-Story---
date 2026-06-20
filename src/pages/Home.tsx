import { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { IconButton } from '@/components/ui/Button';
import { SettingsIcon, SparkleIcon, ChevronRightIcon, HeartFilledIcon } from '@/components/icons';

import relationship, { fullPairing } from '@/config/relationship';
import { elapsedSince, formatLongDate } from '@/lib/time';
import { useNow } from '@/hooks/useNow';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { noteForToday } from '@/data/dailyMessages';
import { dailyWeather, generateWeather, indexLabel, type LoveWeather } from '@/data/loveWeather';
import { complimentFor } from '@/data/compliments';
import { useProgressStore } from '@/store/useProgressStore';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';
import { useLiveWeather } from '@/hooks/useLiveWeather';
import { Portraits } from '@/components/home/Portraits';

const CrystalHeart = lazy(() => import('@/components/three/CrystalHeart'));

const COUNTER_KEYS = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'] as const;

function HeartFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <motion.div
        className="h-28 w-28 rounded-full bg-gradient-to-br from-rosegold-300 to-champagne-300 blur-md"
        animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export default function Home({ onReplayIntro }: { onReplayIntro?: () => void }) {
  const now = useNow(1000);
  const reduce = useReducedMotion();
  const playSound = useSound();
  const checkWeather = useProgressStore((s) => s.checkWeather);
  const { weather: live } = useLiveWeather();

  const duration = elapsedSince(relationship.relationshipStart, now);
  const friendDuration = elapsedSince(relationship.friendshipStart, now);

  const [weatherSeed, setWeatherSeed] = useState(0);
  const weather: LoveWeather = useMemo(
    () => (weatherSeed === 0 ? dailyWeather(now) : generateWeather(`shuffle-${weatherSeed}`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weatherSeed],
  );
  const note = useMemo(() => noteForToday(now), [now.getDate()]); // eslint-disable-line react-hooks/exhaustive-deps
  const compliment = useMemo(() => complimentFor(`home-${now.toDateString()}`), [now.getDate()]); // eslint-disable-line react-hooks/exhaustive-deps

  const shuffleWeather = () => {
    haptic('soft');
    playSound('sparkle');
    checkWeather();
    setWeatherSeed((s) => s + 1);
  };

  return (
    <PageShell>
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-luxe text-rosegold-500">Our Story</p>
          <p className="text-sm text-[color:var(--ink-soft)]">{fullPairing}</p>
        </div>
        <div className="flex gap-2">
          {onReplayIntro && (
            <IconButton label="Replay intro" onClick={onReplayIntro}>
              <SparkleIcon width={20} height={20} />
            </IconButton>
          )}
          <Link to="/settings" aria-label="Settings">
            <IconButton label="Settings">
              <SettingsIcon width={20} height={20} />
            </IconButton>
          </Link>
        </div>
      </div>

      {/* The two of us */}
      <Portraits />

      {/* Crystal heart hero */}
      <div className="relative mx-auto h-[44vh] max-h-[420px] min-h-[300px] w-full">
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(circle at 50% 46%, rgba(247,217,217,0.6), rgba(212,175,122,0.2) 42%, transparent 70%)',
          }}
        />
        <Suspense fallback={<HeartFallback />}>
          <CrystalHeart />
        </Suspense>
      </div>

      {/* Headline + live counter */}
      <motion.div
        className="mt-2 text-center"
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="font-display text-3xl font-medium leading-tight text-[color:var(--ink-strong)] sm:text-4xl">
          We've been writing our story for…
        </h1>
        <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
          Since {formatLongDate(relationship.relationshipStart)}
        </p>
      </motion.div>

      <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {COUNTER_KEYS.map((key) => (
          <GlassCard key={key} className="px-1 py-3 text-center">
            <div className="font-display text-2xl font-semibold tabular-nums text-rosegold-700 sm:text-3xl">
              {String(duration[key]).padStart(2, '0')}
            </div>
            <div className="mt-0.5 text-[0.6rem] uppercase tracking-wide text-[color:var(--ink-soft)]">
              {key}
            </div>
          </GlassCard>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-[color:var(--ink-soft)]">
        …and {friendDuration.years > 0 ? `${friendDuration.years} year${friendDuration.years > 1 ? 's' : ''} & ` : ''}
        {friendDuration.months} months of friendship before that 🌱
      </p>

      {/* Love weather */}
      <motion.div layout className="mt-7">
        <button
          type="button"
          onClick={shuffleWeather}
          aria-label="Refresh love forecast"
          className="block w-full text-left"
        >
          <GlassCard className="relative overflow-hidden p-5">
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{
                background: `linear-gradient(135deg, ${weather.gradient[0]}, ${weather.gradient[1]})`,
              }}
            />
            <div className="relative">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium uppercase tracking-luxe text-plum-700/80">
                  Love Weather
                </p>
                <span className="rounded-full bg-warmwhite/60 px-2 py-0.5 text-[0.6rem] text-plum-700">
                  tap to refresh
                </span>
              </div>
              {live && (
                <div className="mt-2 flex items-center gap-2 rounded-full bg-warmwhite/55 px-3 py-1.5 text-sm text-plum-800">
                  <span aria-hidden className="text-base">{live.emoji}</span>
                  <span className="font-semibold tabular-nums">{live.tempC}°</span>
                  <span className="text-plum-700">· {live.label} where you are</span>
                </div>
              )}
              <p className="mt-2 font-display text-2xl font-medium leading-snug text-plum-900">
                {weather.headline}
              </p>
              <p className="mt-1.5 text-sm text-plum-700">{live ? live.loveLine : weather.detail}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-warmwhite/50">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-rosegold-400 to-champagne-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${weather.index}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums text-plum-900">
                  {weather.index}%
                </span>
              </div>
              <p className="mt-1 text-[0.65rem] uppercase tracking-luxe text-plum-700/70">
                {indexLabel(weather.headline)}
              </p>
            </div>
          </GlassCard>
        </button>
      </motion.div>

      {/* Daily note */}
      <motion.div
        className="mt-4"
        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <GlassCard strong className="p-6">
          <p className="text-xs font-medium uppercase tracking-luxe text-rosegold-500">
            A note for today · {note.voice}
          </p>
          <p className="mt-2 font-serif text-xl leading-relaxed text-[color:var(--ink-strong)]">
            “{note.text}”
          </p>
        </GlassCard>
      </motion.div>

      {/* Compliment chip */}
      <p className="mt-4 text-center font-script text-2xl text-rosegold-600">{compliment}</p>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {[
          { to: '/vault', label: 'Open When…', desc: 'A letter for how you feel' },
          { to: '/wrapped', label: 'Our Wrapped', desc: 'Replay our story' },
          { to: '/garden', label: 'Our Garden', desc: 'Watch us grow' },
          { to: '/reasons', label: '500 Reasons', desc: 'Why I love you' },
        ].map((q) => (
          <Link key={q.to} to={q.to} onClick={() => haptic('tap')}>
            <GlassCard className="flex h-full items-center justify-between p-4 transition-transform active:scale-95">
              <div>
                <p className="font-display text-lg text-[color:var(--ink-strong)]">{q.label}</p>
                <p className="text-xs text-[color:var(--ink-soft)]">{q.desc}</p>
              </div>
              <ChevronRightIcon className="text-rosegold-500" width={20} height={20} />
            </GlassCard>
          </Link>
        ))}
      </div>

      {/* Faith & devotion — for Ayanda */}
      <GlassCard strong className="mt-4 p-5">
        <p className="text-xs font-medium uppercase tracking-luxe text-champagne-600">🙏 Faith & Love</p>
        <p className="mt-2 font-serif text-lg leading-relaxed text-[color:var(--ink-strong)]">
          "Two are better than one, because they have a good return for their labour: if either of them falls down, one can help the other up."
        </p>
        <p className="mt-2 text-xs text-[color:var(--ink-soft)]">Ecclesiastes 4:9–10 · A verse for us</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-lg">✝️</span>
          <p className="text-sm text-[color:var(--ink-soft)]">
            Ayanda's faith is the anchor of her heart — and it makes her who she is. We keep God at the centre.
          </p>
        </div>
      </GlassCard>

      {/* A quiet doorway to the secret — for the curious heart that looks closely */}
      <div className="mt-10 flex flex-col items-center gap-1">
        <Link
          to="/secret"
          aria-label="A hidden place"
          onClick={() => haptic('soft')}
          className="tap text-rosegold-300/70 transition-colors hover:text-rosegold-500"
        >
          <HeartFilledIcon width={18} height={18} />
        </Link>
        <p className="font-script text-lg text-rosegold-400/80">{relationship.tagline}</p>
      </div>
    </PageShell>
  );
}
