/**
 * sync.js
 * The offline-first engine:
 *   - Every write (add product, adjust stock, etc.) is applied to
 *     IndexedDB immediately (so the UI updates instantly, online or not)
 *     and pushed onto syncQueue.
 *   - syncNow() drains syncQueue to the server when online. Each queued
 *     op carries a stable opId, so a retried/duplicated send is a no-op
 *     on the server (see Sync.gs).
 *   - After pushing, we pull the full product list back down, which is
 *     how multiple devices converge ("last write wins" per field, since
 *     the server applies ops in the order it receives them).
 */

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let syncInFlight = false;
const listeners = new Set();
function onSyncEvent(fn) { listeners.add(fn); }
function emit(event, detail) { listeners.forEach(fn => fn(event, detail)); }

async function queueOp(type, payload) {
  const opId = uuid();
  await Store.put('syncQueue', { opId, type, payload, queuedAt: new Date().toISOString() });
  return opId;
}

async function pendingCount() {
  const all = await Store.getAll('syncQueue');
  return all.length;
}

/** Pulls the full product list from the server and overwrites the local cache. */
async function pullProducts() {
  const res = await Api.apiCall('pull', {});
  if (!res.success) throw new Error(res.error || 'Pull failed.');
  await Store.clear('products');
  await Store.bulkPut('products', res.products);
  await Store.put('meta', { key: 'lastSync', value: res.serverTime });
  return res.products;
}

/** Sends every queued op to the server, applies results locally, clears the queue. */
async function pushQueue() {
  const queue = await Store.getAll('syncQueue');
  if (queue.length === 0) return { pushed: 0 };

  const ops = queue.map(q => ({ opId: q.opId, type: q.type, payload: q.payload }));
  const res = await Api.apiCall('sync', { ops });
  if (!res.success) throw new Error(res.error || 'Sync failed.');

  for (const r of res.results) {
    await Store.delete('syncQueue', r.opId);
    if (!r.success) {
      emit('op-failed', r);
    }
  }
  return { pushed: res.results.length, results: res.results };
}

/** Full sync cycle: push pending changes, then pull the latest server state. */
async function syncNow() {
  if (syncInFlight) return { skipped: true };
  syncInFlight = true;
  emit('sync-start');
  try {
    const online = await Api.isOnline();
    if (!online) {
      emit('sync-offline');
      return { offline: true };
    }
    const pushResult = await pushQueue();
    const products = await pullProducts();
    emit('sync-success', { products, pushResult });
    return { success: true, products, pushResult };
  } catch (err) {
    emit('sync-error', err);
    return { success: false, error: String(err) };
  } finally {
    syncInFlight = false;
  }
}

function startAutoSync() {
  const interval = (window.APP_CONFIG && window.APP_CONFIG.SYNC_INTERVAL_MS) || 30000;
  setInterval(() => { syncNow(); }, interval);
  window.addEventListener('online', () => syncNow());
}

window.Sync = {
  uuid, queueOp, pendingCount, pullProducts, pushQueue, syncNow, startAutoSync, onSyncEvent
};
