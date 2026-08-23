import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAppStore, type MotionPref, type ThemeName } from '@/store/useAppStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useAuthStore, personById } from '@/store/useAuthStore';
import {
  isPushSupported,
  checkNotificationPermission,
  enablePushNotifications,
  getPushDiagnostics,
  type PushDiagnostics,
} from '@/lib/push';
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

function DiagRow({ label, ok, value }: { label: string; ok?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-xs">
      <span className="text-[color:var(--ink-soft)]">{label}</span>
      <span
        className={cn(
          'text-right font-semibold',
          ok === true ? 'text-emerald-500' : ok === false ? 'text-rose-500' : 'text-[color:var(--ink-strong)]',
        )}
      >
        {value}
      </span>
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

  const [pushState, setPushState] = useState<'checking' | 'off' | 'granted' | 'denied' | 'unsupported'>('checking');
  useEffect(() => {
    isPushSupported().then(async (supported) => {
      if (!supported) return setPushState('unsupported');
      const perm = await checkNotificationPermission();
      if (perm === 'granted' && userId) {
        // Permission was already granted (e.g. a prior session) but that
        // doesn't mean a token was ever registered/saved — getToken() is a
        // silent no-op prompt-wise when permission is already granted, so
        // it's safe to just re-run this every time to keep the token fresh.
        const result = await enablePushNotifications(userId);
        setPushState(result);
      } else {
        setPushState(perm === 'denied' ? 'denied' : 'off');
      }
    });
  }, [userId]);

  const handleEnablePush = async () => {
    if (!userId) return;
    haptic('tap');
    const result = await enablePushNotifications(userId);
    setPushState(result);
    if (showDiagnostics) void refreshDiagnostics();
  };

  // On-screen diagnostics — for "does push actually work on this specific
  // device" questions (iOS/Safari especially) that can't be answered from a
  // desktop browser. Fetched on demand rather than always, since most of
  // this is only meaningful to read once, deliberately.
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<PushDiagnostics | null>(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const refreshDiagnostics = async () => {
    setDiagnosticsLoading(true);
    try {
      setDiagnostics(await getPushDiagnostics(userId));
    } finally {
      setDiagnosticsLoading(false);
    }
  };
  const toggleDiagnostics = () => {
    haptic('tap');
    const next = !showDiagnostics;
    setShowDiagnostics(next);
    if (next) void refreshDiagnostics();
  };

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
        <div className="hairline" />
        <Row
          label="Push notifications"
          hint={
            pushState === 'unsupported'
              ? 'Not available on this browser/device'
              : pushState === 'denied'
              ? 'Blocked — allow notifications in your browser/site settings'
              : pushState === 'granted'
              ? "You'll be notified about messages & calls even when the app is closed"
              : 'Get notified about messages & calls even when the app is closed'
          }
        >
          {pushState === 'granted' ? (
            <span className="text-xs font-semibold text-emerald-500">On ✓</span>
          ) : pushState === 'unsupported' || pushState === 'denied' || pushState === 'checking' ? (
            <span className="text-xs text-[color:var(--ink-soft)]">—</span>
          ) : (
            <Button variant="glass" size="sm" onClick={handleEnablePush}>Enable</Button>
          )}
        </Row>
        <div className="hairline" />
        <button
          type="button"
          onClick={toggleDiagnostics}
          className="tap flex w-full items-center justify-between py-3 text-left text-xs text-[color:var(--ink-soft)]"
        >
          <span>Push diagnostics — what's actually happening on this device</span>
          <span className="text-rosegold-500">{showDiagnostics ? 'Hide' : 'Show'}</span>
        </button>

        {showDiagnostics && (
          <div className="mb-3 rounded-2xl bg-black/5 p-3.5">
            {diagnosticsLoading || !diagnostics ? (
              <p className="py-2 text-center text-xs text-[color:var(--ink-soft)]">Checking…</p>
            ) : (
              <>
                <DiagRow label="Platform" value={diagnostics.platform === 'native' ? 'Native app' : 'Web'} />
                <DiagRow label="Device" value={diagnostics.isIOS ? 'iOS' : 'Other'} />
                {diagnostics.isIOS && (
                  <DiagRow
                    label="Opened from Home Screen"
                    ok={diagnostics.isStandalone}
                    value={diagnostics.isStandalone ? 'Yes' : 'No — open the Home Screen icon, not Safari'}
                  />
                )}
                <DiagRow label="Firebase configured" ok={diagnostics.firebaseConfigured} value={diagnostics.firebaseConfigured ? 'Yes' : 'No'} />
                <DiagRow
                  label="Signed into Firebase"
                  ok={diagnostics.signedIn}
                  value={diagnostics.signedIn ? diagnostics.signedInAs || 'Yes' : 'No — cloud sync & push can’t work'}
                />
                <DiagRow label="VAPID key configured" ok={diagnostics.vapidKeyConfigured} value={diagnostics.vapidKeyConfigured ? 'Yes' : 'No'} />
                <DiagRow label="Notification permission" ok={diagnostics.permission === 'granted'} value={diagnostics.permission} />
                <DiagRow
                  label="Device token saved"
                  ok={diagnostics.tokenSavedInFirestore}
                  value={diagnostics.tokenSavedInFirestore ? 'Yes' : 'No'}
                />
                {diagnostics.lastError && (
                  <div className="mt-2 rounded-xl bg-rose-500/10 p-2 text-[0.68rem] leading-relaxed text-rose-500">
                    {diagnostics.lastError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { haptic('tap'); void refreshDiagnostics(); }}
                  className="tap mt-2 text-[0.68rem] font-semibold text-rosegold-500"
                >
                  Refresh
                </button>
              </>
            )}
          </div>
        )}
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
