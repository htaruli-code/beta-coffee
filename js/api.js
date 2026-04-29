// Version 1.11.3
// api.js — Data layer. All API calls live here.
// To change data source, replace the fetch logic in post() only.
// v1.1: saveBuyer, getBuyersPage, getOutboundPage, saveOutbound, saveOutboundDetail, updateOutboundStatus added
// v1.3: saveSamplePrice, savePriceTier added
// v1.4: getBuyerReservePage, submitReservation added (public — no session)
// v1.5: saveConfirmedPurchase added
// v1.7: toggleDetailActive added
// v1.8: saveBuyerMinimum, updateDetailCoffeeType added
// v1.9: getAllSamplesPage added
// v1.9.1: post() intercepts UNAUTHORIZED
// v1.11.3: updateOutboundStatus accepts extraParams (shipping_date, courier, tracking_number for Sent) → Auth.handleUnauthorized() → redirect to login

const API = (() => {

  // ─── Core POST ─────────────────────────────────────────────────────────────
  // Single function for all calls. GAS uses one endpoint, action-based routing.

  async function post(payload) {
    // v1.8.1: Send as form-urlencoded — avoids CORS preflight (OPTIONS).
    // Browsers send OPTIONS before POST with Content-Type: application/json.
    // GAS cannot handle OPTIONS so request is blocked. form-urlencoded is a
    // "simple request" — browser sends it directly with no preflight.
    // Code.gs reads it via: JSON.parse(e.parameter.payload)
    // v1.9.1: Intercept UNAUTHORIZED → Auth.handleUnauthorized() → redirect to login
    const body = new URLSearchParams({ payload: JSON.stringify(payload) });
    const res  = await fetch(APP_CONFIG.GAS_URL, {
      method:   'POST',
      redirect: 'follow',
      body:     body,
    });
    if (!res.ok) throw new Error('Network error: ' + res.status);
    const data = await res.json();
    if (!data.success) {
      if (data.code === 'UNAUTHORIZED') {
        Auth.handleUnauthorized('login.html');
        return;
      }
      throw new Error(data.error || 'Unknown error');
    }
    return data.data;
  }

  // ─── Auth ──────────────────────────────────────────────────────────────────

  async function sendAuthCode(email) {
    return post({ action: 'sendAuthCode', email });
  }

  async function verifyAuthCode(email, code) {
    return post({ action: 'verifyAuthCode', email, code });
  }

  // ─── Page Data (one call per page) ────────────────────────────────────────

  async function getSamplesPage(warehouseId) {
    return post({
      action: 'getPageData',
      page: 'samples',
      warehouse_id: warehouseId || null,
      session_token: Auth.getToken()
    });
  }

  async function getSuppliersPage() {
    return post({
      action: 'getPageData',
      page: 'suppliers',
      session_token: Auth.getToken()
    });
  }

  async function getInboundDetailPage(inboundId) {
    return post({
      action: 'getPageData',
      page: 'inbound_detail',
      inbound_id: inboundId,
      session_token: Auth.getToken()
    });
  }

  // ─── Supplier ──────────────────────────────────────────────────────────────

  async function saveSupplier(supplierData) {
    return post({
      action: 'saveSupplier',
      supplier: supplierData,
      session_token: Auth.getToken()
    });
  }

  // ─── Inbound Sample ────────────────────────────────────────────────────────

  async function saveInbound(inboundData) {
    return post({
      action: 'saveInbound',
      inbound: inboundData,
      session_token: Auth.getToken()
    });
  }

  async function saveDetail(inboundId, warehouseId, countryId, detail) {
    return post({
      action: 'saveDetail',
      inbound_id: inboundId,
      warehouse_id: warehouseId,
      country_id: countryId,
      detail,
      session_token: Auth.getToken()
    });
  }

  async function sendSupplierLink(inboundId) {
    return post({
      action: 'sendSupplierLink',
      inbound_id: inboundId,
      session_token: Auth.getToken()
    });
  }

  async function updateTracking(inboundId, tracked, received) {
    return post({
      action: 'updateTracking',
      inbound_id: inboundId,
      tracked,
      received,
      session_token: Auth.getToken()
    });
  }

  // ─── Public (supplier submit page) ────────────────────────────────────────

  async function getSupplierPage(token) {
    return post({ action: 'getSupplierPage', token });
  }

  async function supplierSubmit(token, sending_date, courier_name, tracking_number, details) {
    return post({ action: 'supplierSubmit', token, sending_date, courier_name, tracking_number, details });
  }

  // ─── Buyers ───────────────────────────────────────────────────────────────

  async function getBuyersPage() {
    return post({ action: 'getPageData', page: 'buyers', session_token: Auth.getToken() });
  }

  async function saveBuyer(buyerData) {
    return post({ action: 'saveBuyer', buyer: buyerData, session_token: Auth.getToken() });
  }

  // ─── Outbound ─────────────────────────────────────────────────────────────

  async function getOutboundPage(warehouseId) {
    return post({ action: 'getPageData', page: 'outbound', warehouse_id: warehouseId || null, session_token: Auth.getToken() });
  }

  async function saveOutbound(outboundData, details) {
    return post({ action: 'saveOutbound', outbound: outboundData, details: details || [], session_token: Auth.getToken() });
  }

  async function saveOutboundDetail(outboundId, detail) {
    return post({ action: 'saveOutboundDetail', outbound_id: outboundId, detail, session_token: Auth.getToken() });
  }

  async function updateOutboundStatus(outboundId, status, extraParams) {
    // v1.11.3: extraParams carries shipping_date, courier, tracking_number when status = Sent
    return post(Object.assign({
      action:      'updateOutboundStatus',
      outbound_id: outboundId,
      status,
      session_token: Auth.getToken()
    }, extraParams || {}));
  }

  // ─── Pricing (v1.3) ──────────────────────────────────────────────────────

  async function saveSamplePrice(detailId, level, salePrice) {
    return post({
      action: 'saveSamplePrice',
      detail_id: detailId,
      level,
      sale_price: salePrice,
      session_token: Auth.getToken()
    });
  }

  async function savePriceTier(level, multiplier) {
    return post({
      action: 'savePriceTier',
      level,
      multiplier,
      session_token: Auth.getToken()
    });
  }

  // ─── Buyer Minimums + Coffee Type (v1.8) ────────────────────────────────

  async function saveBuyerMinimum(buyerId, coffeeType, minBags) {
    return post({
      action: 'saveBuyerMinimum',
      buyer_id: buyerId,
      coffee_type: coffeeType,
      min_bags: minBags,
      session_token: Auth.getToken()
    });
  }

  async function updateDetailCoffeeType(detailId, coffeeType) {
    return post({
      action: 'updateDetailCoffeeType',
      detail_id: detailId,
      coffee_type: coffeeType,
      session_token: Auth.getToken()
    });
  }

  // ─── All Samples Page (v1.9) ─────────────────────────────────────────────

  async function getAllSamplesPage(warehouseId) {
    return post({
      action:       'getAllSamplesPage',
      warehouse_id: warehouseId || null,
      session_token: Auth.getToken()
    });
  }

  // ─── Detail Active Toggle (v1.7) ────────────────────────────────────────

  async function toggleDetailActive(detailId, isActive) {
    return post({
      action: 'toggleDetailActive',
      detail_id: detailId,
      is_active: isActive,
      session_token: Auth.getToken()
    });
  }

  // ─── Buyer Reservation (v1.4) — public, no session needed ──────────────

  async function getBuyerReservePage(token) {
    return post({ action: 'getBuyerReservePage', token });
  }

  async function submitReservation(token, bags_requested) {
    return post({ action: 'submitReservation', token, bags_requested });
  }

  // ─── Confirmed Purchase (v1.5) ────────────────────────────────────────────

  async function saveConfirmedPurchase(detailId, confirmedPurchase) {
    return post({
      action: 'saveConfirmedPurchase',
      detail_id: detailId,
      confirmed_purchase: confirmedPurchase,
      session_token: Auth.getToken()
    });
  }

  return {
    sendAuthCode, verifyAuthCode,
    getSamplesPage, getSuppliersPage, getInboundDetailPage,
    saveSupplier, saveInbound, saveDetail, sendSupplierLink, updateTracking,
    getSupplierPage, supplierSubmit,
    getBuyersPage, saveBuyer,
    getOutboundPage, saveOutbound, saveOutboundDetail, updateOutboundStatus,
    saveSamplePrice, savePriceTier,              // v1.3
    getBuyerReservePage, submitReservation,       // v1.4
    saveConfirmedPurchase,                        // v1.5
    toggleDetailActive,                           // v1.7
    saveBuyerMinimum, updateDetailCoffeeType,     // v1.8
    getAllSamplesPage                              // v1.9
  };
})();
