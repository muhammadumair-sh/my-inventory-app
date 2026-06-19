/**
 * app.js
 * Wires together auth/db/sync/inventory into the actual UI. Plain DOM,
 * no framework — kept simple on purpose so it's easy to extend later.
 */

const App = {
  currentView: 'dashboard',
  products: [],
  searchQuery: '',
  statusFilter: ''
};

function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

function toast(message, type = '') {
  const stack = $('#toastStack');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ---------------- Theme ---------------- */
async function initTheme() {
  const saved = (await Store.get('meta', 'theme'));
  const theme = saved ? saved.value : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  $('#themeToggle').checked = theme === 'dark';
}
async function toggleTheme(dark) {
  const theme = dark ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  await Store.put('meta', { key: 'theme', value: theme });
}

/* ---------------- Boot ---------------- */
async function boot() {
  await initTheme();
  bindStaticEvents();

  const loggedIn = await Auth.loadCachedSession();
  if (loggedIn) {
    await enterApp();
  } else {
    showLogin();
  }

  updateConnIndicator('offline');
  if (navigator.onLine) {
    const online = await Api.isOnline();
    updateConnIndicator(online ? 'online' : 'offline');
  }
  window.addEventListener('online', async () => updateConnIndicator((await Api.isOnline()) ? 'online' : 'offline'));
  window.addEventListener('offline', () => updateConnIndicator('offline'));

  Sync.onSyncEvent((event, detail) => {
    if (event === 'sync-start') updateConnIndicator('syncing');
    if (event === 'sync-success') {
      updateConnIndicator('online');
      App.products = detail.products;
      renderCurrentView();
      updatePendingBadge();
    }
    if (event === 'sync-offline') updateConnIndicator('offline');
    if (event === 'sync-error') { updateConnIndicator('offline'); }
    if (event === 'op-failed') toast('Sync issue: ' + (detail.error || 'an operation failed'), 'error');
  });
}

function showLogin() {
  $('#loginScreen').classList.remove('hidden');
  $('#appShell').classList.add('hidden');
}

async function enterApp() {
  $('#loginScreen').classList.add('hidden');
  $('#appShell').classList.remove('hidden');

  const user = Auth.currentUser();
  $('#sidebarWho').textContent = user.username;
  $('#sidebarRole').textContent = user.role;
  $$('.admin-only').forEach(el => el.classList.toggle('hidden', user.role !== 'admin'));

  App.products = await Inventory.listProducts();
  renderCurrentView();
  updatePendingBadge();

  Sync.startAutoSync();
  Sync.syncNow();
}

/* ---------------- Connection indicator ---------------- */
function updateConnIndicator(state) {
  const el = $('#connIndicator');
  el.className = 'conn-dot ' + state;
  const label = state === 'online' ? 'Online' : state === 'syncing' ? 'Syncing' : 'Offline';
  el.querySelector('.label').textContent = label;
}

async function updatePendingBadge() {
  const count = await Sync.pendingCount();
  const badge = $('#pendingBadge');
  if (count > 0) {
    badge.textContent = count + ' pending';
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

/* ---------------- Navigation ---------------- */
function bindStaticEvents() {
  $('#loginForm').addEventListener('submit', onLoginSubmit);
  $('#themeToggle').addEventListener('change', e => toggleTheme(e.target.checked));

  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  $('#logoutBtn').addEventListener('click', async () => {
    await Auth.logout();
    showLogin();
  });

  $('#syncNowBtn').addEventListener('click', async () => {
    await Sync.syncNow();
    toast('Sync complete.', 'success');
    await updatePendingBadge();
  });

  $('#addProductBtn').addEventListener('click', () => openProductModal());
  $('#searchInput').addEventListener('input', e => {
    App.searchQuery = e.target.value;
    renderInventory();
  });
  $('#statusFilter').addEventListener('change', e => {
    App.statusFilter = e.target.value;
    renderInventory();
  });

  $('#productForm').addEventListener('submit', onProductFormSubmit);
  $('#closeProductModal').addEventListener('click', closeProductModal);
  $('#cancelProductModal').addEventListener('click', closeProductModal);

  $('#stockForm').addEventListener('submit', onStockFormSubmit);
  $('#closeStockModal').addEventListener('click', closeStockModal);
  $('#cancelStockModal').addEventListener('click', closeStockModal);

  $('#scriptUrlForm').addEventListener('submit', onScriptUrlSave);
  $('#changePasswordForm').addEventListener('submit', onChangePassword);
  $('#addUserForm').addEventListener('submit', onAddUser);
}

function switchView(view) {
  App.currentView = view;
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.view').forEach(v => v.classList.add('hidden'));
  $('#view-' + view).classList.remove('hidden');
  $('#viewTitle').textContent = $(`.nav-item[data-view="${view}"]`).textContent.trim();
  renderCurrentView();
}

async function renderCurrentView() {
  if (App.currentView === 'dashboard') renderDashboard();
  if (App.currentView === 'inventory') renderInventory();
  if (App.currentView === 'transactions') renderTransactions();
  if (App.currentView === 'settings') renderSettings();
}

/* ---------------- Login ---------------- */
async function onLoginSubmit(e) {
  e.preventDefault();
  const username = $('#loginUsername').value.trim();
  const password = $('#loginPassword').value;
  const errEl = $('#loginError');
  errEl.textContent = '';
  try {
    await Auth.login(username, password);
    $('#loginForm').reset();
    await enterApp();
  } catch (err) {
    errEl.textContent = err.message;
  }
}

/* ---------------- Dashboard ---------------- */
function renderDashboard() {
  const products = App.products;
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + (Number(p.quantity) || 0), 0);
  const lowStock = products.filter(p => p.status === 'Low Stock').length;
  const outOfStock = products.filter(p => p.status === 'Out of Stock').length;
  const inventoryValue = products.reduce((s, p) => s + (Number(p.quantity) || 0) * (Number(p.sellingPrice) || 0), 0);

  $('#kpiGrid').innerHTML = `
    <div class="kpi"><div class="label">Total products</div><div class="value num">${totalProducts}</div></div>
    <div class="kpi ok"><div class="label">Total stock units</div><div class="value num">${totalStock}</div></div>
    <div class="kpi warn"><div class="label">Low stock</div><div class="value num">${lowStock}</div></div>
    <div class="kpi danger"><div class="label">Out of stock</div><div class="value num">${outOfStock}</div></div>
    <div class="kpi"><div class="label">Inventory value</div><div class="value num">${formatCurrency(inventoryValue)}</div></div>
  `;

  const alerts = products.filter(p => p.status === 'Low Stock' || p.status === 'Out of Stock')
    .sort((a, b) => (a.status === 'Out of Stock' ? -1 : 1));
  const alertsBody = $('#alertsPanelBody');
  if (alerts.length === 0) {
    alertsBody.innerHTML = `<div class="empty-state">Stock looks healthy — nothing needs restocking right now.</div>`;
  } else {
    alertsBody.innerHTML = renderTable(alerts.slice(0, 8), true);
    bindRowActions(alertsBody);
  }

  Store.getAll('transactions').then(txns => {
    const recent = txns.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1)).slice(0, 6);
    const body = $('#recentActivityBody');
    if (recent.length === 0) {
      body.innerHTML = `<div class="empty-state">No activity recorded on this device yet.</div>`;
      return;
    }
    body.innerHTML = `<table><thead><tr><th>Time</th><th>Product</th><th>Change</th><th>By</th></tr></thead><tbody>` +
      recent.map(t => `<tr>
        <td class="num">${t.date} ${t.time}</td>
        <td>${escapeHtml(t.productName)}</td>
        <td class="num">${t.quantityChange > 0 ? '+' : ''}${t.quantityChange}</td>
        <td>${escapeHtml(t.username || '—')}</td>
      </tr>`).join('') + `</tbody></table>`;
  });
}

