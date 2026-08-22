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
  const presenceSnap = await db.doc(`presence/${recipientId}`).get();
  const presence = presenceSnap.data();

  // Recipient already has the app open — ChatNotifier covers this in-app,
  // a push on top would just be a redundant buzz.
  if (presence?.online) return;

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

  const presenceSnap = await db.doc(`presence/${data.calleeId}`).get();
  const token = presenceSnap.data()?.fcmToken;
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
