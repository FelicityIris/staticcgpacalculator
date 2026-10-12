/* Controller shared by the three calculators: builds the bottom toolbar and
   wires clear / reset / save / delete-saved / compute, plus result display.

   cfg:
     id        storage + analytics key
     panel     the tab panel element
     getState  () => JSON-safe snapshot of the entries
     setState  snapshot => void
     clear     () => void
     compute   () => { error } or
               { headline, caption, stats: [[label, value, cssClass?]], copyText,
                 actions?: [{ label, icon, onClick }], meta? } */
(function () {
  'use strict';

  const NS = window.CGPA;
  const { el, icon, store, track, toast } = NS;

  NS.createCalculator = function (cfg) {
    const { id, panel } = cfg;

    // Insert the shared toolbar
    const slot = panel.querySelector('[data-toolbar]');
    slot.append(document.getElementById('toolbar-tpl').content.cloneNode(true));
    NS.hydrateIcons(slot);

    const action = (name) => slot.querySelector('[data-action="' + name + '"]');
    const tipFor = (name) => slot.querySelector('[data-tip-for="' + name + '"]');
    const resetBtn = action('reset');
    const forgetBtn = action('forget');
    const result = panel.querySelector('[data-result]');
    const errorBox = panel.querySelector('[data-error]');

    /* ---------- Toolbar state (depends on whether something is saved) ---------- */
    function updateToolbar() {
      const saved = store.read(id);
      resetBtn.disabled = !saved;
      forgetBtn.hidden = !saved;
      forgetBtn.parentElement.hidden = !saved; // hide the tooltip wrapper too

      tipFor('reset').dataset.tip = saved ? 'Reload the entries from your last save' : 'Nothing saved yet';
      tipFor('save').dataset.tip = saved
        ? 'Saved ' + new Date(saved.savedAt).toLocaleString() + '. Click to overwrite. Stored only in this browser.'
        : 'Save these entries in this browser (localStorage). Nothing is uploaded.';
    }

    /* ---------- Result / error display ---------- */
    function hideFeedback() {
      result.hidden = true;
      result.classList.remove('stale');
      errorBox.hidden = true;
    }

    /* Entries changed after a result was shown: dim it and ask for a recompute. */
    function markStale() {
      errorBox.hidden = true;
      if (!result.hidden) result.classList.add('stale');
    }

    function showError(message) {
      result.hidden = true;
      errorBox.textContent = message;
      errorBox.hidden = false;
    }

    function showResult(out) {
      const stats = el('dl', { class: 'stats' }, out.stats.map(([label, value, cls]) =>
        el('div', {}, [el('dt', { text: label }), el('dd', { text: String(value), class: cls })])
      ));

      const copyBtn = el('button', { type: 'button', class: 'btn btn-icon', html: icon.copy + '<span>Copy result</span>' });
      copyBtn.addEventListener('click', async () => {
        toast((await NS.copy(out.copyText)) ? 'Copied to clipboard' : 'Could not copy');
        track('result_copied', { calculator: id });
      });

      const actions = el('div', { class: 'result-actions' }, [copyBtn]);
      (out.actions || []).forEach((a) => {
        const btn = el('button', { type: 'button', class: 'btn btn-icon', html: (icon[a.icon] || '') + '<span>' + a.label + '</span>' });
        btn.addEventListener('click', a.onClick);
        actions.append(btn);
      });

      result.replaceChildren(
        el('div', { class: 'result-main' }, [
          el('span', { class: 'result-value', text: out.headline }),
          el('span', { class: 'result-caption', text: out.caption })
        ]),
        stats,
        actions
      );
      errorBox.hidden = true;
      result.classList.remove('stale');
      result.hidden = false;
      result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* ---------- Toolbar actions ---------- */
    action('clear').addEventListener('click', () => {
      cfg.clear();
      hideFeedback();
      toast(store.read(id) ? 'Cleared. Press Reset to restore your saved entries.' : 'Cleared');
      track('entries_cleared', { calculator: id });
    });

    resetBtn.addEventListener('click', () => {
      const saved = store.read(id);
      if (!saved) return;
      cfg.setState(saved.data);
      hideFeedback();
      toast('Restored your saved entries');
      track('entries_reset', { calculator: id });
    });

    action('save').addEventListener('click', () => {
      const ok = store.write(id, { savedAt: Date.now(), data: cfg.getState() });
      toast(ok ? 'Saved in this browser' : 'Could not save: browser storage is unavailable');
      updateToolbar();
      if (ok) track('entries_saved', { calculator: id });
    });

    forgetBtn.addEventListener('click', () => {
      if (!window.confirm('Delete the saved entries for this calculator from this browser?')) return;
      store.remove(id);
      updateToolbar();
      toast('Saved data deleted');
      track('saved_data_deleted', { calculator: id });
    });

    function compute() {
      const out = cfg.compute();
      if (out.error) {
        showError(out.error);
        track('compute_invalid', { calculator: id });
        return;
      }
      showResult(out);
      track('cgpa_computed', Object.assign({ calculator: id }, out.meta || {}));
    }
    action('compute').addEventListener('click', compute);

    /* ---------- Panel-wide behaviour ---------- */
    // Any edit clears the field's error flag and marks the shown result as stale
    const onEdit = (e) => {
      if (e.target.closest('[data-toolbar]') || e.target.classList.contains('title-input')) return;
      e.target.classList.remove('invalid');
      markStale();
    };
    panel.addEventListener('input', onEdit);
    panel.addEventListener('change', onEdit);

    // Enter inside a number field computes
    panel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.defaultPrevented && e.target.tagName === 'INPUT' && !e.target.classList.contains('title-input')) {
        compute();
      }
    });

    /* ---------- Init: load saved entries if there are any ---------- */
    const saved = store.read(id);
    if (saved && saved.data) {
      try { cfg.setState(saved.data); } catch (e) { /* ignore corrupted data */ }
    }
    updateToolbar();

    return { markStale };
  };
})();
