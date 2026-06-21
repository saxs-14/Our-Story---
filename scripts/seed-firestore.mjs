/**
 * Seed the "Our Story" Firestore database with curated starter content.
 *
 *   Run once:   node scripts/seed-firestore.mjs
 *
 * It reads your Firebase keys from .env.local, signs in with the app's own
 * account (phathu@ourstory.app — the same identity the app uses), and writes
 * the documents in firestore.seed.json into the letters / dreams / memories /
 * messages collections. setDoc(..., {merge:true}) makes it safe to re-run:
 * it updates the same seed-* docs instead of creating duplicates.
 *
 * Nothing here changes the app. Delete this file (and firestore.seed.json)
 * any time — they are dev tooling, not part of the build.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Load .env.local (Node doesn't read Vite's import.meta.env) ──────────────
function loadEnv() {
  const env = {};
  let raw;
  try {
    raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
  } catch {
    console.error('✖ Could not read .env.local — make sure your Firebase keys are there.');
    process.exit(1);
  }
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return env;
}

const env = loadEnv();
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('✖ Firebase not configured in .env.local (missing API key / project id).');
  process.exit(1);
}

// Same synthetic account + password the app itself uses.
// Password = the dating-date digits of relationshipStart (2026-05-08 -> 08052026).
const RELATIONSHIP_START = '2026-05-08';
const [y, mo, d] = RELATIONSHIP_START.split('-');
const ACCOUNT_EMAIL = 'phathu@ourstory.app';
const ACCOUNT_PASSWORD = `${d}${mo}${y}`;

async function main() {
  console.log(`→ Connecting to Firebase project: ${firebaseConfig.projectId}`);
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Authenticate (Firestore rules require an authenticated user).
  try {
    await signInWithEmailAndPassword(auth, ACCOUNT_EMAIL, ACCOUNT_PASSWORD);
    console.log('✓ Signed in as', ACCOUNT_EMAIL);
  } catch (err) {
    const code = err?.code;
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      await createUserWithEmailAndPassword(auth, ACCOUNT_EMAIL, ACCOUNT_PASSWORD);
      console.log('✓ Created + signed in as', ACCOUNT_EMAIL);
    } else {
      console.error('✖ Sign-in failed:', code || err);
      process.exit(1);
    }
  }

  const seed = JSON.parse(readFileSync(resolve(ROOT, 'firestore.seed.json'), 'utf8'));
  let total = 0;

  // letters / dreams / memories — written as-is (createdAt stays an ISO string).
  for (const col of ['letters', 'dreams', 'memories']) {
    const docs = seed[col] || {};
    for (const [id, data] of Object.entries(docs)) {
      await setDoc(doc(db, col, id), { id, ...data }, { merge: true });
      total++;
    }
    console.log(`✓ ${col}: ${Object.keys(docs).length} document(s)`);
  }

  // messages — convert _timestamp (ISO) into a real Firestore Timestamp.
  const messages = seed.messages || {};
  for (const [id, data] of Object.entries(messages)) {
    const { _timestamp, ...rest } = data;
    await setDoc(
      doc(db, 'messages', id),
      { ...rest, timestamp: Timestamp.fromDate(new Date(_timestamp)) },
      { merge: true },
    );
    total++;
  }
  console.log(`✓ messages: ${Object.keys(messages).length} document(s)`);

  console.log(`\n🎉 Done — ${total} documents are now live in Firestore.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('✖ Seeding failed:', err);
  process.exit(1);
});
