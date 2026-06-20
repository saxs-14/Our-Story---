import { useEffect, useState } from 'react';
import { getMediaURL } from '@/lib/idb';

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
