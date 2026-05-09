// Version 1.27
// api.js — All fetch calls to GAS. One place to change the transport layer.
// v1.15: getOutboundPage  — page_num + status_filter params.
// v1.16: getBuyersPage    — page_num + search params.
// v1.17: getBuyersPage    — warehouse_id + level filter params.
// v1.18: getSuppliersPage — page_num + search + country_id params.
// v1.19: getOutboundPage  — search param added (buyer name or outbound ID).
// v1.20: BUG FIX — post() now guards Auth reference before calling handleUnauthorized.
//        supplier-submit.html and buyer-reserve.html don't load auth.js (public pages —
//        token-based, no session). Previously any UNAUTHORIZED response from GAS would
//        call Auth.handleUnauthorized() unconditionally → "Auth is not defined" crash.
// v1.27: getCataloguesPage, saveCatalogue, archiveCatalogue, sendCatalogueFromLibrary,
//        revokeCatalogueSend, updateCatalogueSendNotes — catalogue library feature.
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
// v1.11.3: updateOutboundStatus accepts extraParams
// v1.11.4: saveBuyerMinimumPublic — public version for buyer-reserve.html
// v1.11.5: saveEvaluation + sendEvaluation
// v1.11.6: saveDetailField — inline editing
// v1.11.7: submitReservationInternal — session-authenticated reservation for outbound.html (uses reservation token, no session) (shipping_date, courier, tracking_number for Sent) → Auth.handleUnauthorized() → redirect to login
// v1.13.2: saveSamplePrice accepts sale_unit; saveSamplePricesAll — batch upsert all 4 tier prices in one call
// v1.14: sendCatalogueLink, getCataloguePage (public), submitCatalogueSelection (public)

