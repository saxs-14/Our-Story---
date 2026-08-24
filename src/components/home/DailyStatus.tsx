import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useContentStore } from '@/store/useContentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/cn';

const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🥰', label: 'Loved' },
  { emoji: '😌', label: 'Peaceful' },
  { emoji: '🥱', label: 'Tired' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😤', label: 'Stressed' },
  { emoji: '🙏', label: 'Grateful' },
  { emoji: '🤩', label: 'Excited' },
] as const;

/**
 * Quick daily check-in: what you did today + how you feel, posted straight
 * to the shared Timeline via the same addMemory() path "Add a Moment" uses —
 * no separate feature to maintain, just a faster, more focused entry point.
 */
export function DailyStatus() {
  const userId = useAuthStore((s) => s.userId);
  const addMemory = useContentStore((s) => s.addMemory);

  const [text, setText] = useState('');
  const [mood, setMood] = useState<(typeof MOODS)[number] | null>(null);
  const [justShared, setJustShared] = useState(false);

  const share = () => {
    if (!userId || !text.trim() || !mood) return;
    haptic('success');
    const today = new Date().toISOString().slice(0, 10);
    addMemory({
      authorId: userId,
      date: today,
      title: `Feeling ${mood.label}`,
      description: text.trim(),
      emoji: mood.emoji,
      mediaIds: [],
    });
    setText('');
    setMood(null);
    setJustShared(true);
    window.setTimeout(() => setJustShared(false), 3000);
  };

  return (
    <GlassCard strong className="mt-4 p-6">
      <p className="text-xs font-medium uppercase tracking-luxe text-rosegold-500">
        Daily status
      </p>
      <p className="mt-1 font-display text-xl text-[color:var(--ink-strong)]">
        How was your day?
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="What did you get up to today…"
        aria-label="What did you do today?"
        className="mt-3 w-full resize-none rounded-2xl bg-black/5 p-4 text-sm text-[color:var(--ink-strong)] placeholder:text-[color:var(--ink-soft)] focus:outline-none focus:ring-2 focus:ring-rosegold-400"
      />

      <p className="mb-1.5 mt-3 text-xs uppercase tracking-luxe text-rosegold-400">
        How do you feel?
      </p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => {
              haptic('tap');
              setMood(m);
            }}
            aria-pressed={mood?.label === m.label}
            className={cn(
              'tap flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-transform',
              mood?.label === m.label
                ? 'scale-105 bg-rosegold-500/30 ring-2 ring-rosegold-400'
                : 'bg-warmwhite/10 text-[color:var(--ink-strong)]',
            )}
          >
            <span aria-hidden="true">{m.emoji}</span> {m.label}
          </button>
        ))}
      </div>

      <Button
        variant="gold"
        size="lg"
        className="mt-4 w-full"
        onClick={share}
        disabled={!text.trim() || !mood}
      >
        {justShared ? 'Shared to Timeline ✓' : 'Share to Timeline ♥'}
      </Button>
    </GlassCard>
  );
}
