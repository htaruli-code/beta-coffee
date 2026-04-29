// Version 1.2
// auth.js — Session management helpers. All session reads/writes go through here.
// v1.1: No logic changes. Version bump for release consistency.

const Auth = (() => {

  function getSession() {
    try {
      const raw = sessionStorage.getItem(APP_CONFIG.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(data) {
    // data: { session_token, expires_at, user, company, warehouses }
    sessionStorage.setItem(APP_CONFIG.SESSION_KEY, JSON.stringify(data));
  }

  function clearSession() {
    sessionStorage.removeItem(APP_CONFIG.SESSION_KEY);
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

  return { getSession, setSession, clearSession, getToken, getUser, getCompany, getWarehouses, isLoggedIn, requireAuth };
})();
