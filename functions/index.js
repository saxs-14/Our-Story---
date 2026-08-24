/**
 * Server-side triggers that send push notifications for new chat messages
 * and incoming calls, so they reach a device even when the app is closed
 * or the phone is locked — something no client-side code can do alone.
 *
 * Requires the Blaze (pay-as-you-go) billing plan; Cloud Functions don't
 * run at all on the free Spark plan.
 */
const { onDocumentCreated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { getAuth } = require('firebase-admin/auth');

initializeApp();
const db = getFirestore();
const messaging = getMessaging();
const adminAuth = getAuth();

const partnerOf = (id) => (id === 'her' ? 'him' : 'her');

// Must match STALE_MS in src/store/usePresenceStore.ts. The client already
// treats a partner as offline once their heartbeat goes stale (covers
// crashes/force-quits where pagehide/beforeunload never fires and the
// presence doc is left stuck at online:true), but this function reads the
// raw doc directly — without the same cutoff it would trust a stale
// online:true forever and silently stop sending pushes to that partner.
const STALE_MS = 45_000;

/** Mirrors the client's staleness check so a crashed device doesn't look online forever. */
function isActuallyOnline(presence) {
  if (!presence?.online) return false;
  const lastActiveMs = presence.lastActive?.toMillis?.();
  if (lastActiveMs == null) return true;
  return Date.now() - lastActiveMs < STALE_MS;
}

/** Clear a device token that FCM says is no longer valid, so we stop trying it. */
async function forgetStaleToken(personId) {
  await db.doc(`presence/${personId}`).update({ fcmToken: null }).catch(() => {});
}

async function sendPush(token, personId, payload) {
  try {
    await messaging.send({ token, ...payload });
  } catch (err) {
    if (err?.code === 'messaging/registration-token-not-registered') {
      await forgetStaleToken(personId);
    }
  }
}

exports.onNewMessage = onDocumentCreated('messages/{messageId}', async (event) => {
  const data = event.data?.data();
  if (!data?.senderId) return;

  const recipientId = partnerOf(data.senderId);
  const presence = await db
    .doc(`presence/${recipientId}`)
    .get()
    .then((snap) => snap.data())
    .catch(() => undefined);

  // Recipient already has the app open — ChatNotifier covers this in-app,
  // a push on top would just be a redundant buzz.
  if (isActuallyOnline(presence)) return;

  const token = presence?.fcmToken;
  if (!token) return;

  const body =
    data.mediaType === 'image'
      ? '📷 Photo'
      : data.mediaType === 'video'
      ? '🎬 Video'
      : data.mediaType === 'audio'
      ? '🎙️ Voice note'
      : String(data.text || '').slice(0, 120);

  await sendPush(token, recipientId, {
    notification: { title: data.senderName || 'Our Story', body },
    data: { url: '/chat' },
    webpush: { fcmOptions: { link: '/chat' } },
  });
});

exports.onNewCall = onDocumentCreated('calls/{callId}', async (event) => {
  const data = event.data?.data();
  if (!data?.calleeId || data.status !== 'offering') return;

  const presence = await db
    .doc(`presence/${data.calleeId}`)
    .get()
    .then((snap) => snap.data())
    .catch(() => undefined);
  const token = presence?.fcmToken;
  if (!token) return;

  const icon = data.type === 'video' ? '📹' : '📞';
  await sendPush(token, data.calleeId, {
    notification: {
      title: `${icon} Incoming call from ${data.callerName || 'your partner'}`,
      body: 'Tap to answer in Our Story',
    },
    data: { url: '/' },
    webpush: { fcmOptions: { link: '/' } },
  });
});

// ── Live location movement alerts ────────────────────────────────────────
//
// Tracking itself is entirely client-side and foreground-only (see
// src/store/useLocationStore.ts) — this function's only job is deciding
// when a partner's position change is worth a push notification, so the
// other partner finds out even if their own app isn't open right now.

const MOVEMENT_THRESHOLD_METERS = 500;
const MOVEMENT_NOTIFY_COOLDOWN_MS = 15 * 60_000;

/** Same great-circle formula as src/lib/geo.ts's haversineMeters. */
function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

exports.onLocationUpdate = onDocumentWritten('locations/{personId}', async (event) => {
  const personId = event.params.personId;
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!after || after.sharing === false) return;
  if (typeof after.lat !== 'number' || typeof after.lng !== 'number') return;

  // This function writes lastNotifiedLat/Lng/At back to this same document
  // below, which would otherwise re-trigger this same function forever —
  // if lat/lng didn't actually change, this write was that self-triggered
  // update (or some other metadata-only write), not a real position change.
  if (before && before.lat === after.lat && before.lng === after.lng) return;

  const hasBaseline = typeof after.lastNotifiedLat === 'number' && typeof after.lastNotifiedLng === 'number';
  if (hasBaseline) {
    const movedMeters = haversineMeters(after.lat, after.lng, after.lastNotifiedLat, after.lastNotifiedLng);
    const cooldownElapsed =
      !after.lastNotifiedAt || Date.now() - after.lastNotifiedAt.toMillis() > MOVEMENT_NOTIFY_COOLDOWN_MS;
    if (movedMeters < MOVEMENT_THRESHOLD_METERS || !cooldownElapsed) return;
  }

  await db.doc(`locations/${personId}`).set(
    { lastNotifiedLat: after.lat, lastNotifiedLng: after.lng, lastNotifiedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  // First-ever position of a sharing session just establishes the
  // baseline — nothing to compare "movement" against yet, so no alert.
  if (!hasBaseline) return;

  const recipientId = partnerOf(personId);
  const presence = await db
    .doc(`presence/${recipientId}`)
    .get()
    .then((snap) => snap.data())
    .catch(() => undefined);
  // Recipient already has the app open — they'll see the live update on
  // the Location page, a push on top would just be a redundant buzz.
  if (isActuallyOnline(presence)) return;

  const token = presence?.fcmToken;
  if (!token) return;

  const name = personId === 'her' ? 'Snowpie' : 'Saxs';
  await sendPush(token, recipientId, {
    notification: { title: 'Our Story', body: `📍 ${name} is on the move` },
    data: { url: '/location' },
    webpush: { fcmOptions: { link: '/location' } },
  });
});

// ── Sign-in — no static password ships to any client bundle ─────────────────
//
// The app used to embed a real Firebase Auth password (first the partners'
// birthday, then a random string) into the built client bundle. That's fine
// for a build nobody else can fetch (a locally-built native APK), but this
// project also deploys to public web URLs (GitHub Pages, Vercel) — anything
// baked into that bundle at build time is extractable by literally anyone
// who loads the page and opens dev tools, no matter how random the value is.
// There is no way to keep a build-time client secret secret on a public URL.
//
// So the client no longer has any real credential at all. Instead it calls
// this function with the birthday-style answer the person just typed; this
// runs server-side (where Admin SDK credentials live, which are never
// shipped anywhere) and, if correct, mints a short-lived custom token for
// the matching account via signInWithCustomToken. The birthday itself isn't
// secret — it's shown throughout the app's own UI on purpose — the point is
// only that passing this check no longer hands out a reusable static secret.
const BIRTHDAYS = { her: '2003-08-06', him: '2005-06-14' }; // mirrors src/config/relationship.ts
const RELATIONSHIP_START = '2026-08-11';
const FIRST_SIGHT = '2026-08-04';
const PARTNER_EMAILS = { her: 'lihle@ourstory.app', him: 'phathu@ourstory.app' };

/** Same acceptable date-format list as the client's local UX gate, so typing still feels as forgiving. */
function dateVariants(iso) {
  const [y, m, d] = iso.split('-');
  const dayNum = String(Number(d));
  const monthNum = String(Number(m));
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];
  const monthName = months[Number(m) - 1] ?? '';
  const monthShort = monthName.slice(0, 3);
  return [
    iso, `${d}${m}${y}`, `${y}${m}${d}`, `${d}/${m}/${y}`, `${d}-${m}-${y}`,
    `${dayNum}/${monthNum}/${y}`, `${dayNum}-${monthNum}-${y}`,
    `${d} ${monthName} ${y}`, `${dayNum} ${monthName} ${y}`,
    `${d} ${monthShort} ${y}`, `${dayNum} ${monthShort} ${y}`,
    `${monthName} ${d} ${y}`, `${monthName} ${dayNum} ${y}`,
    `${monthShort} ${d} ${y}`, `${monthShort} ${dayNum} ${y}`,
    `${d} ${monthName}`, `${dayNum} ${monthName}`,
  ];
}

function acceptableAnswers(personId) {
  return new Set([
    ...dateVariants(BIRTHDAYS[personId]),
    ...dateVariants(RELATIONSHIP_START),
    ...dateVariants(FIRST_SIGHT),
  ]);
}

const normalizeAnswer = (s) => String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_ATTEMPTS = 20;

exports.signInAsPartner = onCall({ region: 'africa-south1' }, async (request) => {
  const { personId, answer } = request.data || {};
  if (personId !== 'her' && personId !== 'him') {
    throw new HttpsError('invalid-argument', 'personId must be "her" or "him".');
  }

  // Rate limit BEFORE checking the answer, so failed attempts (which is the
  // scenario this is actually defending against) always count.
  const attemptRef = db.doc(`authAttempts/${personId}`);
  const now = Date.now();
  const attemptData = (await attemptRef.get()).data();
  const withinWindow = now - (attemptData?.windowStart ?? 0) < RATE_LIMIT_WINDOW_MS;
  const count = withinWindow ? (attemptData?.count ?? 0) : 0;

  if (withinWindow && count >= RATE_LIMIT_MAX_ATTEMPTS) {
    throw new HttpsError('resource-exhausted', 'Too many attempts — try again later.');
  }
  await attemptRef.set({ count: count + 1, windowStart: withinWindow ? attemptData.windowStart : now });

  const accepted = new Set([...acceptableAnswers(personId)].map(normalizeAnswer));
  if (!accepted.has(normalizeAnswer(answer))) {
    throw new HttpsError('permission-denied', 'That answer is not correct.');
  }

  // Correct — clear the counter so a real login isn't penalized by earlier typos.
  await attemptRef.delete().catch(() => {});

  const email = PARTNER_EMAILS[personId];
  const userRecord = await adminAuth.getUserByEmail(email).catch(() => null);
  if (!userRecord) {
    throw new HttpsError('not-found', 'Account not found — this needs a one-time admin fix.');
  }

  const token = await adminAuth.createCustomToken(userRecord.uid);
  return { token };
});
