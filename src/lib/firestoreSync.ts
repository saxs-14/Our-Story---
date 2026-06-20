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
  getDocs,
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
  } catch {}
}

/** Fetch all documents from a Firestore collection (used on first login). */
export async function pullCollection<T>(col: string): Promise<T[]> {
  if (!FIREBASE_CONFIGURED || !db) return [];
  try {
    const snap = await getDocs(collection(db, col));
    return snap.docs.map((d) => d.data() as T);
  } catch {
    return [];
  }
}

export const syncLetter = (l: UserLetter) => syncDoc('letters', l.id, l);
export const syncDream = (d: UserDream) => syncDoc('dreams', d.id, d);
export const syncMemory = (m: UserMemory) => syncDoc('memories', m.id, m);
export const syncGalleryItem = (g: GalleryItem) => syncDoc('gallery', g.id, g);
export const removeFromFirestore = (col: string, id: string) => removeDoc(col, id);
