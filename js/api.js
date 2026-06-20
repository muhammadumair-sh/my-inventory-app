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
    // Debug logging to help diagnose login/connectivity issues
    console.debug('Api.apiCall ->', action, url, body);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    // Read raw text first so we can include it in errors when parsing fails
    const rawText = await res.text();

    if (!res.ok) {
      // include body for easier debugging
      throw new Error('Server returned status ' + res.status + ': ' + rawText);
    }

    // Try to parse JSON; if parsing fails, include raw body in the error
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      throw new Error('Invalid JSON response from server: ' + rawText);
    }

    console.debug('Api.apiCall response ->', action, data);
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
    console.debug('Api.isOnline: ping failed', e);
    return false;
  }
}

window.Api = { apiCall, isOnline, getScriptUrl, setScriptUrl };