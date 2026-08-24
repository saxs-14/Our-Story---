/**
 * Firestore sync helpers for user content (letters, dreams, memories, gallery).
 * Uses the same Firebase project as chat — no second service needed.
 * Falls back silently when Firebase is not configured (offline/local mode).
 * Firestore queues writes made offline and syncs automatically on reconnect.
 */
import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, FIREBASE_CONFIGURED } from '@/lib/firebase';
import type { UserLetter, UserDream, UserMemory, GalleryItem } from '@/store/useContentStore';

async function syncDoc(col: string, id: string, data: object): Promise<void> {
  if (!FIREBASE_CONFIGURED || !db) return;
  try {
    await setDoc(doc(db, col, id), data, { merge: true });
  } catch {
    // Firestore IndexedDB persistence queues this and syncs when back online
  }
}

async function removeDoc(col: string, id: string): Promise<void> {
  if (!FIREBASE_CONFIGURED || !db) return;
  try {
    await deleteDoc(doc(db, col, id));
  } catch {
    // Firestore IndexedDB persistence queues this and syncs when back online
  }
}

/**
 * Live-subscribe to every document in a Firestore collection, so an item
 * either partner adds/edits shows up for the other immediately — no reload
 * or re-login needed. Fires once immediately with the current contents,
 * then again on every subsequent change (same shape as a one-shot pull,
 * plus ongoing live updates).
 */
export function subscribeCollection<T>(
  col: string,
  onChange: (items: T[]) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED || !db) return () => {};
  return onSnapshot(collection(db, col), (snap) => {
    onChange(snap.docs.map((d) => d.data() as T));
  });
}

/** Overwrite a single shared Firestore document (settings/progress-style state). */
export async function syncSingleDoc(col: string, id: string, data: object): Promise<void> {
  if (!FIREBASE_CONFIGURED || !db) return;
  try {
    await setDoc(doc(db, col, id), data);
  } catch {
    // Firestore IndexedDB persistence queues this and syncs when back online
  }
}

/** Fetch a single shared Firestore document, or null when absent/offline. */
export async function pullSingleDoc<T>(col: string, id: string): Promise<T | null> {
  if (!FIREBASE_CONFIGURED || !db) return null;
  try {
    const snap = await getDoc(doc(db, col, id));
    return snap.exists() ? (snap.data() as T) : null;
  } catch {
    return null;
  }
}

export const syncLetter = (l: UserLetter) => syncDoc('letters', l.id, l);
export const syncDream = (d: UserDream) => syncDoc('dreams', d.id, d);
export const syncMemory = (m: UserMemory) => syncDoc('memories', m.id, m);
export const syncGalleryItem = (g: GalleryItem) => syncDoc('gallery', g.id, g);
export const removeFromFirestore = (col: string, id: string) => removeDoc(col, id);

export const syncProfilePhoto = (personId: string, photoUrl: string | null) =>
  syncDoc('profiles', personId, { photoUrl });

/**
 * Live-subscribe to a person's profile photo doc, so a photo either partner
 * sets shows up for the other immediately — no reload or re-login needed.
 */
export function subscribeProfilePhoto(
  personId: string,
  onChange: (photoUrl: string | null) => void,
): Unsubscribe {
  if (!FIREBASE_CONFIGURED || !db) return () => {};
  return onSnapshot(doc(db, 'profiles', personId), (snap) => {
    onChange((snap.data()?.photoUrl as string | undefined) ?? null);
  });
}
