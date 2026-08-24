import { useContentStore } from '@/store/useContentStore';
import type { PersonId } from '@/store/useAuthStore';
import { useMediaUrl } from '@/hooks/useMediaUrl';

/**
 * A person's profile photo, synced across both partners' devices in real
 * time. The Firebase Storage URL (works on any device) wins once available;
 * this device's own local IndexedDB copy is the fallback so a photo you just
 * picked shows instantly, before its cloud upload finishes.
 */
export function useProfilePhotoUrl(id: PersonId): string | null {
  const cloudUrl = useContentStore((s) => s.profiles[id]?.photoUrl) ?? null;
  const mediaId = useContentStore((s) => s.profiles[id]?.photoMediaId);
  const localUrl = useMediaUrl(mediaId);
  return cloudUrl || localUrl;
}
