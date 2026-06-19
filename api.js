/**
 * api.js
 * All network calls to the Apps Script backend go through here.
 * Uses text/plain content-type on purpose (see Code.gs comment) to
 * avoid CORS preflight requests, which Apps Script Web Apps don't handle.
 */

function getScriptUrl() {
  return localStorage.getItem('scriptUrlOverride') || window.APP_CONFIG.SCRIPT_URL;
}

function setScriptUrl(url) {
  localStorage.setItem('scriptUrlOverride', url);
}

async function apiCall(action, payload = {}, { timeoutMs = 15000 } = {}) {
  const url = getScriptUrl();
  if (!url || url.indexOf('PASTE_YOUR') === 0) {
    throw new Error('Backend URL not configured yet. Open Settings to paste your Apps Script Web App URL.');
  }
  const token = await Store.get('meta', 'sessionToken');
  const body = Object.assign({ action, token: token ? token.value : null }, payload);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!res.ok) throw new Error('Server returned status ' + res.status);
    const data = await res.json();
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function isOnline() {
  if (!navigator.onLine) return false;
  try {
    const res = await apiCall('ping', {}, { timeoutMs: 6000 });
    return !!(res && res.success);
  } catch (e) {
    return false;
  }
}

window.Api = { apiCall, isOnline, getScriptUrl, setScriptUrl };
