// Version 2.6
// buyer-api.js — All API calls for buyer-facing pages.
// Calls BUYER_API_URL (defined in buyer-config.js).
// v2.6: submitDrawdown now sends lines[] (server requires the array shape). Pairs with
//         buyer-dashboard v1.15 multi-product request modal.
// v2.5: getMyCompanies() + switchCompany() — logged-in company switch, no re-OTP.
// v2.4: selectCompany() — multi-company login picker (calls selectBuyerCompany).
// v2.3: post() now unwraps { success, data } envelope — mirrors main api.js.
//         Throws on success:false with the server error message and code.
// v2.2: Replaced URL-token model with session_token from OTP login.
//       Token attached automatically from BuyerAuth.getToken() on every call.

const BuyerAPI = (() => {
  // Core POST — form-urlencoded to avoid CORS preflight (same pattern as api.js)
  async function post(payload) {
    if (typeof BUYER_API_URL === 'undefined') {
      throw new Error('buyer-config.js not loaded — BUYER_API_URL missing');
    }

    // Attach session token if available (public actions like login don't need it)
    if (typeof BuyerAuth !== 'undefined') {
      const token = BuyerAuth.getToken();
      if (token) payload.session_token = token;
    }

    const body = 'payload=' + encodeURIComponent(JSON.stringify(payload));

    const response = await fetch(BUYER_API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    body
    });

    if (!response.ok) throw new Error('HTTP ' + response.status);

    const json = await response.json();
    if (!json.success) {
      const err  = new Error(json.error || 'Request failed');
      err.code   = json.code  || '';
      throw err;
    }
    return json.data;
  }

  // ── Public actions (no session) ──────────────────────────────────────────

  async function sendAuthCode(email) {
    return post({ action: 'sendBuyerAuthCode', email: email });
  }

  async function verifyAuthCode(email, code) {
    return post({ action: 'verifyBuyerAuthCode', email: email, code: code });
  }

  // v2.4: multi-company — exchange choice_token + chosen buyer_id for a session.
  // No session token exists yet, so this stays a public action.
  async function selectCompany(choiceToken, buyerId) {
    return post({ action: 'selectBuyerCompany', choice_token: choiceToken, buyer_id: buyerId });
  }

  // ── Authenticated actions ────────────────────────────────────────────────

  async function getDashboard() {
    return post({ action: 'getBuyerDashboard' });
  }

  // v2.6: submitDrawdown sends a lines[] array (server requires it). Each line is
  //   { contract_line_id, requested_bags }. Single-product requests pass a one-item array.
  async function submitDrawdown(contractId, lines, shippingDate, notes) {
    return post({
      action:        'submitBuyerDrawdown',
      contract_id:   contractId,
      lines:         lines,
      shipping_date: shippingDate || '',
      notes:         notes        || ''
    });
  }

  // v2.5: logged-in buyer switching between their own companies (session attached automatically)
  async function getMyCompanies() {
    return post({ action: 'getMyCompanies' });
  }

  async function switchCompany(buyerId) {
    return post({ action: 'switchBuyerCompany', buyer_id: buyerId });
  }

  async function logout() {
    return post({ action: 'logoutBuyer' });
  }

  return { post, sendAuthCode, verifyAuthCode, selectCompany, getMyCompanies, switchCompany, getDashboard, submitDrawdown, logout };
})();
