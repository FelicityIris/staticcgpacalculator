/* App bootstrap: icons, theme switch and tabs. Loaded last. */
(function () {
  'use strict';

  const NS = window.CGPA;
  NS.hydrateIcons(document);

  /* ---------- Theme (dark default, light via data-theme on <html>) ---------- */
  const THEME_KEY = 'cgpa-calc:theme';
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    if (theme === 'light') root.setAttribute('data-theme', 'light');
    else root.removeAttribute('data-theme');
    themeBtn.textContent = theme === 'light' ? 'Dark mode' : 'Light mode'; // label names the mode you switch to
  }

  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    NS.track('theme_changed', { theme: next });
  });

  /* ---------- Tabs ---------- */
  const TAB_KEY = 'cgpa-calc:tab';
  const tabs = Array.from(document.querySelectorAll('.tab'));

  /* Show one tab. opts: { focus: move focus to the tab, track: false skips analytics } */
  NS.showTab = function (name, opts) {
    opts = opts || {};
    const target = tabs.find((t) => t.dataset.tab === name);
    if (!target) return;

    tabs.forEach((tab) => {
      const active = tab === target;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });

    try { localStorage.setItem(TAB_KEY, name); } catch (e) { /* ignore */ }
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
    if (opts.focus) target.focus();
    if (opts.track !== false) NS.track('tab_switched', { calculator: name });
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => NS.showTab(tab.dataset.tab));

    // Arrow keys, Home and End move between tabs
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      NS.showTab(tabs[next].dataset.tab, { focus: true });
    });
  });

  // Initial tab: URL hash, then last used, then the first one
  const isTab = (name) => tabs.some((t) => t.dataset.tab === name);
  let stored = null;
  try { stored = localStorage.getItem(TAB_KEY); } catch (e) { /* ignore */ }
  const fromHash = location.hash.slice(1);
  NS.showTab(isTab(fromHash) ? fromHash : isTab(stored) ? stored : 'semester', { track: false });

  window.addEventListener('hashchange', () => {
    const name = location.hash.slice(1);
    if (isTab(name)) NS.showTab(name, { track: false });
  });
})();
