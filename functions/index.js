/**
 * Server-side triggers that send push notifications for new chat messages
 * and incoming calls, so they reach a device even when the app is closed
 * or the phone is locked — something no client-side code can do alone.
 *
 * Requires the Blaze (pay-as-you-go) billing plan; Cloud Functions don't
 * run at all on the free Spark plan.
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

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
