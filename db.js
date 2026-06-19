/**
 * db.js
 * Thin promise-based wrapper around IndexedDB. This is the app's
 * source of truth while offline; the Google Sheet is the source of
 * truth once synced. Object stores:
 *   products    - local copy of every product (keyed by id)
 *   syncQueue   - pending operations waiting to reach the server
 *   transactions- local cache of stock-movement history
 *   meta        - small key/value bag (last sync time, cached creds, settings)
 */

const DB_NAME = 'utilityStoreDB';
const DB_VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'opId' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise = null;
function getDb() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

function tx(storeName, mode, fn) {
  return getDb().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const result = fn(store);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  }));
}

const Store = {
  getAll(storeName) {
    return getDb().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(storeName, 'readonly');
      const req = t.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  },
  get(storeName, key) {
    return getDb().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(storeName, 'readonly');
      const req = t.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  },
  put(storeName, obj) {
    return tx(storeName, 'readwrite', store => store.put(obj));
  },
  bulkPut(storeName, objs) {
    return tx(storeName, 'readwrite', store => objs.forEach(o => store.put(o)));
  },
  delete(storeName, key) {
    return tx(storeName, 'readwrite', store => store.delete(key));
  },
  clear(storeName) {
    return tx(storeName, 'readwrite', store => store.clear());
  }
};

window.Store = Store;