function formatCurrency(n) {
  return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/* ---------------- Inventory ---------------- */
function renderInventory() {
  let list = Inventory.searchProducts(App.products, App.searchQuery);
  if (App.statusFilter) list = list.filter(p => p.status === App.statusFilter);
  list = list.slice().sort((a, b) => a.name.localeCompare(b.name));

  const body = $('#inventoryTableBody');
  if (list.length === 0) {
    body.innerHTML = `<div class="empty-state">No products match. Try a different search, or add your first product.</div>`;
    return;
  }
  body.innerHTML = renderTable(list, false);
  bindRowActions(body);
}

function statusBadge(status) {
  const cls = status === 'Out of Stock' ? 'badge-danger' : status === 'Low Stock' ? 'badge-warn' : 'badge-ok';
  return `<span class="badge ${cls}">${status}</span>`;
}

function renderTable(list, compact) {
  return `<table>
    <thead><tr>
      <th>Product</th><th>Category</th><th>Qty</th><th>Status</th>${compact ? '' : '<th>Price</th><th>Barcode</th>'}<th></th>
    </tr></thead>
    <tbody>
      ${list.map(p => `
        <tr data-id="${p.id}">
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category || '—')}</td>
          <td class="num">${p.quantity}</td>
          <td>${statusBadge(p.status)}</td>
          ${compact ? '' : `<td class="num">${formatCurrency(p.sellingPrice)}</td><td class="num">${escapeHtml(p.barcode || '—')}</td>`}
          <td>
            <div class="row-actions">
              <button class="btn btn-small" data-action="adjust" data-id="${p.id}">Stock</button>
              <button class="btn btn-small admin-only ${Auth.isAdmin() ? '' : 'hidden'}" data-action="edit" data-id="${p.id}">Edit</button>
              <button class="btn btn-small btn-danger admin-only ${Auth.isAdmin() ? '' : 'hidden'}" data-action="delete" data-id="${p.id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>`;
}

