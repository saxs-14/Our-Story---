/**
 * MongoDB Atlas Data API client.
 * Used for syncing content (letters, dreams, memories, gallery) to Atlas.
 * Falls back silently when env vars are missing — app stays local-first.
 *
 * Setup: See .env.example for Atlas App Services configuration.
 */

const APP_ID = import.meta.env.VITE_MONGODB_APP_ID as string | undefined;
const API_KEY = import.meta.env.VITE_MONGODB_API_KEY as string | undefined;
const DATA_SOURCE = (import.meta.env.VITE_MONGODB_DATA_SOURCE as string) || 'Cluster0';
const DATABASE = (import.meta.env.VITE_MONGODB_DATABASE as string) || 'our-story';

export const MONGO_CONFIGURED = Boolean(APP_ID && API_KEY);

const BASE = APP_ID
  ? `https://us-east-1.aws.data.mongodb-api.com/app/${APP_ID}/endpoint/data/v1`
  : null;

async function atlasRequest(action: string, collection: string, body: object) {
  if (!BASE || !API_KEY) return null;
  try {
    const res = await fetch(`${BASE}/action/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apiKey: API_KEY,
      },
      body: JSON.stringify({
        dataSource: DATA_SOURCE,
        database: DATABASE,
        collection,
        ...body,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null; // offline or not configured
  }
}

// ── Generic CRUD helpers ──────────────────────────────────────────────────────

export async function mongoInsert(collection: string, document: object) {
  return atlasRequest('insertOne', collection, { document });
}

export async function mongoUpsert(collection: string, filter: object, update: object) {
  return atlasRequest('updateOne', collection, {
    filter,
    update: { $set: update },
    upsert: true,
  });
}

export async function mongoDelete(collection: string, filter: object) {
  return atlasRequest('deleteOne', collection, { filter });
}

export async function mongoFind<T>(collection: string, filter: object = {}): Promise<T[]> {
  const res = await atlasRequest('find', collection, { filter, sort: { createdAt: -1 }, limit: 1000 });
  return (res?.documents ?? []) as T[];
}

// ── Typed sync helpers ────────────────────────────────────────────────────────

/** Push a user-authored letter to Atlas */
export async function syncLetter(letter: { id: string; [key: string]: unknown }) {
  return mongoUpsert('letters', { id: letter.id }, { ...letter, updatedAt: new Date().toISOString() });
}

/** Push a user dream to Atlas */
export async function syncDream(dream: { id: string; [key: string]: unknown }) {
  return mongoUpsert('dreams', { id: dream.id }, { ...dream, updatedAt: new Date().toISOString() });
}

/** Push a memory to Atlas */
export async function syncMemory(memory: { id: string; [key: string]: unknown }) {
  return mongoUpsert('memories', { id: memory.id }, { ...memory, updatedAt: new Date().toISOString() });
}

/** Remove a document from a collection */
export async function removeFromAtlas(collection: string, id: string) {
  return mongoDelete(collection, { id });
}

/** Pull all content for a collection (used for initial load on new device) */
export async function pullFromAtlas<T extends { id: string }>(collection: string): Promise<T[]> {
  return mongoFind<T>(collection);
}
