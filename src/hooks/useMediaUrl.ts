import { useEffect, useState } from 'react';
import { getMedia, getMediaURL, type MediaRecord } from '@/lib/idb';

/** Resolves a stored media id to a usable object URL (or null while loading). */
export function useMediaUrl(id: string | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!id) {
      setUrl(null);
      return;
    }
    getMediaURL(id).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [id]);
  return url;
}

/** Resolves a stored media id to its kind ('image'/'video'/'audio'), so a
 *  caller can render a video vs. an image correctly instead of assuming
 *  every attachment is a photo. */
export function useMediaKind(id: string | undefined | null): MediaRecord['kind'] | null {
  const [kind, setKind] = useState<MediaRecord['kind'] | null>(null);
  useEffect(() => {
    let active = true;
    if (!id) {
      setKind(null);
      return;
    }
    getMedia(id).then((rec) => {
      if (active) setKind(rec?.kind ?? null);
    });
    return () => {
      active = false;
    };
  }, [id]);
  return kind;
}
