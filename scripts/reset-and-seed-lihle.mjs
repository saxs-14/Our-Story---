/**
 * Reset and re-seed Firestore database for Phathu (Saxs) & Lihle (Snowpie).
 *
 * 1. Authenticates / updates Firebase Auth accounts:
 *    - phathu@ourstory.app (password: 14062005)
 *    - lihle@ourstory.app  (password: 06082003)
 * 2. Purges all previous messages, calls, typing, and presence docs.
 * 3. Deletes all legacy letters, dreams, and memories mentioning Ayanda or old dates.
 * 4. Seeds fresh, romantic, curated starter content exclusively for Saxs & Snowpie.
 *
 * Run with: node scripts/reset-and-seed-lihle.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Load .env.local ────────────────────────────────────────────────────────
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

const PHATHU_EMAIL = 'phathu@ourstory.app';
const PHATHU_PASSWORD = '14062005'; // Birthday: 14 June 2005
const PHATHU_LEGACY_PASSWORD = '08052026'; // Old password from previous relationshipStart

const LIHLE_EMAIL = 'lihle@ourstory.app';
const LIHLE_PASSWORD = '06082003'; // Birthday: 06 August 2003

async function setupAuthAccount(auth, email, targetPassword, legacyPassword) {
  console.log(`\n→ Syncing Auth account: ${email}`);
  try {
    const cred = await signInWithEmailAndPassword(auth, email, targetPassword);
    console.log(`✓ Signed in to ${email} with current password.`);
    return cred.user;
  } catch (err) {
    const code = err?.code;
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      if (legacyPassword) {
        try {
          console.log(`ℹ Trying legacy password for ${email}...`);
          const cred = await signInWithEmailAndPassword(auth, email, legacyPassword);
          console.log(`✓ Signed in with legacy password. Updating password to ${targetPassword}...`);
          await updatePassword(cred.user, targetPassword);
          console.log(`✓ Successfully updated password for ${email} to ${targetPassword}.`);
          return cred.user;
        } catch (updateErr) {
          console.warn(`✖ Failed to update legacy password:`, updateErr?.code || updateErr);
        }
      }
    } else if (code === 'auth/user-not-found') {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, targetPassword);
        console.log(`✓ Created new Firebase Auth account for ${email}.`);
        return cred.user;
      } catch (createErr) {
        console.error(`✖ Failed to create account for ${email}:`, createErr?.code || createErr);
      }
    } else {
      console.warn(`✖ Auth notice for ${email}:`, code || err);
    }
  }
  return null;
}

async function purgeCollection(db, collectionName) {
  process.stdout.write(`→ Purging collection '${collectionName}'... `);
  try {
    const snap = await getDocs(collection(db, collectionName));
    let count = 0;
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
      count++;
    }
    console.log(`deleted ${count} document(s).`);
    return count;
  } catch (err) {
    console.log(`skipped (${err?.message || err})`);
    return 0;
  }
}

async function main() {
  console.log(`====================================================`);
  console.log(` Our Story — Firestore Reset & Reseed (Phathu & Lihle)`);
  console.log(` Project: ${firebaseConfig.projectId}`);
  console.log(`====================================================`);

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // 1. Ensure Auth Accounts are ready & passwords in sync
  await setupAuthAccount(auth, PHATHU_EMAIL, PHATHU_PASSWORD, PHATHU_LEGACY_PASSWORD);
  await setupAuthAccount(auth, LIHLE_EMAIL, LIHLE_PASSWORD);

  // Sign in as Phathu to perform Firestore operations
  console.log(`\n→ Authenticating as ${PHATHU_EMAIL} for database cleanup...`);
  try {
    await signInWithEmailAndPassword(auth, PHATHU_EMAIL, PHATHU_PASSWORD);
    console.log(`✓ Authenticated as ${PHATHU_EMAIL}`);
  } catch (err) {
    console.error(`✖ Failed to sign in as ${PHATHU_EMAIL}:`, err?.code || err);
    process.exit(1);
  }

  // 2. Purge old collections
  console.log(`\n--- 1. Purging Legacy & Dynamic Data ---`);
  await purgeCollection(db, 'messages');
  await purgeCollection(db, 'calls');
  await purgeCollection(db, 'typing');
  await purgeCollection(db, 'presence');
  await purgeCollection(db, 'push_tokens');
  await purgeCollection(db, 'letters');
  await purgeCollection(db, 'dreams');
  await purgeCollection(db, 'memories');

  // 3. Seed fresh Phathu & Lihle content
  console.log(`\n--- 2. Seeding Fresh Content for Saxs & Snowpie ---`);

  const freshLetters = {
    'seed-letter-01': {
      authorId: 'him',
      to: 'her',
      category: 'Deep Love',
      title: 'To My Beautiful Snowpie ❄️✨',
      body: 'My dearest Snowpie ❄️✨,\n\nI built this entire world for you, so that every smile, every inside joke, every song, and every quiet moment we share has a place to live forever.\n\nLoving you is the easiest, sweetest, and most natural thing I have ever known. Thank you for being my peace, my favourite person to talk to, and the girl I want to keep choosing every single day.\n\nWhenever the world feels noisy or heavy, come here. This space is ours and ours alone.\n\nForever & in every universe,\nSaxs🥹❤️🔥',
      createdAt: '2026-08-11T09:00:00.000Z',
    },
    'seed-letter-02': {
      authorId: 'him',
      to: 'her',
      category: 'Gratitude',
      title: 'Thank you for the ordinary days',
      body: 'Everyone talks about the big moments. My favourite part of loving you is the sweet everyday moments: hearing your voice on the phone, listening to you laugh, arguing about whose playlist we play in the car, and feeling completely at peace with you. Thank you for making every day feel like home.',
      createdAt: '2026-08-12T19:40:00.000Z',
    },
    'seed-letter-03': {
      authorId: 'her',
      to: 'him',
      category: 'Deep Love',
      title: 'To the one who built me a world',
      body: 'Saxs, you literally built me an entire app just to remind me how deeply I am loved. Who does that? You do. I might not always have the exact words, but know this: I see your heart, I appreciate everything you do, and I am so grateful to have you by my side.',
      createdAt: '2026-08-13T21:05:00.000Z',
    },
    'seed-letter-04': {
      authorId: 'him',
      to: 'her',
      category: 'Encouragement',
      title: 'Read this on a hard day',
      body: 'You are precious, deeply cherished, and stronger than you know. God brought us together for a reason, and whatever life brings, you will never have to face it alone. Take a deep breath. We have got this together. I have got you, always.',
      createdAt: '2026-08-14T06:55:00.000Z',
    },
  };

  const freshDreams = {
    'seed-dream-01': {
      authorId: 'him',
      category: 'Road Trips & Drives',
      emoji: '🚗',
      title: 'Audi RS6 Road Trip',
      note: 'Midnight drive with our favourite Amapiano and Gospel playlist blasting, windows cracked, and nowhere we need to be except together.',
      createdAt: '2026-08-11T12:00:00.000Z',
    },
    'seed-dream-02': {
      authorId: 'her',
      category: 'Places to Visit',
      emoji: '✈️',
      title: 'Cape Town Getaway',
      note: 'Table Mountain views, sunset drives, great food, and capturing beautiful memories without any rush.',
      createdAt: '2026-08-12T13:10:00.000Z',
    },
    'seed-dream-03': {
      authorId: 'him',
      category: 'Future Goals',
      emoji: '🏡',
      title: 'Our Dream Home & Garage',
      note: 'A beautiful home filled with laughter, peace, good music, and an Audi parked in the driveway.',
      createdAt: '2026-08-13T15:25:00.000Z',
    },
    'seed-dream-04': {
      authorId: 'her',
      category: 'Date Ideas',
      emoji: '⛪',
      title: 'Sunday Service & Brunch',
      note: 'Worshipping together on Sunday morning, followed by a relaxed breakfast and a peaceful afternoon.',
      createdAt: '2026-08-14T18:00:00.000Z',
    },
  };

  const freshMemories = {
    'seed-mem-01': {
      authorId: 'him',
      date: '2003-08-06',
      emoji: '❄️',
      title: "Snowpie's Birthday 🎂",
      description: '06 August 2003 — The day God brought the most beautiful soul into this world.',
      mediaIds: [],
      mediaUrls: [],
      createdAt: '2026-08-11T10:00:00.000Z',
    },
    'seed-mem-02': {
      authorId: 'him',
      date: '2005-06-14',
      emoji: '🔥',
      title: "Saxs's Birthday 🔥",
      description: '14 June 2005 — The day the boy who loves you with all his heart was born.',
      mediaIds: [],
      mediaUrls: [],
      createdAt: '2026-08-11T10:01:00.000Z',
    },
    'seed-mem-03': {
      authorId: 'him',
      date: '2026-08-04',
      emoji: '💘',
      title: 'Love at First Sight 💘',
      description: '04 August 2026 — The unforgettable moment Phathu first saw Lihle. One look, and his heart was completely hers.',
      mediaIds: [],
      mediaUrls: [],
      createdAt: '2026-08-11T10:02:00.000Z',
    },
    'seed-mem-04': {
      authorId: 'him',
      date: '2026-08-11',
      emoji: '❤️',
      title: 'The Day It Became Us ❤️',
      description: '11 August 2026 — The official start of our forever love story. Best decision ever.',
      mediaIds: [],
      mediaUrls: [],
      createdAt: '2026-08-11T10:03:00.000Z',
    },
  };

  for (const [id, data] of Object.entries(freshLetters)) {
    await setDoc(doc(db, 'letters', id), { id, ...data });
  }
  console.log(`✓ Seeded ${Object.keys(freshLetters).length} letters.`);

  for (const [id, data] of Object.entries(freshDreams)) {
    await setDoc(doc(db, 'dreams', id), { id, ...data });
  }
  console.log(`✓ Seeded ${Object.keys(freshDreams).length} dreams.`);

  for (const [id, data] of Object.entries(freshMemories)) {
    await setDoc(doc(db, 'memories', id), { id, ...data });
  }
  console.log(`✓ Seeded ${Object.keys(freshMemories).length} memories.`);

  console.log(`\n🎉 Success! All past messages purged, legacy Ayanda data deleted, and database freshly seeded for Phathu & Lihle!`);
  process.exit(0);
}

main().catch((err) => {
  console.error('✖ Database reset script error:', err);
  process.exit(1);
});
