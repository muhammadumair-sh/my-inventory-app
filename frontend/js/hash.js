/**
 * hash.js
 * Hashes passwords in the browser using the Web Crypto API before they're
 * ever sent over the network, so the server (and the network) never sees
 * a plaintext password. See Auth.gs for the matching server-side note.
 */
async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
window.sha256Hex = sha256Hex;
