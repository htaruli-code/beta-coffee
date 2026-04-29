// Version 1.2.1
// auth.js — Session management helpers. All session reads/writes go through here.
// v1.1: No logic changes.
// v1.2.1: Added Auth.redirectIfExpired() — periodic session check every 60s
//          Added Auth.handleUnauthorized() — called by api.js on UNAUTHORIZED response

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
    // v1.2.1: Start periodic session check — redirects if session expires while on page
    startExpiryWatch(redirectTo || 'login.html');
    return true;
  }

  // v1.2.1: Called by api.js when GAS returns UNAUTHORIZED (session expired server-side)
  function handleUnauthorized(redirectTo) {
    clearSession();
    window.location.href = (redirectTo || 'login.html') + '?reason=expired';
  }

  // v1.2.1: Poll every 60s — redirect if session has expired client-side
  function startExpiryWatch(redirectTo) {
    setInterval(function() {
      if (!isLoggedIn()) {
        clearSession();
        window.location.href = (redirectTo || 'login.html') + '?reason=expired';
      }
    }, 60 * 1000);
  }

  return {
    getSession, setSession, clearSession,
    getToken, getUser, getCompany, getWarehouses,
    isLoggedIn, requireAuth, handleUnauthorized
  };
})();
