import { canonical, decodeRecord, type CompletedRecord } from './contracts';
let opening: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  opening ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('pirate-battle:v1', 1);
    request.onupgradeneeded = () => {
      for (const name of ['outbox', 'records', 'meta'])
        if (!request.result.objectStoreNames.contains(name))
          request.result.createObjectStore(name);
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        opening = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      opening = undefined;
      reject(new Error('Browser storage could not be opened.'));
    };
    request.onblocked = () => {
      opening = undefined;
      reject(new Error('Close other game tabs to update storage.'));
    };
  });
  return opening;
}
function readRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(new Error('Browser storage could not be read.'));
  });
}
function done(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = transaction.onabort = () =>
      reject(new Error('Browser storage could not be saved.'));
  });
}
export async function persistResult(record: CompletedRecord) {
  const db = await open(),
    tx = db.transaction(['outbox', 'meta'], 'readwrite'),
    complete = done(tx);
  tx.objectStore('outbox').put(record, record.matchId);
  tx.objectStore('meta').put(record, 'latest');
  await complete;
}
export async function latestResult(): Promise<CompletedRecord | null> {
  const db = await open();
  const value: unknown = await readRequest(
    db.transaction('meta').objectStore('meta').get('latest'),
  );
  return value === undefined ? null : decodeRecord(value);
}
export async function pendingResults(): Promise<CompletedRecord[]> {
  const db = await open();
  const values: unknown[] = await readRequest(
    db.transaction('outbox').objectStore('outbox').getAll(),
  );
  return values.map(decodeRecord);
}
export async function acknowledge(record: CompletedRecord) {
  const db = await open(),
    tx = db.transaction(['outbox', 'meta'], 'readwrite'),
    complete = done(tx);
  tx.objectStore('outbox').delete(record.matchId);
  tx.objectStore('meta').put(true, 'ack:' + record.matchId);
  await complete;
}
export async function isAcknowledged(id: string): Promise<boolean> {
  const db = await open();
  const value: unknown = await readRequest(
    db
      .transaction('meta')
      .objectStore('meta')
      .get('ack:' + id),
  );
  return value === true;
}
export async function records(): Promise<{
  items: CompletedRecord[];
  revision: number;
}> {
  const db = await open(),
    tx = db.transaction(['records', 'meta']);
  const [items, revision] = await Promise.all([
    readRequest<unknown[]>(tx.objectStore('records').getAll()),
    readRequest<unknown>(tx.objectStore('meta').get('revision')),
  ]);
  return {
    items: items.map(decodeRecord),
    revision: typeof revision === 'number' ? revision : 0,
  };
}
export class RecordConflict extends Error {}
export async function commitRecord(
  record: CompletedRecord,
): Promise<CompletedRecord> {
  const db = await open(),
    tx = db.transaction(['records', 'meta'], 'readwrite'),
    complete = done(tx),
    store = tx.objectStore('records');
  let result: CompletedRecord = record,
    conflict = false;
  const existing = store.get(record.matchId);
  existing.onsuccess = () => {
    const raw: unknown = existing.result;
    if (raw !== undefined) {
      result = decodeRecord(raw);
      if (canonical(result) !== canonical(record)) conflict = true;
    } else {
      store.put(record, record.matchId);
      const rev = tx.objectStore('meta').get('revision');
      rev.onsuccess = () => {
        const value: unknown = rev.result;
        tx.objectStore('meta').put(
          (typeof value === 'number' ? value : 0) + 1,
          'revision',
        );
      };
    }
  };
  await complete;
  if (conflict)
    throw new RecordConflict('This match ID already has a different result.');
  return result;
}
export async function resetDemoData() {
  const db = await open(),
    tx = db.transaction(['outbox', 'records', 'meta'], 'readwrite'),
    complete = done(tx);
  for (const name of ['outbox', 'records', 'meta'])
    tx.objectStore(name).clear();
  await complete;
}
export async function closeDatabase() {
  if (opening) {
    (await opening).close();
    opening = undefined;
  }
}
