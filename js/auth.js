// Version 1.2.3
// auth.js — Session management helpers. All session reads/writes go through here.
// v1.1: No logic changes.
// v1.2.2: sessionStorage → localStorage — session now persists across tabs and new windows
//          GAS server-side 6h expiry still enforced — token rejected after expiry regardless Version bump for release consistency.
// v1.2.3: handleUnauthorized added — was referenced by api.js v1.9.1 but never defined.
//          Bug surfaced when login expired and api.js tried to redirect.

const Auth = (() => {

  function getSession() {
    try {
      const raw = localStorage.getItem(APP_CONFIG.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(data) {
    // data: { session_token, expires_at, user, company, warehouses }
    localStorage.setItem(APP_CONFIG.SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    localStorage.removeItem(APP_CONFIG.SESSION_KEY);
  }

  function getToken() {
    const s = getSession();
    return s ? s.session_token : null;
  }

  function getUser() {
    const s = getSession();
    return s ? s.user : null;
  }

  function getCompany() {
    const s = getSession();
    return s ? s.company : null;
  }

  function getWarehouses() {
    const s = getSession();
    return s ? (s.warehouses || []) : [];
  }

  function isLoggedIn() {
    const s = getSession();
    if (!s || !s.session_token || !s.expires_at) return false;
    return new Date() < new Date(s.expires_at);
  }

  // Call at top of every authenticated page
  function requireAuth(redirectTo) {
    if (!isLoggedIn()) {
      clearSession();
      window.location.href = redirectTo || 'login.html';
      return false;
    }
    return true;
  }

  // v1.2.3: Handle UNAUTHORIZED responses from the API.
  // Called from api.js when the server returns code: 'UNAUTHORIZED'
  // (session expired, invalidated, or token was never set).
  // Clears the local session and redirects to login.
  function handleUnauthorized(redirectTo) {
    clearSession();
    // Avoid redirect loops if we're already on the login page
    if (window.location.pathname.indexOf('login.html') === -1) {
      window.location.href = redirectTo || 'login.html';
    }
  }

  // v1.2.3: Logout — clears session locally. v2 internal pages call this from
  // the navbar user-menu click. Currently a thin wrapper around clearSession()
  // — kept as its own export so we can later add a server-side session-revoke
  // call without touching every page.
  function logout() {
    clearSession();
  }

  return { getSession, setSession, clearSession, getToken, getUser, getCompany, getWarehouses, isLoggedIn, requireAuth, handleUnauthorized, logout };
})();
