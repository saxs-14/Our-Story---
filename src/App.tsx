import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import { useAppStore } from '@/store/useAppStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { setHapticsEnabled } from '@/lib/haptics';

import { useAuthStore } from '@/store/useAuthStore';
import { AuroraBackground } from '@/components/fx/AuroraBackground';
import { ParticleField } from '@/components/fx/ParticleField';
import { BottomNav } from '@/components/layout/BottomNav';
import { CinematicIntro } from '@/components/intro/CinematicIntro';
import { LoginGate } from '@/components/auth/LoginGate';
import { AchievementWatcher } from '@/components/system/AchievementWatcher';
import { CelebrationMode } from '@/components/system/CelebrationMode';
import { MusicPlayer } from '@/components/system/MusicPlayer';
import { ChatNotifier } from '@/components/system/ChatNotifier';
import { HeartFilledIcon } from '@/components/icons';

const Home = lazy(() => import('@/pages/Home'));
const Chat = lazy(() => import('@/pages/Chat'));
const Vault = lazy(() => import('@/pages/Vault'));
const Reasons = lazy(() => import('@/pages/Reasons'));
const Timeline = lazy(() => import('@/pages/Timeline'));
const Gallery = lazy(() => import('@/pages/Gallery'));
const Garden = lazy(() => import('@/pages/Garden'));
const Dreams = lazy(() => import('@/pages/Dreams'));
const Letters = lazy(() => import('@/pages/Letters'));
const Statistics = lazy(() => import('@/pages/Statistics'));
const Wrapped = lazy(() => import('@/pages/Wrapped'));
const Secret = lazy(() => import('@/pages/Secret'));
const Settings = lazy(() => import('@/pages/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const main = document.querySelector('main');
    main?.focus?.();
  }, [pathname]);
  return null;
}

function Loader() {
  return (
    <div className="flex min-h-dvh items-center justify-center" aria-label="Loading" role="status">
      <motion.span
        className="text-rosegold-500"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <HeartFilledIcon width={42} height={42} />
      </motion.span>
    </div>
  );
}

export default function App() {
  useApplyTheme();
  const reduce = useReducedMotion();
  const location = useLocation();
  const navigate = useNavigate();

  const introSeen = useAppStore((s) => s.introSeen);
  const markIntroSeen = useAppStore((s) => s.markIntroSeen);
  const touchVisit = useAppStore((s) => s.touchVisit);
  const hapticsOn = useAppStore((s) => s.hapticsOn);
  const ambientOn = useAppStore((s) => s.ambientOn);
  const registerVisit = useProgressStore((s) => s.registerVisit);
  const userId = useAuthStore((s) => s.userId);

  const [showIntro, setShowIntro] = useState(!introSeen);

  useEffect(() => {
    setHapticsEnabled(hapticsOn);
  }, [hapticsOn]);

  useEffect(() => {
    registerVisit();
    touchVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishIntro = () => {
    markIntroSeen();
    setShowIntro(false);
  };

  return (
    <>
      <AuroraBackground />
      {ambientOn && !reduce && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-[5] opacity-50">
          <ParticleField kind="petals" density={18} />
        </div>
      )}

      <AnimatePresence>
        {showIntro && <CinematicIntro key="intro" onDone={finishIntro} />}
      </AnimatePresence>

      <AnimatePresence>
        {!showIntro && !userId && <LoginGate key="login" />}
      </AnimatePresence>

      {!showIntro && userId && (
        <>
          <ScrollToTop />
          <AchievementWatcher />
          <CelebrationMode />
          <ChatNotifier />
          <MusicPlayer />

          <Suspense fallback={<Loader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home onReplayIntro={() => { setShowIntro(true); navigate('/'); }} />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/vault" element={<Vault />} />
                <Route path="/reasons" element={<Reasons />} />
                <Route path="/timeline" element={<Timeline />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/garden" element={<Garden />} />
                <Route path="/dreams" element={<Dreams />} />
                <Route path="/letters" element={<Letters />} />
                <Route path="/statistics" element={<Statistics />} />
                <Route path="/wrapped" element={<Wrapped />} />
                <Route path="/secret" element={<Secret />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </Suspense>

          <BottomNav />
        </>
      )}
    </>
  );
}
