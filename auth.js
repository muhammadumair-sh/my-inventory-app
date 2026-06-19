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
  const online = await Api.isOnline();
  if (!online) {
    throw new Error('Login needs an internet connection the first time on this device. Once logged in, you can keep working offline.');
  }
  const res = await Api.apiCall('login', { username, passwordHash });
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
