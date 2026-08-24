/**
 * Firebase init — Auth + Firestore (chat) + Storage (media).
 * Credentials come from .env.local (copy from .env.example).
 * Falls back gracefully when env vars are missing (offline/local mode).
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

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
let functions: Functions | null = null;

if (FIREBASE_CONFIGURED) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  // Must match the deployed functions' region (see functions/index.js /
  // `firebase functions:list`) — callable functions are invoked per-region,
  // and the SDK defaults to us-central1 if this isn't passed explicitly.
  functions = getFunctions(app, 'africa-south1');

  // Enable offline persistence so chat works without internet
  enableIndexedDbPersistence(db).catch(() => {
    // Multi-tab or private browsing — not critical, chat still works online
  });

  // App Check — proves calls to signInAsPartner actually come from this app,
  // not a bot hammering the callable endpoint directly with just the public
  // API key (which anyone can see, by design — Firebase client keys aren't
  // secret). Uses reCAPTCHA v3 for both web AND the native APK: Capacitor's
  // WebView is Chromium-based with real internet access, so the same web
  // provider works inside the native app too — no separate native plugin
  // (e.g. Play Integrity) needed, which is good because this app isn't
  // Play Store-distributed and Play Integrity's normal attestation flow
  // doesn't cleanly apply to a permanently-sideloaded APK anyway.
  //
  // Silently skips entirely if VITE_RECAPTCHA_SITE_KEY isn't set yet (see
  // .env.example) — the site key must be created once in the Firebase
  // Console (App Check → register app → reCAPTCHA v3) before this can do
  // anything. Cloud Functions enforcement (enforceAppCheck on
  // signInAsPartner) is deliberately NOT enabled server-side yet — see the
  // comment on that function in functions/index.js for why and the exact
  // rollout sequencing.
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  if (recaptchaSiteKey) {
    if (import.meta.env.DEV) {
      // Real reCAPTCHA v3 keys are bound to specific domains and won't
      // validate on localhost. Firebase's debug provider bypasses real
      // attestation for exactly this case — it logs a token to the console
      // on first run that gets registered once (per dev machine) in the
      // Firebase Console's App Check "Manage debug tokens" list.
      (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
}

export { app, auth, db, storage, functions };

/** Synthetic Firebase email for each partner */
export function firebaseEmail(personId: 'her' | 'him'): string {
  return personId === 'her' ? 'lihle@ourstory.app' : 'phathu@ourstory.app';
}