function bindRowActions(root) {
  $$('button[data-action]', root).forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const product = App.products.find(p => p.id === id);
      if (!product) return;
      if (action === 'adjust') openStockModal(product);
      if (action === 'edit') openProductModal(product);
      if (action === 'delete') {
        if (confirm(`Delete "${product.name}"? This can't be undone.`)) {
          await Inventory.deleteProduct(id);
          App.products = await Inventory.listProducts();
          renderCurrentView();
          updatePendingBadge();
          toast('Product deleted.', 'success');
        }
      }
    });
  });
}

/* ---------------- Product modal ---------------- */
let editingProductId = null;
function openProductModal(product) {
  editingProductId = product ? product.id : null;
  $('#productModalTitle').textContent = product ? 'Edit product' : 'Add product';
  const f = $('#productForm');
  f.reset();
  if (product) {
    Object.keys(product).forEach(key => {
      const input = f.elements[key];
      if (input) input.value = product[key];
    });
  }
  $('#productModalOverlay').classList.remove('hidden');
}
function closeProductModal() {
  $('#productModalOverlay').classList.add('hidden');
  editingProductId = null;
}
async function onProductFormSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const fields = {
    name: f.name.value.trim(),
    barcode: f.barcode.value.trim(),
    category: f.category.value.trim(),
    brand: f.brand.value.trim(),
    supplier: f.supplier.value.trim(),
    purchasePrice: Number(f.purchasePrice.value) || 0,
    sellingPrice: Number(f.sellingPrice.value) || 0,
    quantity: Number(f.quantity.value) || 0,
    minStock: Number(f.minStock.value) || 0,
    maxStock: Number(f.maxStock.value) || 0,
    unit: f.unit.value.trim() || 'pcs',
    location: f.location.value.trim(),
    description: f.description.value.trim()
  };
  if (!fields.name) { toast('Product name is required.', 'error'); return; }

  if (editingProductId) {
    await Inventory.updateProduct(editingProductId, fields);
    toast('Product updated.', 'success');
  } else {
    await Inventory.addProduct(fields);
    toast('Product added.', 'success');
  }
  closeProductModal();
  App.products = await Inventory.listProducts();
  renderCurrentView();
  updatePendingBadge();
}

/* ---------------- Stock adjustment modal ---------------- */
let stockProductId = null;
function openStockModal(product) {
  stockProductId = product.id;
  $('#stockModalTitle').textContent = 'Adjust stock — ' + product.name;
  $('#stockCurrentQty').textContent = product.quantity;
  $('#stockForm').reset();
  $('#stockModalOverlay').classList.remove('hidden');
}
function closeStockModal() {
  $('#stockModalOverlay').classList.add('hidden');
  stockProductId = null;
}
async function onStockFormSubmit(e) {
  e.preventDefault();
  const f = e.target;
  const operation = f.operation.value;
  const amount = Number(f.amount.value);
  const notes = f.notes.value.trim();
  if (!amount || amount < 0) { toast('Enter a valid quantity.', 'error'); return; }

  await Inventory.adjustStock(stockProductId, operation, amount, notes);
  closeStockModal();
  App.products = await Inventory.listProducts();
  renderCurrentView();
  updatePendingBadge();
  toast('Stock updated.', 'success');
}

