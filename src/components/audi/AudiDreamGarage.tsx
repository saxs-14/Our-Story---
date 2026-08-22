import { useState } from 'react';
import { motion } from 'framer-motion';
import { AUDI_MODELS, type AudiModel } from '@/data/audiCars';
import { Button } from '@/components/ui/Button';
import { CloseIcon, SparkleIcon } from '@/components/icons';
import { useContentStore } from '@/store/useContentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { haptic } from '@/lib/haptics';
import { useSound } from '@/hooks/useSound';

interface Props {
  onClose: () => void;
}

const CATEGORIES = ['All', 'Supercar', 'Sportback & Wagon', 'Performance SUV', 'Electric GT', 'Pocket Rocket'];

export function AudiDreamGarage({ onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeCar, setActiveCar] = useState<AudiModel>(AUDI_MODELS[0]);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.userId);
  const addDream = useContentStore((s) => s.addDream);
  const playSound = useSound();

  const filtered =
    selectedCategory === 'All'
      ? AUDI_MODELS
      : AUDI_MODELS.filter((m) => m.category === selectedCategory);

  const saveCarToDreams = (car: AudiModel) => {
    if (!userId) return;
    haptic('success');
    playSound('sparkle');
    addDream({
      authorId: userId,
      title: `Our Dream ${car.name} 🚗💨`,
      note: `${car.tagline} · Road Trip: ${car.romanticRoadTrip}`,
      emoji: '🚗',
      category: 'Bucket List',
    });
    setSavedNote(`Added ${car.name} to Our Dreams board! ♥`);
    setTimeout(() => setSavedNote(null), 3000);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dark luxury backdrop */}
      <button
        type="button"
        aria-label="Close Audi Garage"
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-label="Audi Dream Garage"
        className="glass-strong relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-4xl border border-rosegold-400/40 shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        initial={{ scale: 0.94, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-xl font-bold text-warmwhite">
              <span className="font-sans tracking-tighter">OOOO</span>
            </div>
            <div>
              <span className="text-[0.65rem] uppercase tracking-[0.25em] text-rosegold-400">
                Saxs & Snowpie's Vision
              </span>
              <h2 className="font-display text-2xl font-semibold text-warmwhite">
                Audi Dream Garage
              </h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="tap flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-rosegold-300 hover:text-white"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto border-b border-white/5 px-6 py-3 [scrollbar-width:none]">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                haptic('tap');
                setSelectedCategory(cat);
              }}
              className={`tap whitespace-nowrap rounded-full px-3.5 py-1 text-xs transition-all ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-rosegold-500 to-rose-600 font-semibold text-warmwhite shadow-md'
                  : 'bg-white/5 text-rosegold-200/70 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Garage Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Active Car Showcase Hero */}
          <div className="relative mb-6 overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
            <div className="relative aspect-[16/9] w-full max-h-[300px] overflow-hidden bg-black/60">
              <img
                src={activeCar.heroImage}
                alt={activeCar.name}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Model Badge */}
              <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-widest text-rosegold-300 backdrop-blur-md">
                {activeCar.badge}
              </div>

              {/* Accel & HP overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold text-warmwhite sm:text-3xl">
                    {activeCar.name}
                  </h3>
                  <p className="line-clamp-1 text-xs text-rosegold-200/80">
                    {activeCar.tagline}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-rose-400">
                    {activeCar.accel}
                  </span>
                  <p className="text-[0.6rem] uppercase tracking-luxe text-rosegold-300">0-100 km/h</p>
                </div>
              </div>
            </div>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-4 sm:grid-cols-4">
              <div className="rounded-2xl bg-white/5 p-2.5 text-center">
                <span className="text-xs uppercase text-rosegold-300/80">Power</span>
                <p className="font-display text-base font-semibold text-warmwhite">
                  {activeCar.horsepower}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-2.5 text-center">
                <span className="text-xs uppercase text-rosegold-300/80">Engine</span>
                <p className="truncate font-display text-xs font-semibold text-warmwhite">
                  {activeCar.engine}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-2.5 text-center">
                <span className="text-xs uppercase text-rosegold-300/80">Top Speed</span>
                <p className="font-display text-base font-semibold text-warmwhite">
                  {activeCar.topSpeed}
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 p-2.5 text-center">
                <span className="text-xs uppercase text-rosegold-300/80">Drivetrain</span>
                <p className="truncate font-display text-xs font-semibold text-warmwhite">
                  {activeCar.drivetrain}
                </p>
              </div>
            </div>

            {/* Romantic Road Trip Suggestion */}
            <div className="border-t border-white/5 bg-black/60 p-4">
              <span className="text-[0.65rem] font-bold uppercase tracking-luxe text-rosegold-400">
                🛣️ Dream Drive For Saxs & Snowpie
              </span>
              <p className="mt-1 text-sm font-serif italic text-warmwhite/90">
                "{activeCar.romanticRoadTrip}"
              </p>
              <p className="mt-2 text-xs text-rosegold-300/70">
                Acoustic signature: {activeCar.soundDescription}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => saveCarToDreams(activeCar)}
                  className="shadow-md"
                >
                  <SparkleIcon width={16} height={16} /> Add to Our Dream Board ♥
                </Button>
                {savedNote && (
                  <span className="text-xs font-medium text-emerald-400">{savedNote}</span>
                )}
              </div>
            </div>
          </div>

          {/* Car Selection Thumbnails */}
          <h4 className="mb-3 text-xs font-bold uppercase tracking-luxe text-rosegold-400">
            Select an Audi Model ({filtered.length})
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {filtered.map((car) => (
              <button
                key={car.id}
                onClick={() => {
                  haptic('soft');
                  setActiveCar(car);
                }}
                className={`tap group relative overflow-hidden rounded-2xl border text-left transition-all ${
                  activeCar.id === car.id
                    ? 'border-rosegold-400 ring-2 ring-rosegold-400/50 shadow-lg'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-black/40">
                  <img
                    src={car.heroImage}
                    alt={car.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="bg-black/80 p-2.5">
                  <p className="truncate text-xs font-semibold text-warmwhite">{car.name}</p>
                  <p className="text-[0.65rem] text-rosegold-400">
                    {car.horsepower} · {car.accel}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
