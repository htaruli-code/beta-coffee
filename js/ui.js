// Version 1.2
// ui.js — Shared UI helpers. Loading states, alerts, form utilities, modals.
// v1.1: No logic changes. Version bump for release consistency.

const UI = (() => {

  // ─── Toast Alerts ─────────────────────────────────────────────────────────

  function toast(message, type) {
    // type: 'success' | 'error' | 'info'
    const existing = document.getElementById('st-toast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.id = 'st-toast';
    el.className = 'st-toast st-toast--' + (type || 'info');
    el.textContent = message;
    document.body.appendChild(el);

    // Auto remove
    setTimeout(() => { if (el.parentNode) el.remove(); }, 4000);
  }

  function toastSuccess(msg) { toast(msg, 'success'); }
  function toastError(msg)   { toast(msg, 'error');   }
  function toastInfo(msg)    { toast(msg, 'info');     }

  // ─── Loading State ────────────────────────────────────────────────────────

  function setLoading(buttonEl, isLoading) {
    if (!buttonEl) return;
    if (isLoading) {
      buttonEl.dataset.originalText = buttonEl.textContent;
      buttonEl.textContent = 'Please wait…';
      buttonEl.disabled = true;
    } else {
      buttonEl.textContent = buttonEl.dataset.originalText || 'Submit';
      buttonEl.disabled = false;
    }
  }

  function showSpinner(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '<div class="st-spinner"></div>';
  }

  function hideSpinner(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
  }

  // ─── Modal ────────────────────────────────────────────────────────────────

  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'flex';
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.style.display = 'none';
  }

  // Close modal on backdrop click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('st-modal')) {
      e.target.style.display = 'none';
    }
  });

  // ─── Form Helpers ─────────────────────────────────────────────────────────

  function getFormData(formEl) {
    const data = {};
    new FormData(formEl).forEach((val, key) => { data[key] = val; });
    return data;
  }

  function fillForm(formEl, data) {
    Object.keys(data).forEach(key => {
      const el = formEl.querySelector('[name="' + key + '"]');
      if (el) el.value = data[key] || '';
    });
  }

  function clearForm(formEl) {
    formEl.reset();
  }

  // ─── Select/Dropdown Helpers ──────────────────────────────────────────────

  function populateSelect(selectEl, items, valueKey, labelKey, placeholder) {
    selectEl.innerHTML = '';
    if (placeholder) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = placeholder;
      selectEl.appendChild(opt);
    }
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item[valueKey];
      opt.textContent = item[labelKey];
      selectEl.appendChild(opt);
    });
  }

  // ─── Table Builder ────────────────────────────────────────────────────────

  function buildTable(tbodyEl, rows, renderRow) {
    tbodyEl.innerHTML = '';
    if (!rows || rows.length === 0) {
      tbodyEl.innerHTML = '<tr><td colspan="100" class="st-empty">No records found.</td></tr>';
      return;
    }
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = renderRow(row);
      tbodyEl.appendChild(tr);
    });
  }

  // ─── Date Helpers ─────────────────────────────────────────────────────────

  function formatDate(val) {
    if (!val) return '—';
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString();
  }

  function todayISO() {
    return new Date().toISOString().split('T')[0];
  }

  // ─── Escape HTML ──────────────────────────────────────────────────────────

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  function logout() {
    Auth.clearSession();
    window.location.href = 'login.html';
  }

  return {
    toast, toastSuccess, toastError, toastInfo,
    setLoading, showSpinner, hideSpinner,
    openModal, closeModal,
    getFormData, fillForm, clearForm,
    populateSelect, buildTable,
    formatDate, todayISO, esc,
    logout
  };
})();