const API = (() => {

  // ─── Core POST ─────────────────────────────────────────────────────────────
  // Single function for all calls. GAS uses one endpoint, action-based routing.

  async function post(payload) {
    // Auto-attach session_token if Auth is available and user is logged in.
    // V2 pages call API.post() directly without adding session_token manually.
    // V1 named wrappers add it explicitly — having it twice is harmless (same value).
    const enriched = Object.assign({}, payload);
    if (typeof Auth !== 'undefined' && Auth.getToken && Auth.getToken()) {
      enriched.session_token = Auth.getToken();
    }
    const body = new URLSearchParams({ payload: JSON.stringify(enriched) });
    const res  = await fetch(APP_CONFIG.GAS_URL, {
      method: 'POST',
      body:   body
    });
    if (!res.ok) throw new Error('Network error: ' + res.status);
    const data = await res.json();
    if (!data.success) {
      if (data.code === 'UNAUTHORIZED') {
        if (typeof Auth !== 'undefined' && Auth.handleUnauthorized) {
          Auth.handleUnauthorized();
        }
      }
      const err = new Error(data.error || 'Unknown error');
      err.code  = data.code || 'UNKNOWN';
      throw err;
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

  // ─── Samples ───────────────────────────────────────────────────────────────

  async function getSamplesPage(warehouseId) {
    return post({ action: 'getPageData', page: 'samples', warehouse_id: warehouseId || '', session_token: Auth.getToken() });
  }

  async function getSuppliersPage(pageNum, search, countryId) {
    return post({ action: 'getPageData', page: 'suppliers', page_num: pageNum || 1, search: search || '', country_id: countryId || '', session_token: Auth.getToken() });
  }

  async function getInboundDetailPage(inboundId) {
    return post({ action: 'getPageData', page: 'inbound_detail', inbound_id: inboundId, session_token: Auth.getToken() });
  }

  async function saveSupplier(supplierData) {
    return post(Object.assign({ action: 'saveSupplier', session_token: Auth.getToken() }, supplierData));
  }

  async function saveInbound(inboundData) {
    return post(Object.assign({ action: 'saveInbound', session_token: Auth.getToken() }, inboundData));
  }

  async function saveDetail(inboundId, warehouseId, countryId, detail) {
    return post(Object.assign({ action: 'saveDetail', inbound_id: inboundId, warehouse_id: warehouseId, country_id: countryId, session_token: Auth.getToken() }, detail));
  }

  async function sendSupplierLink(inboundId) {
    return post({ action: 'sendSupplierLink', inbound_id: inboundId, session_token: Auth.getToken() });
  }

  async function updateTracking(inboundId, tracked, received) {
    return post({ action: 'updateTracking', inbound_id: inboundId, tracked, received, session_token: Auth.getToken() });
  }

  async function getSupplierPage(token) {
    return post({ action: 'getSupplierPage', token });
  }

  async function supplierSubmit(token, sending_date, courier_name, tracking_number, details) {
    return post({ action: 'supplierSubmit', token, sending_date, courier_name, tracking_number, details });
  }

  // ─── Buyers ────────────────────────────────────────────────────────────────

  async function getBuyersPage(pageNum, search, warehouseId, level) {
    return post({ action: 'getPageData', page: 'buyers', page_num: pageNum || 1, search: search || '', warehouse_id: warehouseId || '', level: level || '', session_token: Auth.getToken() });
  }

  async function saveBuyer(buyerData) {
    return post(Object.assign({ action: 'saveBuyer', session_token: Auth.getToken() }, buyerData));
  }

  // ─── Outbound ──────────────────────────────────────────────────────────────

  async function getOutboundPage(warehouseId, pageNum, statusFilter, search) {
    return post({ action: 'getPageData', page: 'outbound', warehouse_id: warehouseId || '', page_num: pageNum || 1, status_filter: statusFilter || '', search: search || '', session_token: Auth.getToken() });
  }

  async function saveOutbound(outboundData, details) {
    return post(Object.assign({ action: 'saveOutbound', details: details || [], session_token: Auth.getToken() }, outboundData));
  }

  async function saveOutboundDetail(outboundId, detail) {
    return post(Object.assign({ action: 'saveOutboundDetail', outbound_id: outboundId, session_token: Auth.getToken() }, detail));
  }

  async function updateOutboundStatus(outboundId, status, extraParams) {
    return post(Object.assign({ action: 'updateOutboundStatus', outbound_id: outboundId, status, session_token: Auth.getToken() }, extraParams || {}));
  }

  // ─── Pricing ───────────────────────────────────────────────────────────────

  async function saveSamplePrice(detailId, level, salePrice, saleUnit) {
    return post({ action: 'saveSamplePrice', detail_id: detailId, level, sale_price: salePrice, sale_unit: saleUnit, session_token: Auth.getToken() });
  }

  async function saveSamplePricesAll(detailId, prices) {
    return post({ action: 'saveSamplePricesAll', detail_id: detailId, prices, session_token: Auth.getToken() });
  }

  async function savePriceTier(level, multiplier) {
    return post({ action: 'savePriceTier', level, multiplier, session_token: Auth.getToken() });
  }

  // ─── Reservations ──────────────────────────────────────────────────────────

  async function getBuyerReservePage(token) {
    return post({ action: 'getBuyerReservePage', token });
  }

  async function submitReservation(token, bags_requested) {
    return post({ action: 'submitReservation', token, bags_requested });
  }

  // ─── Misc V1 ───────────────────────────────────────────────────────────────

  async function saveConfirmedPurchase(detailId, confirmedPurchase) {
    return post({ action: 'saveConfirmedPurchase', detail_id: detailId, confirmed_purchase: confirmedPurchase, session_token: Auth.getToken() });
  }

  async function toggleDetailActive(detailId, isActive) {
    return post({ action: 'toggleDetailActive', detail_id: detailId, is_active: isActive, session_token: Auth.getToken() });
  }

  async function saveBuyerMinimum(buyerId, coffeeType, minBags) {
    return post({ action: 'saveBuyerMinimum', buyer_id: buyerId, coffee_type: coffeeType, min_bags: minBags, session_token: Auth.getToken() });
  }

  async function saveBuyerMinimumPublic(buyerId, reservationToken, coffeeType, minBags) {
    return post({ action: 'saveBuyerMinimumPublic', buyer_id: buyerId, reservation_token: reservationToken, coffee_type: coffeeType, min_bags: minBags });
  }

  async function saveEvaluation(detailId, evalStatus, evalNotes) {
    return post({ action: 'saveEvaluation', detail_id: detailId, eval_status: evalStatus, eval_notes: evalNotes, session_token: Auth.getToken() });
  }

  async function sendEvaluation(inboundId) {
    return post({ action: 'sendEvaluation', inbound_id: inboundId, session_token: Auth.getToken() });
  }

  async function saveDetailField(detailId, field, value) {
    return post({ action: 'saveDetailField', detail_id: detailId, field, value, session_token: Auth.getToken() });
  }

  async function submitReservationInternal(outboundDetailId, bagsRequested) {
    return post({ action: 'submitReservationInternal', outbound_detail_id: outboundDetailId, bags_requested: bagsRequested, session_token: Auth.getToken() });
  }

  async function updateDetailCoffeeType(detailId, coffeeType) {
    return post({ action: 'updateDetailCoffeeType', detail_id: detailId, coffee_type: coffeeType, session_token: Auth.getToken() });
  }

  async function getAllSamplesPage(warehouseId) {
    return post({ action: 'getAllSamplesPage', warehouse_id: warehouseId || '', session_token: Auth.getToken() });
  }

  // ─── Catalogue (V1 — legacy ad-hoc send from outbound.html) ───────────────

  async function sendCatalogueLink(buyerId, warehouseId, detailIds) {
    return post({
      action:       'sendCatalogueLink',
      buyer_id:     buyerId,
      warehouse_id: warehouseId,
      detail_ids:   detailIds,
      session_token: Auth.getToken()
    });
  }

  async function getCataloguePage(token) {
    return post({ action: 'getCataloguePage', token });
  }

  async function submitCatalogueSelection(token, selectedDetailIds, beans, notes) {
    return post({
      action:              'submitCatalogueSelection',
      token,
      selected_detail_ids: selectedDetailIds,
      beans,
      notes: notes || ''
    });
  }

  // ─── Catalogue Library (v1.27) ─────────────────────────────────────────────
  // New: named catalogues that can be sent/resent to different buyers.

  // Load full catalogue library page bundle (catalogues + sends + buyers + warehouses + details)
  async function getCataloguesPage() {
    return post({ action: 'getCataloguesPage', session_token: Auth.getToken() });
  }

  // Create or update a named catalogue (lot list)
  // data = { catalogue_id (omit for new), catalogue_name, warehouse_id, detail_ids (array), notes }
  async function saveCatalogue(data) {
    return post(Object.assign({ action: 'saveCatalogue', session_token: Auth.getToken() }, data));
  }

  // Soft-delete a catalogue (sets status = Archived)
  async function archiveCatalogue(catalogueId) {
    return post({ action: 'archiveCatalogue', catalogue_id: catalogueId, session_token: Auth.getToken() });
  }

  // Send an existing catalogue to a buyer — generates fresh token + records the send
  async function sendCatalogueFromLibrary(catalogueId, buyerId) {
    return post({
      action:        'sendCatalogueFromLibrary',
      catalogue_id:  catalogueId,
      buyer_id:      buyerId,
      session_token: Auth.getToken()
    });
  }

  // Revoke a send record — buyer's link rejected on next access
  async function revokeCatalogueSend(sendId) {
    return post({ action: 'revokeCatalogueSend', send_id: sendId, session_token: Auth.getToken() });
  }

  // Save staff follow-up notes on a send record
  async function updateCatalogueSendNotes(sendId, notes) {
    return post({ action: 'updateCatalogueSendNotes', send_id: sendId, notes: notes || '', session_token: Auth.getToken() });
  }

  return {
    post,                                             // exposed for v2 procurement pages
    sendAuthCode, verifyAuthCode,
    getSamplesPage, getSuppliersPage, getInboundDetailPage,
    saveSupplier, saveInbound, saveDetail, sendSupplierLink, updateTracking,
    getSupplierPage, supplierSubmit,
    getBuyersPage, saveBuyer,
    getOutboundPage, saveOutbound, saveOutboundDetail, updateOutboundStatus,
    saveSamplePrice, saveSamplePricesAll, savePriceTier,
    getBuyerReservePage, submitReservation,
    saveConfirmedPurchase,
    toggleDetailActive,
    saveBuyerMinimum, saveBuyerMinimumPublic,
    saveEvaluation, sendEvaluation,
    saveDetailField,
    submitReservationInternal,
    updateDetailCoffeeType,
    getAllSamplesPage,
    sendCatalogueLink, getCataloguePage, submitCatalogueSelection,
    // v1.27 — catalogue library
    getCataloguesPage, saveCatalogue, archiveCatalogue,
    sendCatalogueFromLibrary, revokeCatalogueSend, updateCatalogueSendNotes
  };
})();
