/* style.css — Utility Store Inventory
   Design notes: a counter-side tool meant to be read at a glance under
   shop lighting, so contrast and tabular figures matter more than
   decoration. Ledger-inspired structure (rule lines, numbered stock
   states) instead of soft dashboard-card cliches. */

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --ink: #16211d;
  --paper: #eef1ee;
  --panel: #ffffff;
  --line: #d7dcd6;
  --muted: #5b6962;
  --accent: #c1701f;
  --accent-ink: #fff6ec;
  --ok: #2f7a4f;
  --ok-bg: #e3f1e7;
  --warn: #b07a06;
  --warn-bg: #fbf0d6;
  --danger: #ab3326;
  --danger-bg: #f8e2de;
  --radius: 8px;
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'IBM Plex Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}

[data-theme="dark"] {
  --ink: #eef1ee;
  --paper: #111714;
  --panel: #1a2320;
  --line: #2c3934;
  --muted: #94a39c;
  --accent: #e0922f;
  --accent-ink: #1a1208;
  --ok: #6cc596;
  --ok-bg: #15301f;
  --warn: #e3b53c;
  --warn-bg: #382c0c;
  --danger: #e87a6a;
  --danger-bg: #3a1813;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  background: var(--paper);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3 { font-family: var(--font-display); font-weight: 700; margin: 0; letter-spacing: -0.01em; }
.num, .figure { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
a { color: var(--accent); }
button { font-family: inherit; cursor: pointer; }
input, select, textarea { font-family: inherit; font-size: 14px; }

.hidden { display: none !important; }

/* ---------- Login screen ---------- */
#loginScreen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.login-card {
  width: 100%;
  max-width: 360px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 32px 28px;
}
.login-mark {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}
.login-mark .tag {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--muted);
  text-transform: uppercase;
}
.login-card h1 { font-size: 22px; margin-bottom: 24px; }
.field { margin-bottom: 14px; }
.field label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.field input, .field select, .field textarea {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--paper);
  color: var(--ink);
}
.field input:focus, .field select:focus, .field textarea:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: 6px;
  border: 1px solid var(--line);
  background: var(--panel);
  color: var(--ink);
  font-size: 13px;
  font-weight: 500;
}
.btn:hover { border-color: var(--accent); }
.btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink);
}
.btn-primary:hover { filter: brightness(1.05); }
.btn-block { width: 100%; }
.btn-danger { color: var(--danger); border-color: var(--danger); background: transparent; }
.btn-small { padding: 5px 10px; font-size: 12px; }
.login-error {
  color: var(--danger);
  font-size: 13px;
  margin-top: 10px;
  min-height: 18px;
}
.login-foot {
  margin-top: 18px;
  font-size: 12px;
  color: var(--muted);
}
.login-foot button { background: none; border: none; color: var(--accent); padding: 0; font-size: 12px; }

/* ---------- App shell ---------- */
#appShell { display: flex; min-height: 100vh; }

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: var(--ink);
  color: var(--paper);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}
[data-theme="dark"] .sidebar { background: #0c1210; }
.sidebar-brand {
  padding: 0 20px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.12);
  margin-bottom: 12px;
}
.sidebar-brand .tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  opacity: 0.6;
  text-transform: uppercase;
}
.sidebar-brand h1 { font-size: 17px; color: #fff; }
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  font-size: 13px;
  color: rgba(255,255,255,0.72);
  border-left: 3px solid transparent;
  background: none;
  border-top: none; border-right: none; border-bottom: none;
  width: 100%;
  text-align: left;
}
.nav-item:hover { color: #fff; background: rgba(255,255,255,0.05); }
.nav-item.active { color: #fff; border-left-color: var(--accent); background: rgba(255,255,255,0.06); }
.sidebar-foot {
  margin-top: auto;
  padding: 14px 20px 0;
  border-top: 1px solid rgba(255,255,255,0.12);
  font-size: 12px;
}
.who { color: #fff; font-weight: 500; }
.role-pill {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255,255,255,0.12);
  color: #fff;
  margin-top: 4px;
}

.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid var(--line);
  background: var(--panel);
}
.topbar h2 { font-size: 18px; }
.status-cluster { display: flex; align-items: center; gap: 12px; }
.conn-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: var(--font-mono);
  padding: 4px 9px;
  border-radius: 12px;
  border: 1px solid var(--line);
}
.conn-dot .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--muted); }
.conn-dot.online .dot { background: var(--ok); }
.conn-dot.offline .dot { background: var(--danger); }
.conn-dot.syncing .dot { background: var(--warn); }

.view { padding: 24px; flex: 1; }

