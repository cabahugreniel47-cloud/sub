import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Durable cloud storage for the shared clinic database (Firestore).
 * Why: hosting platforms such as AI Studio / Cloud Run have a temporary disk, so a JSON file
 * is wiped on every restart/redeploy. The in-memory state in database.ts stays the source of
 * truth for requests (fast, synchronous); every change is written through to Firestore, and
 * the state is reloaded from Firestore when the server starts.
 *
 * Layout: collection `clinic_state`, one or more documents per data key
 *   `<key>__0000`, `<key>__0001`, ...  each holding { key, idx, items: <JSON string> }
 * Arrays are split into chunks by size so a document never nears Firestore's 1 MB limit,
 * and array order is preserved exactly. Only chunks whose content changed are rewritten.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLLECTION = 'clinic_state';
const MAX_CHUNK_CHARS = 600_000;
const META_KEY = 'meta';

export const ARRAY_KEYS = [
  'users',
  'sessions',
  'patients',
  'vitalSigns',
  'medicines',
  'transactions',
  'queue',
  'consultations',
  'certificates',
  'appointments',
  'activityLogs',
  'notifications',
  'registrationRequests'
] as const;

let fdb: any = null;
let getState: (() => any) | null = null;
const synced = new Map<string, string[]>(); // key -> chunk strings last written to Firestore
const dirty = new Set<string>();
let chain: Promise<void> = Promise.resolve();

export function isFirestoreEnabled(): boolean {
  return fdb !== null;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      v => { clearTimeout(t); resolve(v); },
      e => { clearTimeout(t); reject(e); }
    );
  });
}

function readFirebaseConfig(): Record<string, any> {
  const candidates = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(__dirname, '../../firebase-applet-config.json')
  ];
  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      // ignore and try next
    }
  }
  return {};
}

/** Connects to Firestore with server credentials. Returns false (and logs why) if unavailable. */
export async function connectFirestore(stateGetter: () => any): Promise<boolean> {
  getState = stateGetter;
  if (process.env.DISABLE_FIRESTORE === '1') {
    console.log('[Clinic DB] Firestore disabled by DISABLE_FIRESTORE=1, using local file storage only.');
    return false;
  }
  try {
    const config = readFirebaseConfig();
    const projectId = process.env.FIREBASE_PROJECT_ID || config.projectId;
    const databaseId = process.env.FIRESTORE_DATABASE_ID || config.firestoreDatabaseId || undefined;

    const appMod: any = await import('firebase-admin/app');
    const fsMod: any = await import('firebase-admin/firestore');

    const app = appMod.getApps().length
      ? appMod.getApps()[0]
      : appMod.initializeApp({ credential: appMod.applicationDefault(), projectId });

    const db = databaseId && databaseId !== '(default)' ? fsMod.getFirestore(app, databaseId) : fsMod.getFirestore(app);
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // settings can only be applied once; ignore if already applied
    }

    // Connectivity / permission probe
    await withTimeout(db.collection(COLLECTION).limit(1).get(), 15000, 'Firestore connection');
    fdb = db;
    console.log(`[Clinic DB] Connected to Firestore (project ${projectId}${databaseId ? `, database ${databaseId}` : ''}).`);
    return true;
  } catch (err: any) {
    fdb = null;
    console.warn(
      '[Clinic DB] Firestore is NOT available, falling back to local file storage (data resets when the host restarts). Reason:',
      err?.message || err
    );
    return false;
  }
}

function chunkArray(items: any[]): string[] {
  const chunks: string[] = [];
  let current: string[] = [];
  let size = 2;
  for (const item of items) {
    const s = JSON.stringify(item === undefined ? null : item);
    if (current.length > 0 && size + s.length + 1 > MAX_CHUNK_CHARS) {
      chunks.push('[' + current.join(',') + ']');
      current = [];
      size = 2;
    }
    current.push(s);
    size += s.length + 1;
  }
  chunks.push('[' + current.join(',') + ']'); // always at least one chunk, even for []
  return chunks;
}

function docId(key: string, idx: number): string {
  return `${key}__${String(idx).padStart(4, '0')}`;
}

function buildChunks(state: any, key: string): string[] {
  if (key === META_KEY) {
    return [
      JSON.stringify({
        revision: state.revision,
        lastUpdated: state.lastUpdated,
        rolePermissions: state.rolePermissions
      })
    ];
  }
  const value = state[key];
  return chunkArray(Array.isArray(value) ? value : []);
}

/** Loads the whole database from Firestore. Returns null if Firestore holds no data yet. */
export async function loadFromFirestore(): Promise<any | null> {
  if (!fdb) return null;
  const snap: any = await withTimeout(fdb.collection(COLLECTION).get(), 30000, 'Firestore load');
  if (snap.empty) return null;

  const byKey = new Map<string, { idx: number; items: string }[]>();
  snap.forEach((d: any) => {
    const data = d.data();
    if (!data || typeof data.key !== 'string' || typeof data.items !== 'string') return;
    const list = byKey.get(data.key) || [];
    list.push({ idx: Number(data.idx) || 0, items: data.items });
    byKey.set(data.key, list);
  });

  const state: any = {};
  for (const [key, list] of byKey) {
    list.sort((a, b) => a.idx - b.idx);
    synced.set(key, list.map(c => c.items));
    try {
      if (key === META_KEY) {
        Object.assign(state, JSON.parse(list[0].items));
      } else {
        state[key] = list.flatMap(c => JSON.parse(c.items));
      }
    } catch (err) {
      console.error(`[Clinic DB] Could not parse "${key}" from Firestore:`, err);
    }
  }
  return state;
}

async function flush(): Promise<void> {
  if (!fdb || !getState || dirty.size === 0) return;
  const keys = Array.from(dirty);
  dirty.clear();

  const state = getState();
  for (const key of keys) {
    try {
      const next = buildChunks(state, key);
      const prev = synced.get(key) || [];
      const batch = fdb.batch();
      let count = 0;
      next.forEach((items, idx) => {
        if (prev[idx] !== items) {
          batch.set(fdb.collection(COLLECTION).doc(docId(key, idx)), { key, idx, items });
          count++;
        }
      });
      for (let idx = next.length; idx < prev.length; idx++) {
        batch.delete(fdb.collection(COLLECTION).doc(docId(key, idx)));
        count++;
      }
      if (count > 0) {
        // A batch holds at most 500 writes; chunks per key are far below that.
        await batch.commit();
      }
      synced.set(key, next);
    } catch (err: any) {
      console.error(`[Clinic DB] Failed to save "${key}" to Firestore (will retry on next change):`, err?.message || err);
      dirty.add(key);
    }
  }
}

/** Queues the given data keys (and always the meta record) for writing to Firestore. */
export function persistKeys(keys: string[]): void {
  if (!fdb) return;
  for (const k of keys) {
    if ((ARRAY_KEYS as readonly string[]).includes(k as any) || k === 'rolePermissions') {
      dirty.add(k === 'rolePermissions' ? META_KEY : k);
    }
  }
  dirty.add(META_KEY);
  chain = chain.then(flush).catch(() => {});
}

export function persistEverything(): void {
  persistKeys([...ARRAY_KEYS]);
}

/** Resolves when all queued writes have been sent (used on shutdown). */
export function waitForPersist(): Promise<void> {
  return chain;
}