/* ---------------- Transactions ---------------- */
async function renderTransactions() {
  const body = $('#transactionsBody');
  body.innerHTML = `<div class="empty-state">Loading…</div>`;
  let txns = await Store.getAll('transactions');

  if (await Api.isOnline()) {
    try {
      const res = await Api.apiCall('listTransactions', { limit: 200 });
      if (res.success) txns = res.transactions;
    } catch (e) { /* fall back to local cache below */ }
  }

  txns = txns.sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
  if (txns.length === 0) {
    body.innerHTML = `<div class="empty-state">No transactions yet.</div>`;
    return;
  }
  body.innerHTML = `<table><thead><tr>
      <th>Date</th><th>Time</th><th>Product</th><th>Operation</th><th>Change</th><th>New stock</th><th>By</th><th>Notes</th>
    </tr></thead><tbody>` +
    txns.map(t => `<tr>
        <td class="num">${t.date}</td>
        <td class="num">${t.time}</td>
        <td>${escapeHtml(t.productName)}</td>
        <td>${escapeHtml(t.operation)}</td>
        <td class="num">${t.quantityChange > 0 ? '+' : ''}${t.quantityChange}</td>
        <td class="num">${t.newStock}</td>
        <td>${escapeHtml(t.username || '—')}</td>
        <td>${escapeHtml(t.notes || '—')}</td>
      </tr>`).join('') + `</tbody></table>`;
}

/* ---------------- Settings ---------------- */
async function renderSettings() {
  $('#scriptUrlInput').value = Api.getScriptUrl() || '';

  if (Auth.isAdmin()) {
    try {
      const res = await Api.apiCall('listUsers', {});
      const body = $('#usersTableBody');
      if (res.success) {
        body.innerHTML = `<table><thead><tr><th>Username</th><th>Role</th><th></th></tr></thead><tbody>` +
          res.users.map(u => `<tr>
              <td>${escapeHtml(u.username)}</td>
              <td>${escapeHtml(u.role)}</td>
              <td>${u.username === Auth.currentUser().username ? '' : `<button class="btn btn-small btn-danger" data-remove-user="${u.id}">Remove</button>`}</td>
            </tr>`).join('') + `</tbody></table>`;
        $$('button[data-remove-user]', body).forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('Remove this user?')) return;
            const res2 = await Api.apiCall('removeUser', { userId: btn.dataset.removeUser });
            if (res2.success) { toast('User removed.', 'success'); renderSettings(); }
            else toast(res2.error, 'error');
          });
        });
      } else {
        body.innerHTML = `<div class="empty-state">${escapeHtml(res.error || 'Could not load users — check your connection.')}</div>`;
      }
    } catch (err) {
      $('#usersTableBody').innerHTML = `<div class="empty-state">Connect to the internet to manage users.</div>`;
    }
  }
}

async function onScriptUrlSave(e) {
  e.preventDefault();
  const url = $('#scriptUrlInput').value.trim();
  Api.setScriptUrl(url);
  toast('Backend URL saved.', 'success');
  const online = await Api.isOnline();
  updateConnIndicator(online ? 'online' : 'offline');
}

async function onChangePassword(e) {
  e.preventDefault();
  const f = e.target;
  const newPass = f.newPassword.value;
  if (newPass.length < 6) { toast('Password should be at least 6 characters.', 'error'); return; }
  try {
    const hash = await sha256Hex(newPass);
    const res = await Api.apiCall('changePassword', { newPasswordHash: hash });
    if (res.success) { toast('Password changed.', 'success'); f.reset(); }
    else toast(res.error, 'error');
  } catch (err) {
    toast('Needs an internet connection to change your password.', 'error');
  }
}

async function onAddUser(e) {
  e.preventDefault();
  const f = e.target;
  const username = f.username.value.trim();
  const password = f.password.value;
  const role = f.role.value;
  if (!username || password.length < 6) {
    toast('Username and a password of at least 6 characters are required.', 'error');
    return;
  }
  try {
    const hash = await sha256Hex(password);
    const res = await Api.apiCall('addUser', { username, passwordHash: hash, role });
    if (res.success) { toast('User added.', 'success'); f.reset(); renderSettings(); }
    else toast(res.error, 'error');
  } catch (err) {
    toast('Needs an internet connection to add a user.', 'error');
  }
}

/* ---------------- Utils ---------------- */
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

document.addEventListener('DOMContentLoaded', boot);
