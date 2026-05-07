// Version 2.2
// buyer-auth.js — Session management for buyer-facing pages.
// v2.2: Replaces v2.0 HMAC-token approach with email + OTP login + session token.
//
// Session token stored in sessionStorage (not localStorage) — clears on browser close.
// Use sessionStorage so a buyer who walks away from a shared computer doesn't
// leave a logged-in session lying around once the browser is closed.

const BuyerAuth = (() => {
  const STORAGE_KEY = 'buyer_session_v2';

  // ── Session storage ──────────────────────────────────────────────────────
  function setSession(sessionToken, buyer) {
    const data = { session_token: sessionToken, buyer: buyer, at: Date.now() };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function getToken() {
    const s = getSession();
    return s ? s.session_token : '';
  }

  function getBuyer() {
    const s = getSession();
    return s ? s.buyer : null;
  }

  function clearSession() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  // Returns true if buyer is logged in (has a session token in sessionStorage).
  // The actual session validity is checked server-side on every API call —
  // this is just the "do I have any token at all" check.
  function isLoggedIn() {
    return Boolean(getToken());
  }

  return { setSession, getSession, getToken, getBuyer, clearSession, isLoggedIn };
})();
