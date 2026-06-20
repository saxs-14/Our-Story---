/**
 * Minimal IndexedDB wrapper for binary media (images / audio / video).
 *
 * localStorage tops out around 5 MB and only holds strings, so all uploaded
 * media is stored here as Blobs under a generated id. Content records elsewhere
 * just reference the id; `getMediaURL` resolves it to an object URL on demand.
 * This is the local-first layer — Phase 4 mirrors the same ids to Firebase
 * Cloud Storage when configured.
 */

const DB_NAME = 'our-story-media';
const STORE = 'media';
const VERSION = 1;

export interface MediaRecord {
  id: string;
  kind: 'image' | 'audio' | 'video';
  type: string; // MIME
  name: string;
  size: number;
  createdAt: string;
  blob: Blob;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return openDB().then((db) => db.transaction(STORE, mode).objectStore(STORE));
}

export function kindFromType(type: string): MediaRecord['kind'] {
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  return 'image';
}

export async function saveMedia(file: File | Blob, name = 'media'): Promise<MediaRecord> {
  const id = `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const type = (file as File).type || 'application/octet-stream';
  const record: MediaRecord = {
    id,
    kind: kindFromType(type),
    type,
    name: (file as File).name || name,
    size: file.size,
    createdAt: new Date().toISOString(),
    blob: file,
  };
  const store = await tx('readwrite');
  await reqToPromise(store.put(record));
  return record;
}

export async function getMedia(id: string): Promise<MediaRecord | undefined> {
  const store = await tx('readonly');
  return reqToPromise<MediaRecord | undefined>(store.get(id));
}

const urlCache = new Map<string, string>();

/** Resolve a media id to an object URL (cached). Returns null if not found. */
export async function getMediaURL(id: string): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id)!;
  const rec = await getMedia(id);
  if (!rec) return null;
  const url = URL.createObjectURL(rec.blob);
  urlCache.set(id, url);
  return url;
}

export async function deleteMedia(id: string): Promise<void> {
  const cached = urlCache.get(id);
  if (cached) {
    URL.revokeObjectURL(cached);
    urlCache.delete(id);
  }
  const store = await tx('readwrite');
  await reqToPromise(store.delete(id));
}

export async function listMedia(): Promise<MediaRecord[]> {
  const store = await tx('readonly');
  return reqToPromise<MediaRecord[]>(store.getAll());
}

function reqToPromise<T>(req: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}
