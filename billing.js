/**
 * billing.js
 * Simple counter billing: search a product, add it (with quantity) to a
 * cart, repeat, then "Generate bill" which —
 *   1. deducts stock for every line item (going through Inventory.adjustStock,
 *      so it's offline-safe and logged in Transactions like any other
 *      stock change), and
 *   2. saves a bill record locally for the receipt + history view.
 *
 * Bill numbers are generated per-device (date + a daily counter stored in
 * IndexedDB), so they're guaranteed unique on one device but are NOT a
 * single shared sequence across multiple devices/counters — two devices
 * can both produce "INV-20260619-0001" on the same day. Each bill itself
 * still has a separate internal id, so nothing is ever overwritten or
 * lost; this only affects how the printed numbers look across counters.
 */

const Cart = { items: [] }; // { productId, name, unit, price, qty, available }

function cartAdd(product, qty) {
  qty = Number(qty) || 0;
  if (qty <= 0) return;
  const existing = Cart.items.find(i => i.productId === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    Cart.items.push({
      productId: product.id,
      name: product.name,
      unit: product.unit || 'pcs',
      price: Number(product.sellingPrice) || 0,
      qty,
      available: Number(product.quantity) || 0
    });
  }
}

function cartUpdateQty(productId, qty) {
  const line = Cart.items.find(i => i.productId === productId);
  if (!line) return;
  qty = Number(qty) || 0;
  if (qty <= 0) {
    cartRemove(productId);
  } else {
    line.qty = qty;
  }
}

function cartRemove(productId) {
  Cart.items = Cart.items.filter(i => i.productId !== productId);
}

function cartClear() {
  Cart.items = [];
}

function cartTotal() {
  return Cart.items.reduce((sum, i) => sum + i.qty * i.price, 0);
}

async function nextBillNumber() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rec = await Store.get('meta', 'billCounter');
  let seq = 1;
  if (rec && rec.value && rec.value.date === today) {
    seq = rec.value.seq + 1;
  }
  await Store.put('meta', { key: 'billCounter', value: { date: today, seq } });
  return `INV-${today}-${String(seq).padStart(4, '0')}`;
}

/**
 * Applies the cart to inventory (deducting stock + logging transactions),
 * saves a bill record, and clears the cart. Returns the saved bill.
 */
async function generateBill(notesPrefix) {
  if (Cart.items.length === 0) throw new Error('Cart is empty.');

  const billNumber = await nextBillNumber();
  const now = new Date();
  const lines = [];

  for (const line of Cart.items) {
    await Inventory.adjustStock(
      line.productId,
      'decrease',
      line.qty,
      `Sale — Bill ${billNumber}${notesPrefix ? ' (' + notesPrefix + ')' : ''}`
    );
    lines.push({
      productId: line.productId,
      name: line.name,
      unit: line.unit,
      price: line.price,
      qty: line.qty,
      lineTotal: line.qty * line.price
    });
  }

  const bill = {
    id: Sync.uuid(),
    billNumber,
    date: now.toISOString().slice(0, 10),
    time: now.toISOString().slice(11, 19),
    cashier: Auth.currentUser() ? Auth.currentUser().username : '',
    items: lines,
    total: lines.reduce((s, l) => s + l.lineTotal, 0)
  };
  await Store.put('bills', bill);
  cartClear();
  return bill;
}

async function listBills(limit = 50) {
  const all = await Store.getAll('bills');
  return all.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)).slice(0, limit);
}

async function getBill(id) {
  return Store.get('bills', id);
}

window.Billing = {
  Cart, cartAdd, cartUpdateQty, cartRemove, cartClear, cartTotal,
  generateBill, listBills, getBill
};
