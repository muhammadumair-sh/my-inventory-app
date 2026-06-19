/**
 * auth.js
 * Handles login, logout, and exposes the current logged-in user.
 * The session token + user info are cached in IndexedDB ('meta' store)
 * so a reload — or opening the app fully offline — keeps you logged in
 * until the cached token's expiry passes.
 */

const AuthState = {
  user: null,   // { id, username, role }
  token: null,
  expiresAt: null
};

async function loadCachedSession() {
  const tokenRec = await Store.get('meta', 'sessionToken');
  const userRec = await Store.get('meta', 'sessionUser');
  const expRec = await Store.get('meta', 'sessionExpires');
  if (tokenRec && userRec && expRec) {
    if (new Date(expRec.value).getTime() > Date.now()) {
      AuthState.token = tokenRec.value;
      AuthState.user = userRec.value;
      AuthState.expiresAt = expRec.value;
      return true;
    }
  }
  return false;
}

async function login(username, password) {
  const passwordHash = await sha256Hex(password);

  let res;
  try {
    // Generous timeout: Google Apps Script can be slow to respond on a
    // "cold start" (first request after the script has been idle for a
    // while), especially on mobile data. We'd rather wait than wrongly
    // tell someone they're offline.
    res = await Api.apiCall('login', { username, passwordHash }, { timeoutMs: 25000 });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error('The server is taking too long to respond. Please check your connection and try again — Google Apps Script can be slow on its first request.');
    }
    throw new Error('Could not reach the server. Check your internet connection, or confirm the backend URL in Settings is correct.');
  }
  if (!res.success) throw new Error(res.error || 'Login failed.');

  AuthState.token = res.token;
  AuthState.user = res.user;
  AuthState.expiresAt = res.expiresAt;

  await Store.put('meta', { key: 'sessionToken', value: res.token });
  await Store.put('meta', { key: 'sessionUser', value: res.user });
  await Store.put('meta', { key: 'sessionExpires', value: res.expiresAt });
  return res.user;
}

async function logout() {
  AuthState.token = null;
  AuthState.user = null;
  AuthState.expiresAt = null;
  await Store.delete('meta', 'sessionToken');
  await Store.delete('meta', 'sessionUser');
  await Store.delete('meta', 'sessionExpires');
}

function currentUser() {
  return AuthState.user;
}

function isAdmin() {
  return !!AuthState.user && AuthState.user.role === 'admin';
}

window.Auth = { loadCachedSession, login, logout, currentUser, isAdmin, state: AuthState };
