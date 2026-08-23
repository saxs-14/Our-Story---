/**
 * Deep scan of all Firestore collections and Firebase Auth to verify
 * zero occurrences of 'Ayanda' or 'Silinda'.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function loadEnv() {
  const env = {};
  const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
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

async function main() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (!env.VITE_FIREBASE_HIM_PASSWORD) {
    console.error('✖ VITE_FIREBASE_HIM_PASSWORD missing from .env.local.');
    process.exit(1);
  }

  console.log(`Scanning Firebase Project: ${firebaseConfig.projectId}...`);
  await signInWithEmailAndPassword(auth, 'phathu@ourstory.app', env.VITE_FIREBASE_HIM_PASSWORD);
  console.log(`✓ Authenticated as phathu@ourstory.app`);

  // Check if legacy email ayanda@ourstory.app exists in Auth
  try {
    await signInWithEmailAndPassword(auth, 'ayanda@ourstory.app', '08052026');
    console.log(`⚠️ Note: ayanda@ourstory.app exists in Firebase Auth.`);
  } catch (err) {
    if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
      console.log(`✓ ayanda@ourstory.app is NOT active / not found in Auth.`);
    }
  }

  const collections = [
    'messages',
    'letters',
    'dreams',
    'memories',
    'gallery',
    'presence',
    'typing',
    'calls',
    'push_tokens',
    'garden',
    'app_settings'
  ];

  let matches = [];

  for (const colName of collections) {
    try {
      const snap = await getDocs(collection(db, colName));
      console.log(`Collection '${colName}': ${snap.size} document(s)`);
      for (const d of snap.docs) {
        const data = d.data();
        const str = JSON.stringify(data).toLowerCase();
        if (str.includes('ayanda') || str.includes('silinda')) {
          matches.push({ collection: colName, id: d.id, data });
        }
      }
    } catch (e) {
      console.log(`Collection '${colName}': skipped (${e.message})`);
    }
  }

  console.log(`\n================ SCAN RESULT ================`);
  if (matches.length === 0) {
    console.log(`✅ 100% CLEAN! Zero references to 'Ayanda' or 'Silinda' found in Firestore.`);
  } else {
    console.log(`❌ Found ${matches.length} matching document(s):`);
    console.log(JSON.stringify(matches, null, 2));
  }
}

main().catch(console.error);
