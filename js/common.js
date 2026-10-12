/* Shared constants and helpers, exposed on window.CGPA. */
(function () {
  'use strict';

  const NS = (window.CGPA = window.CGPA || {});

  /* ---------- Grade scale ---------- */
  NS.GRADES = [
    { key: 'S', label: 'S', points: 10 },
    { key: 'A', label: 'A', points: 9 },
    { key: 'B', label: 'B', points: 8 },
    { key: 'C', label: 'C', points: 7 },
    { key: 'D', label: 'D', points: 6 },
    { key: 'E', label: 'E', points: 5 },
    { key: 'F', label: 'F / N', points: 0 } // fail / not applicable
  ];

  /* Credit choices offered per course; "x" (manual) is added by the list editor. */
  NS.CREDIT_PRESETS = [1, 1.5, 2, 3, 4];

  /* ---------- Analytics ---------- */
  /* Thin wrapper so a blocked or missing gtag never breaks the app.
     Only counts and calculator names are sent, never titles or grades. */
  NS.track = function (name, params) {
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
    } catch (e) { /* ignore */ }
  };

  /* ---------- localStorage (every access guarded: it can be disabled) ---------- */
  const PREFIX = 'cgpa-calc:v1:';
  NS.store = {
    read(key) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    },
    write(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) { return false; }
    },
    remove(key) {
      try { localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
    }
  };

  /* ---------- Number helpers ---------- */
  NS.parse = (value) => parseFloat(String(value).trim()); // NaN when empty or invalid
  NS.fmt = (n) => n.toFixed(2);
  NS.fmtCredits = (n) => String(Math.round(n * 100) / 100);
  NS.round2 = (n) => Math.round(n * 100) / 100;

  /* ---------- DOM helper ---------- */
  /* el('div', { class: 'x', text: 'hi' }, [children]). Null/false attributes are skipped. */
  NS.el = function (tag, attrs, children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, val]) => {
      if (val == null || val === false) return;
      if (key === 'text') node.textContent = val;
      else if (key === 'html') node.innerHTML = val; // only ever fed our own static icon strings
      else if (key === 'class') node.className = val;
      else node.setAttribute(key, val === true ? '' : val);
    });
    (children || []).forEach((child) => node.append(child));
    return node;
  };

  /* ---------- Icons (inline SVG, no external dependency) ---------- */
  const svg = (paths) =>
    '<svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';

  NS.icon = {
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    clear: svg('<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>'),
    reset: svg('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
    save: svg('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>'),
    trash: svg('<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>'),
    calc: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>'),
    copy: svg('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>')
  };

  /* Fill every <span data-icon="name"> inside root with its SVG. */
  NS.hydrateIcons = function (root) {
    root.querySelectorAll('[data-icon]').forEach((node) => {
      node.innerHTML = NS.icon[node.dataset.icon] || '';
    });
  };

  /* ---------- Toast ---------- */
  let toastTimer;
  NS.toast = function (message) {
    const node = document.getElementById('toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  };

  /* ---------- Clipboard ---------- */
  NS.copy = async function (text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      // Fallback for insecure contexts such as file://
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { /* ignore */ }
      area.remove();
      return ok;
    }
  };
})();
