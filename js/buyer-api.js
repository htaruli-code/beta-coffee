// Version 2.2
// buyer-api.js — All API calls for buyer-facing pages.
// Calls BUYER_API_URL (defined in buyer-config.js).
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
    return response.json();
  }

  // ── Public actions (no session) ──────────────────────────────────────────

  async function sendAuthCode(email) {
    return post({ action: 'sendBuyerAuthCode', email: email });
  }

  async function verifyAuthCode(email, code) {
    return post({ action: 'verifyBuyerAuthCode', email: email, code: code });
  }

  // ── Authenticated actions ────────────────────────────────────────────────

  async function getDashboard() {
    return post({ action: 'getBuyerDashboard' });
  }

  async function submitDrawdown(contractId, contractLineId, requestedBags, shippingDate, notes) {
    return post({
      action:           'submitBuyerDrawdown',
      contract_id:      contractId,
      contract_line_id: contractLineId,
      requested_bags:   requestedBags,
      shipping_date:    shippingDate || '',
      notes:            notes        || ''
    });
  }

  async function logout() {
    return post({ action: 'logoutBuyer' });
  }

  return { post, sendAuthCode, verifyAuthCode, getDashboard, submitDrawdown, logout };
})();
