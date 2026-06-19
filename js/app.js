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

  $('#billingSearchInput').addEventListener('input', renderBillingSearchResults);
  $('#clearCartBtn').addEventListener('click', () => {
    if (Billing.Cart.items.length === 0) return;
    if (confirm('Clear the current bill?')) { Billing.cartClear(); renderCart(); }
  });
  $('#generateBillBtn').addEventListener('click', onGenerateBill);
  $('#closeReceiptModal').addEventListener('click', closeReceiptModal);
  $('#closeReceiptModalBtn').addEventListener('click', closeReceiptModal);
  $('#printReceiptBtn').addEventListener('click', () => window.print());

  // Forgot-password/modal wiring
  $('#forgotPasswordLink')?.addEventListener('click', (e) => { e.preventDefault(); $('#resetRequestOverlay').classList.remove('hidden'); });

  $('#resetRequestForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value.trim();
    try {
      await Auth.sendResetCode(email);
      toast('Reset code sent — check your email.', 'success');
      $('#resetRequestOverlay').classList.add('hidden');
      $('#codeLoginOverlay').classList.remove('hidden');
      $('#codeLoginForm').email.value = email;
    } catch (err) {
      console.error('sendResetCode error', err);
      toast(err.message || 'Could not send code.', 'error');
    }
  });

  $('#codeLoginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const email = f.email.value.trim();
    const code = f.code.value.trim();
    try {
      await Auth.loginWithCode(email, code);
      $('#codeLoginOverlay').classList.add('hidden');
      $('#loginForm').reset();
      await enterApp();
      toast('Logged in with code.', 'success');
    } catch (err) {
      console.error('loginWithCode error', err);
      toast(err.message || 'Code login failed.', 'error');
    }
  });

  $('#resetPasswordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const email = f.email.value.trim();
    const code = f.code.value.trim();
    const newPassword = f.newPassword.value;
    try {
      await Auth.resetPasswordWithCode(email, code, newPassword);
      toast('Password updated. You can now login with your new password.', 'success');
      $('#resetPasswordOverlay').classList.add('hidden');
    } catch (err) {
      console.error('resetPasswordWithCode error', err);
      toast(err.message || 'Could not reset password.', 'error');
    }
  });

  $('#closeResetRequest')?.addEventListener('click', () => $('#resetRequestOverlay').classList.add('hidden'));
  $('#cancelResetRequest')?.addEventListener('click', () => $('#resetRequestOverlay').classList.add('hidden'));
  $('#closeCodeLogin')?.addEventListener('click', () => $('#codeLoginOverlay').classList.add('hidden'));
  $('#cancelCodeLogin')?.addEventListener('click', () => $('#codeLoginOverlay').classList.add('hidden'));
  $('#closeResetPassword')?.addEventListener('click', () => $('#resetPasswordOverlay').classList.add('hidden'));
  $('#cancelResetPasswordBtn')?.addEventListener('click', () => $('#resetPasswordOverlay').classList.add('hidden'));
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
  if (App.currentView === 'billing') renderBilling();
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
    console.error('Login error', err);
    errEl.textContent = err.message || 'Login failed — check console for details.';
  }
}

/* ---------------- Dashboard ---------------- */
function renderDashboard() {
  const products = App.products;
  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + (Number(p.quantity) || 0), 0);
  const lowStock = products.filter(p => p.status === 'Low Stock').length;
  const outOfStock = products.filter(p => p.status === 'Out of Stock').length;

