/**
 * Firebase init — Auth + Firestore (chat) + Storage (media).
 * Credentials come from .env.local (copy from .env.example).
 * Falls back gracefully when env vars are missing (offline/local mode).
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const FIREBASE_CONFIGURED = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (FIREBASE_CONFIGURED) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Enable offline persistence so chat works without internet
  enableIndexedDbPersistence(db).catch(() => {
    // Multi-tab or private browsing — not critical, chat still works online
  });
}

export { app, auth, db, storage };

/** Synthetic Firebase email for each partner */
export function firebaseEmail(personId: 'her' | 'him'): string {
  return personId === 'her' ? 'ayanda@ourstory.app' : 'phathu@ourstory.app';
}
