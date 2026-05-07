// Version 2.0
// buyer-ui.js — Shared UI helpers for buyer-facing pages.
// Independent of ui.js (internal app).

const BuyerUI = (() => {

  function showToast(msg, type) {
    let t = document.getElementById('buyer-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'buyer-toast';
      t.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:999;font-family:monospace;font-size:0.78rem;padding:0.75rem 1.25rem;border-radius:4px;color:#fff;opacity:0;transition:opacity 0.2s;pointer-events:none;';
      document.body.appendChild(t);
    }
    t.textContent  = msg;
    t.style.background = type === 'error' ? '#c0392b' : type === 'success' ? '#2e7d52' : '#1a1a1a';
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 3200);
  }

  function setLoading(elementId, isLoading) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.disabled = isLoading;
    el.style.opacity = isLoading ? '0.5' : '1';
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function fmt(n) {
    return parseFloat(n || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  return { showToast, setLoading, esc, fmt, openModal, closeModal };
})();
