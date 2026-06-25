// Version 1.0 | nav.js
// v1.0: Shared responsive staff navigation — single source of truth for all staff pages.
//        Desktop (>1024px): horizontal bar with grouped dropdown menus.
//        Phone/tablet (<=1024px): hamburger ☰ → full-height slide-in panel with grouped sections.
//        Auto-detects the active page from location.pathname (highlights link + parent group).
//        Injects its own CSS (scoped to .stnav-*). Mounts into <div id="app-nav"></div>.
//        Depends on Auth (auth.js) for brand/user/logout. No network fetch — builds DOM directly.
(function () {
  'use strict';

  // ── Menu structure (single source of truth) ────────────────────────────────
  // Single-item groups render as a flat top-level link (no dropdown).
  var MENU = [
    { label: 'Inventory', items: [
      { href: 'inventory.html',            label: 'Inventory' },
      { href: 'inventory-locations.html',  label: 'Locations' },
      { href: 'inventory-transfer.html',   label: 'Transfer' },
      { href: 'product-skus.html',         label: 'SKU' },
      { href: 'activity-log.html',         label: 'Activity Log' }
    ]},
    { label: 'Procurement', items: [
      { href: 'purchase-orders.html',      label: 'Purchase Orders' },
      { href: 'suppliers.html',            label: 'Suppliers' },
      { href: 'shipments.html',            label: 'Shipments' },
      { href: 'shipment-status.html',      label: 'Shipment Status' },
      { href: 'shipping-parties.html',     label: 'Shipping Parties' }
    ]},
    { label: 'Sales', items: [
      { href: 'contracts.html',            label: 'Contracts' },
      { href: 'drawdowns.html',            label: 'Drawdowns' }
    ]},
    { label: 'Samples', items: [
      { href: 'all-samples.html',          label: 'All Samples' }
    ]}
  ];

  // ── Current page (file name only) ───────────────────────────────────────────
  function currentFile() {
    var p = (window.location.pathname || '').split('/').pop();
    return p || 'inventory.html';
  }
  var CUR = currentFile();

  // ── Inject scoped CSS once ──────────────────────────────────────────────────
  function injectCss() {
    if (document.getElementById('stnav-css')) return;
    var css = '' +
    '.stnav{position:sticky;top:0;z-index:200;height:var(--nav-h,52px);background:var(--surface,#fdf8f2);' +
      'border-bottom:1px solid var(--border,#f0e8da);display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem}' +
    '.stnav-brand{font-family:var(--font-mono,monospace);font-size:0.78rem;font-weight:500;color:var(--accent,#c47a2b);' +
      'letter-spacing:0.12em;text-transform:uppercase;white-space:nowrap}' +
    '.stnav-spacer{flex:1}' +
    '.stnav-user{font-size:0.78rem;color:var(--muted,#8a7060);cursor:pointer;padding:0.35rem 0.75rem;border-radius:5px;white-space:nowrap}' +
    '.stnav-user:hover{color:var(--accent,#c47a2b)}' +
    /* desktop grouped bar */
    '.stnav-groups{display:flex;gap:0.15rem;margin:0 0.5rem}' +
    '.stnav-group{position:relative}' +
    '.stnav-top{font-family:var(--font-sans,sans-serif);font-size:0.82rem;color:var(--muted,#8a7060);background:none;border:none;cursor:pointer;' +
      'padding:0.4rem 0.7rem;border-radius:5px;display:inline-flex;align-items:center;gap:0.3rem;transition:background 160ms,color 160ms}' +
    '.stnav-top:hover,.stnav-group:hover .stnav-top{background:var(--surface2,#f7eee1);color:var(--text,#1a1a1a)}' +
    '.stnav-top.active{background:var(--surface2,#f7eee1);color:var(--accent,#c47a2b);font-weight:500}' +
    '.stnav-caret{font-size:0.6rem;opacity:0.7}' +
    '.stnav-drop{position:absolute;top:calc(100% + 2px);left:0;min-width:190px;background:var(--bg,#fff);' +
      'border:1px solid var(--border,#f0e8da);border-radius:6px;box-shadow:0 8px 22px rgba(0,0,0,0.10);padding:0.3rem;display:none;flex-direction:column}' +
    '.stnav-group:hover .stnav-drop,.stnav-group.open .stnav-drop{display:flex}' +
    '.stnav-drop a{font-size:0.8rem;color:var(--muted,#8a7060);text-decoration:none;padding:0.45rem 0.7rem;border-radius:4px;white-space:nowrap}' +
    '.stnav-drop a:hover{background:var(--surface,#fdf8f2);color:var(--text,#1a1a1a)}' +
    '.stnav-drop a.active{background:var(--surface2,#f7eee1);color:var(--accent,#c47a2b);font-weight:500}' +
    '.stnav-flat{font-size:0.82rem;color:var(--muted,#8a7060);text-decoration:none;padding:0.4rem 0.7rem;border-radius:5px;transition:background 160ms,color 160ms}' +
    '.stnav-flat:hover{background:var(--surface2,#f7eee1);color:var(--text,#1a1a1a)}' +
    '.stnav-flat.active{background:var(--surface2,#f7eee1);color:var(--accent,#c47a2b);font-weight:500}' +
    /* hamburger button (hidden on desktop) */
    '.stnav-burger{display:none;background:none;border:none;cursor:pointer;font-size:1.4rem;line-height:1;color:var(--text,#1a1a1a);padding:0.2rem 0.5rem}' +
    /* mobile slide-in panel */
    '.stnav-panel{position:fixed;top:0;right:0;height:100vh;width:78%;max-width:320px;background:var(--bg,#fff);' +
      'border-left:1px solid var(--border,#f0e8da);box-shadow:-8px 0 24px rgba(0,0,0,0.12);transform:translateX(100%);' +
      'transition:transform 200ms ease;z-index:400;overflow-y:auto;padding:1rem 0}' +
    '.stnav-panel.open{transform:translateX(0)}' +
    '.stnav-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);opacity:0;pointer-events:none;transition:opacity 200ms;z-index:399}' +
    '.stnav-overlay.open{opacity:1;pointer-events:auto}' +
    '.stnav-panel-head{display:flex;align-items:center;justify-content:space-between;padding:0 1.25rem 0.75rem;border-bottom:1px solid var(--border,#f0e8da);margin-bottom:0.5rem}' +
    '.stnav-panel-title{font-family:var(--font-mono,monospace);font-size:0.78rem;color:var(--accent,#c47a2b);text-transform:uppercase;letter-spacing:0.1em}' +
    '.stnav-close{background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--muted,#8a7060);line-height:1}' +
    '.stnav-sec-label{font-family:var(--font-mono,monospace);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;' +
      'color:var(--muted,#8a7060);padding:0.6rem 1.25rem 0.25rem}' +
    '.stnav-panel a{display:block;font-size:0.95rem;color:var(--text,#1a1a1a);text-decoration:none;padding:0.7rem 1.25rem}' +
    '.stnav-panel a:active,.stnav-panel a:hover{background:var(--surface,#fdf8f2)}' +
    '.stnav-panel a.active{color:var(--accent,#c47a2b);font-weight:600;background:var(--surface2,#f7eee1)}' +
    '.stnav-panel-user{margin-top:0.5rem;border-top:1px solid var(--border,#f0e8da);padding-top:0.5rem}' +
    /* responsive switch */
    '@media (max-width:1024px){.stnav-groups{display:none}.stnav-burger{display:inline-flex}}' +
    '@media (min-width:1025px){.stnav-panel,.stnav-overlay{display:none!important}}';
    var st = document.createElement('style');
    st.id = 'stnav-css';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function groupActive(g) {
    for (var i = 0; i < g.items.length; i++) if (g.items[i].href === CUR) return true;
    return false;
  }

  // ── Build desktop bar + mobile panel ────────────────────────────────────────
  function render(mount) {
    var brand = 'Sample Tracker', userName = '';
    try {
      if (window.Auth) {
        var co = Auth.getCompany && Auth.getCompany();
        var us = Auth.getUser && Auth.getUser();
        if (co && co.company_name) brand = co.company_name;
        if (us && us.name) userName = us.name;
      }
    } catch (e) {}

    // Desktop groups
    var groupsHtml = MENU.map(function (g) {
      var act = groupActive(g);
      if (g.items.length === 1) {
        var it = g.items[0];
        return '<a class="stnav-flat' + (it.href === CUR ? ' active' : '') + '" href="' + esc(it.href) + '">' + esc(it.label) + '</a>';
      }
      var links = g.items.map(function (it) {
        return '<a class="' + (it.href === CUR ? 'active' : '') + '" href="' + esc(it.href) + '">' + esc(it.label) + '</a>';
      }).join('');
      return '<div class="stnav-group">' +
        '<button class="stnav-top' + (act ? ' active' : '') + '" type="button">' +
          esc(g.label) + '<span class="stnav-caret">\u25be</span></button>' +
        '<div class="stnav-drop">' + links + '</div>' +
      '</div>';
    }).join('');

    // Mobile panel sections
    var panelHtml = MENU.map(function (g) {
      var links = g.items.map(function (it) {
        return '<a class="' + (it.href === CUR ? 'active' : '') + '" href="' + esc(it.href) + '">' + esc(it.label) + '</a>';
      }).join('');
      return '<div class="stnav-sec-label">' + esc(g.label) + '</div>' + links;
    }).join('');

    mount.innerHTML =
      '<nav class="stnav">' +
        '<span class="stnav-brand" id="stnav-brand">' + esc(brand) + '</span>' +
        '<div class="stnav-groups">' + groupsHtml + '</div>' +
        '<span class="stnav-spacer"></span>' +
        '<span class="stnav-user" id="stnav-user">' + esc(userName) + '</span>' +
        '<button class="stnav-burger" id="stnav-burger" type="button" aria-label="Menu">\u2630</button>' +
      '</nav>' +
      '<div class="stnav-overlay" id="stnav-overlay"></div>' +
      '<div class="stnav-panel" id="stnav-panel">' +
        '<div class="stnav-panel-head">' +
          '<span class="stnav-panel-title">Menu</span>' +
          '<button class="stnav-close" id="stnav-close" type="button" aria-label="Close">\u00d7</button>' +
        '</div>' +
        panelHtml +
        '<div class="stnav-panel-user"><a href="#" id="stnav-logout">Log out</a></div>' +
      '</div>';

    wire();
  }

  function wire() {
    // logout (shared)
    function logout(e) {
      if (e) e.preventDefault();
      try { if (window.Auth && Auth.logout) Auth.logout(); } catch (_) {}
      window.location = 'login.html';
    }
    var u = document.getElementById('stnav-user');
    if (u) u.onclick = logout;
    var lo = document.getElementById('stnav-logout');
    if (lo) lo.onclick = logout;

    // desktop dropdown: click-to-toggle (touch-friendly) in addition to hover
    var groups = document.querySelectorAll('.stnav-group');
    Array.prototype.forEach.call(groups, function (g) {
      var top = g.querySelector('.stnav-top');
      if (!top) return;
      top.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var wasOpen = g.classList.contains('open');
        Array.prototype.forEach.call(groups, function (x) { x.classList.remove('open'); });
        if (!wasOpen) g.classList.add('open');
      });
    });
    document.addEventListener('click', function () {
      Array.prototype.forEach.call(groups, function (x) { x.classList.remove('open'); });
    });

    // mobile panel open/close
    var panel = document.getElementById('stnav-panel');
    var overlay = document.getElementById('stnav-overlay');
    function open()  { if (panel) panel.classList.add('open'); if (overlay) overlay.classList.add('open'); }
    function close() { if (panel) panel.classList.remove('open'); if (overlay) overlay.classList.remove('open'); }
    var burger = document.getElementById('stnav-burger');
    var closeBtn = document.getElementById('stnav-close');
    if (burger)   burger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay)  overlay.addEventListener('click', close);
  }

  // ── Mount ───────────────────────────────────────────────────────────────────
  function mountNav() {
    var mount = document.getElementById('app-nav');
    if (!mount) return; // page hasn't placed the mount point
    injectCss();
    render(mount);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountNav);
  } else {
    mountNav();
  }

  // expose for manual refresh if a page updates company/user after load
  window.AppNav = { mount: mountNav };
})();
