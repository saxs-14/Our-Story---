import { useState } from 'react';
import { motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAppStore, type MotionPref, type ThemeName } from '@/store/useAppStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useAuthStore, personById } from '@/store/useAuthStore';
import relationship from '@/config/relationship';
import { formatLongDate } from '@/lib/time';
import { cn } from '@/lib/cn';
import { haptic } from '@/lib/haptics';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => { haptic('tap'); onChange(!checked); }}
      className={cn('tap relative h-7 w-12 rounded-full transition-colors', checked ? 'bg-rosegold-500' : 'bg-[color:var(--ink-soft)]/30')}
    >
      <motion.span className="absolute top-0.5 h-6 w-6 rounded-full bg-warmwhite shadow" animate={{ left: checked ? '1.5rem' : '0.125rem' }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </button>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-[color:var(--ink-strong)]">{label}</p>
        {hint && <p className="text-xs text-[color:var(--ink-soft)]">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

const SegmentedControl = <T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) => (
  <div className="flex rounded-full bg-warmwhite/40 p-1 text-sm">
    {options.map((o) => (
      <button key={o.value} onClick={() => { haptic('tap'); onChange(o.value); }} className={cn('tap rounded-full px-3 py-1 transition-colors', value === o.value ? 'bg-rosegold-500 text-warmwhite' : 'text-[color:var(--ink-soft)]')}>
        {o.label}
      </button>
    ))}
  </div>
);

export default function Settings() {
  const app = useAppStore();
  const resetAll = useProgressStore((s) => s.resetAll);
  const userId = useAuthStore((s) => s.userId);
  const logout = useAuthStore((s) => s.logout);
  const [confirm, setConfirm] = useState(false);

  return (
    <PageShell eyebrow="Make it yours" title="Settings">
      {userId && (
        <GlassCard className="mb-6 flex items-center justify-between p-5">
          <div>
            <p className="text-xs uppercase tracking-luxe text-rosegold-500">Signed in as</p>
            <p className="font-display text-xl text-[color:var(--ink-strong)]">{personById(userId).name}</p>
          </div>
          <Button variant="glass" size="sm" onClick={() => { haptic('tap'); logout(); }}>Sign out</Button>
        </GlassCard>
      )}

      <GlassCard className="px-5 py-2">
        <Row label="Theme" hint="Daylight or a candle-lit dusk">
          <SegmentedControl<ThemeName> value={app.theme} onChange={app.setTheme} options={[{ value: 'day', label: 'Day' }, { value: 'dusk', label: 'Dusk' }]} />
        </Row>
        <div className="hairline" />
        <Row label="Motion" hint="Reduce animation if it feels like too much">
          <SegmentedControl<MotionPref> value={app.motion} onChange={app.setMotion} options={[{ value: 'system', label: 'Auto' }, { value: 'on', label: 'Full' }, { value: 'off', label: 'Calm' }]} />
        </Row>
        <div className="hairline" />
        <Row label="High contrast" hint="Stronger text & borders">
          <Toggle checked={app.highContrast} onChange={app.setHighContrast} label="High contrast" />
        </Row>
      </GlassCard>

      <h2 className="mb-2 mt-6 px-1 font-display text-xl text-[color:var(--ink-strong)]">Sound & feel</h2>
      <GlassCard className="px-5 py-2">
        <Row label="Sound effects" hint="Soft chimes & sparkles">
          <Toggle checked={app.soundOn} onChange={app.setSound} label="Sound effects" />
        </Row>
        <div className="hairline" />
        <Row label="Haptics" hint="Gentle vibration on supported devices">
          <Toggle checked={app.hapticsOn} onChange={app.setHaptics} label="Haptics" />
        </Row>
        <div className="hairline" />
        <Row label="Ambient particles" hint="Floating petals in the background">
          <Toggle checked={app.ambientOn} onChange={app.setAmbient} label="Ambient particles" />
        </Row>
        <div className="hairline" />
        <Row label="Message notifications" hint="Alert me when they send a chat (while the app is open)">
          <Toggle checked={app.notificationsOn} onChange={app.setNotifications} label="Message notifications" />
        </Row>
      </GlassCard>

      <h2 className="mb-2 mt-6 px-1 font-display text-xl text-[color:var(--ink-strong)]">Our dates</h2>
      <GlassCard className="space-y-2 p-5 text-sm">
        <p className="text-[color:var(--ink-soft)]">Friendship began <span className="text-[color:var(--ink-strong)]">{formatLongDate(relationship.friendshipStart)}</span></p>
        <p className="text-[color:var(--ink-soft)]">Together since <span className="text-[color:var(--ink-strong)]">{formatLongDate(relationship.relationshipStart)}</span></p>
        <p className="text-[color:var(--ink-soft)]">{relationship.her.name} · <span className="text-[color:var(--ink-strong)]">{formatLongDate(relationship.her.birthday)}</span></p>
        <p className="text-[color:var(--ink-soft)]">{relationship.him.name} · <span className="text-[color:var(--ink-strong)]">{formatLongDate(relationship.him.birthday)}</span></p>
        <p className="pt-1 text-xs text-[color:var(--ink-soft)]">Edit these any time in <code className="rounded bg-rosegold-100/60 px-1">src/config/relationship.ts</code>.</p>
      </GlassCard>

      <h2 className="mb-2 mt-6 px-1 font-display text-xl text-[color:var(--ink-strong)]">Data</h2>
      <GlassCard className="p-5">
        <p className="text-sm text-[color:var(--ink-soft)]">Everything you do lives privately on this device. Reset clears favourites, reading progress, unlocks and capsules.</p>
        {confirm ? (
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => { resetAll(); setConfirm(false); }}>Yes, reset everything</Button>
          </div>
        ) : (
          <Button variant="glass" className="mt-4" onClick={() => setConfirm(true)}>Reset progress…</Button>
        )}
      </GlassCard>

      <p className="mt-8 text-center font-script text-2xl text-rosegold-600">Made with love, for {relationship.her.nickname}.</p>
    </PageShell>
  );
}
