import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useLocationStore } from '@/store/useLocationStore';
import { useAuthStore, personById, partnerOf } from '@/store/useAuthStore';
import { haversineMeters, formatDistance } from '@/lib/geo';
import { haptic } from '@/lib/haptics';

function timeAgo(ms: number): string {
  const mins = Math.round((Date.now() - ms) / 60_000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 minute ago';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}

export default function Location() {
  const userId = useAuthStore((s) => s.userId);
  const partnerId = userId ? partnerOf(userId) : 'her';
  const partner = personById(partnerId);

  const sharingOn = useLocationStore((s) => s.sharingOn);
  const myLocation = useLocationStore((s) => s.myLocation);
  const partnerLocation = useLocationStore((s) => s.partnerLocation);
  const geoError = useLocationStore((s) => s.geoError);
  const setSharing = useLocationStore((s) => s.setSharing);

  const distance =
    myLocation && partnerLocation
      ? haversineMeters(myLocation.lat, myLocation.lng, partnerLocation.lat, partnerLocation.lng)
      : null;

  return (
    <PageShell eyebrow="Where you both are" title="Location">
      <GlassCard strong className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-xl text-[color:var(--ink-strong)]">Share my location</p>
            <p className="mt-1 text-xs text-[color:var(--ink-soft)]">
              Only updates while this app is open on your screen — not in the background.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sharingOn}
            aria-label="Share my location"
            onClick={() => {
              if (!userId) return;
              haptic('tap');
              setSharing(userId, !sharingOn);
            }}
            className={`tap relative h-8 w-14 shrink-0 rounded-full transition-colors ${
              sharingOn ? 'bg-rosegold-500' : 'bg-black/15'
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-warmwhite shadow-md transition-transform ${
                sharingOn ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {geoError && <p className="mt-3 text-xs text-rosegold-600">{geoError}</p>}

        {sharingOn && myLocation && (
          <p className="mt-3 text-xs text-[color:var(--ink-soft)]">
            Your last update: {timeAgo(myLocation.updatedAt)}
          </p>
        )}
      </GlassCard>

      <GlassCard strong className="mt-4 p-6">
        <p className="text-xs font-medium uppercase tracking-luxe text-rosegold-500">
          {partner.nickname}
        </p>

        {partnerLocation ? (
          <>
            <p className="mt-1 font-display text-xl text-[color:var(--ink-strong)]">
              Updated {timeAgo(partnerLocation.updatedAt)}
            </p>
            {distance !== null && (
              <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                {formatDistance(distance)} apart
              </p>
            )}
            <Button
              variant="gold"
              size="lg"
              className="mt-4 w-full"
              onClick={() => {
                haptic('soft');
                window.open(
                  `https://www.google.com/maps?q=${partnerLocation.lat},${partnerLocation.lng}`,
                  '_blank',
                );
              }}
            >
              Open in Maps 📍
            </Button>
          </>
        ) : (
          <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
            {partner.nickname} isn't currently sharing their location.
          </p>
        )}
      </GlassCard>
    </PageShell>
  );
}
