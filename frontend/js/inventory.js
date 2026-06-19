/**
 * inventory.js
 * Every product write goes through here. It updates IndexedDB immediately
 * (so the UI reflects the change with zero latency, online or offline)
 * and queues the matching op for the sync engine to push later.
 */

function computeStatus(quantity, minStock) {
  quantity = Number(quantity) || 0;
  minStock = Number(minStock) || 0;
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= minStock) return 'Low Stock';
  return 'In Stock';
}

async function listProducts() {
  const all = await Store.getAll('products');
  return all.filter(p => p.status !== 'Deleted');
}

async function addProduct(fields) {
  const now = new Date().toISOString();
  const quantity = Number(fields.quantity) || 0;
  const minStock = Number(fields.minStock) || 0;
  const product = {
    id: Sync.uuid(),
    barcode: fields.barcode || '',
    name: fields.name,
    category: fields.category || '',
    brand: fields.brand || '',
    supplier: fields.supplier || '',
    purchasePrice: Number(fields.purchasePrice) || 0,
    sellingPrice: Number(fields.sellingPrice) || 0,
    quantity,
    minStock,
    maxStock: Number(fields.maxStock) || 0,
    unit: fields.unit || 'pcs',
    location: fields.location || '',
    description: fields.description || '',
    dateAdded: now,
    lastUpdated: now,
    status: computeStatus(quantity, minStock),
    version: 1
  };
  await Store.put('products', product);
  await Sync.queueOp('addProduct', Object.assign({}, product, { localId: product.id }));
  return product;
}

async function updateProduct(id, fields) {
  const existing = await Store.get('products', id);
  if (!existing) throw new Error('Product not found locally.');
  const merged = Object.assign({}, existing, fields, {
    lastUpdated: new Date().toISOString(),
    version: (existing.version || 1) + 1
  });
  merged.status = computeStatus(merged.quantity, merged.minStock);
  await Store.put('products', merged);
  await Sync.queueOp('updateProduct', { id, fields });
  return merged;
}

async function deleteProduct(id) {
  const existing = await Store.get('products', id);
  if (!existing) return;
  await Store.put('products', Object.assign({}, existing, { status: 'Deleted' }));
  await Sync.queueOp('deleteProduct', { id });
}

async function adjustStock(id, operation, quantityChange, notes) {
  const existing = await Store.get('products', id);
  if (!existing) throw new Error('Product not found locally.');
  const oldStock = Number(existing.quantity) || 0;
  let newStock;
  if (operation === 'increase') newStock = oldStock + Math.abs(quantityChange);
  else if (operation === 'decrease') newStock = Math.max(0, oldStock - Math.abs(quantityChange));
  else newStock = Math.max(0, quantityChange); // adjust = absolute set

  const updated = Object.assign({}, existing, {
    quantity: newStock,
    lastUpdated: new Date().toISOString(),
    status: computeStatus(newStock, existing.minStock),
    version: (existing.version || 1) + 1
  });
  await Store.put('products', updated);

  const localTxn = {
    id: Sync.uuid(),
    userId: Auth.currentUser() ? Auth.currentUser().id : '',
    username: Auth.currentUser() ? Auth.currentUser().username : '',
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toISOString().slice(11, 19),
    productId: id,
    productName: existing.name,
    quantityChange: newStock - oldStock,
    oldStock,
    newStock,
    operation,
    notes: notes || ''
  };
  await Store.put('transactions', localTxn);

  await Sync.queueOp('adjustStock', { id, operation, quantityChange, notes });
  return updated;
}

function searchProducts(products, query) {
  if (!query) return products;
  const q = query.trim().toLowerCase();
  return products.filter(p =>
    (p.name || '').toLowerCase().includes(q) ||
    (p.barcode || '').toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q) ||
    (p.supplier || '').toLowerCase().includes(q) ||
    (p.brand || '').toLowerCase().includes(q) ||
    (p.location || '').toLowerCase().includes(q) ||
    (p.id || '').toLowerCase().includes(q)
  );
}

window.Inventory = {
  listProducts, addProduct, updateProduct, deleteProduct, adjustStock, searchProducts, computeStatus
};