/* ---------- Dashboard ---------- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.kpi {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 14px 16px;
  border-left: 3px solid var(--line);
}
.kpi .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); }
.kpi .value { font-family: var(--font-display); font-size: 26px; margin-top: 4px; font-variant-numeric: tabular-nums; }
.kpi.warn { border-left-color: var(--warn); }
.kpi.danger { border-left-color: var(--danger); }
.kpi.ok { border-left-color: var(--ok); }

.quick-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  margin-bottom: 20px;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
}
.panel-head h3 { font-size: 14px; }
.panel-body { padding: 4px 16px; }

/* ---------- Tables ---------- */
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
  padding: 9px 10px;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
}
td { padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--paper); }
.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
}
.badge-ok { background: var(--ok-bg); color: var(--ok); }
.badge-warn { background: var(--warn-bg); color: var(--warn); }
.badge-danger { background: var(--danger-bg); color: var(--danger); }
.row-actions { display: flex; gap: 6px; }

/* ---------- Inventory toolbar ---------- */
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
.toolbar input[type="search"] {
  flex: 1;
  min-width: 200px;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--panel);
  color: var(--ink);
}
.toolbar select { padding: 9px 10px; border: 1px solid var(--line); border-radius: 6px; background: var(--panel); color: var(--ink); }

/* ---------- Modal ---------- */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(10,15,12,0.5);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  z-index: 50;
}
.modal {
  background: var(--panel);
  border-radius: var(--radius);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--line);
}
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--line);
}
.modal-head h3 { font-size: 16px; }
.modal-close { background: none; border: none; font-size: 18px; color: var(--muted); line-height: 1; }
.modal-body { padding: 18px 20px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--line); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-grid .span-2 { grid-column: 1 / -1; }

.empty-state { text-align: center; padding: 40px 20px; color: var(--muted); }

/* ---------- Billing / POS ---------- */
.billing-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16px;
  align-items: start;
  margin-bottom: 20px;
}
.search-result-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  border-bottom: 1px solid var(--line);
}
.search-result-item:last-child { border-bottom: none; }
.search-result-item .sr-name { font-weight: 500; }
.search-result-item .sr-meta { font-size: 12px; color: var(--muted); }
.qty-input {
  width: 56px;
  padding: 5px 6px;
  border: 1px solid var(--line);
  border-radius: 5px;
  background: var(--paper);
  color: var(--ink);
  text-align: center;
}
.cart-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}
.cart-line:last-child { border-bottom: none; }
.cart-line .cl-name { font-weight: 500; font-size: 13px; }
.cart-line .cl-meta { font-size: 11px; color: var(--muted); }
.cart-line .cl-controls { display: flex; align-items: center; gap: 6px; }
.cart-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--line);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
}
.bill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 4px;
  border-bottom: 1px solid var(--line);
  font-size: 13px;
}
.bill-row:last-child { border-bottom: none; }

/* ---------- Printable receipt ---------- */
#printReceipt {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--ink);
}
#printReceipt .r-head { text-align: center; margin-bottom: 10px; }
#printReceipt .r-head h2 { font-size: 16px; margin-bottom: 2px; }
#printReceipt .r-meta { font-size: 11px; color: var(--muted); margin-bottom: 10px; }
#printReceipt table { width: 100%; border-collapse: collapse; }
#printReceipt th, #printReceipt td { padding: 4px 2px; font-size: 12px; text-align: left; }
#printReceipt th { border-bottom: 1px dashed var(--line); }
#printReceipt .r-total-row td { border-top: 1px dashed var(--line); font-weight: 700; padding-top: 8px; }
#printReceipt .r-foot { text-align: center; margin-top: 14px; font-size: 11px; color: var(--muted); }

@media print {
  body * { visibility: hidden; }
  #printReceipt, #printReceipt * { visibility: visible; }
  #printReceipt {
    position: absolute;
    top: 0; left: 0;
    width: 100%;
  }
  .no-print { display: none !important; }
  .modal-overlay { position: static; background: none; padding: 0; }
  .modal { box-shadow: none; border: none; max-width: 100%; max-height: none; }
}

.toast-stack { position: fixed; bottom: 20px; right: 20px; display: flex; flex-direction: column; gap: 8px; z-index: 100; }
.toast {
  background: var(--ink);
  color: var(--paper);
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 13px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  max-width: 320px;
}
.toast.error { background: var(--danger); color: #fff; }
.toast.success { background: var(--ok); color: #fff; }

@media (max-width: 760px) {
  #appShell { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; overflow-x: auto; padding: 10px 0; }
  .sidebar-brand, .sidebar-foot { display: none; }
  .nav-item { border-left: none; border-bottom: 3px solid transparent; white-space: nowrap; }
  .nav-item.active { border-left-color: transparent; border-bottom-color: var(--accent); }
  .form-grid { grid-template-columns: 1fr; }
  .billing-grid { grid-template-columns: 1fr; }
  .view { padding: 14px; }
}
