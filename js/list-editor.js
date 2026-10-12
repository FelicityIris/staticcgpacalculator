/* Editable list of entries, used for both courses and semesters.
   Each row has: a click-to-rename title, a credits control, a grade or GPA control, and a remove button.

   opts:
     id            analytics name of the calculator
     list          <ul> that holds the rows
     addBtn        the wide "add" button
     defaultTitle  n => "Course A" / "Semester 1"
     creditsMode   'select' (presets plus manual) or 'number'
     valueMode     'grade' (S..F/N select) or 'gpa' (0 to 10 number)
     onChange      called after a row is added or removed */
(function () {
  'use strict';

  const NS = window.CGPA;
  const { el, icon, parse, GRADES, CREDIT_PRESETS } = NS;

  NS.createListEditor = function (opts) {
    const { list, addBtn } = opts;
    const items = []; // one { row, credits, value } per row, in display order
    const emit = () => opts.onChange && opts.onChange();

    /* A labelled form cell. */
    function field(label, ...controls) {
      return el('div', { class: 'field' }, [el('span', { class: 'field-label', text: label }), ...controls]);
    }

    /* Smallest unused default title, so names never repeat after removals. */
    function uniqueTitle() {
      let n = items.length + 1;
      while (items.some((it) => it.row.dataset.title === opts.defaultTitle(n))) n += 1;
      return opts.defaultTitle(n);
    }

    /* ---------- Credits control ---------- */
    function buildCredits(data) {
      if (opts.creditsMode === 'number') {
        const input = el('input', {
          type: 'number', class: 'ctl', min: '0', step: '0.5', inputmode: 'decimal',
          placeholder: 'e.g. 20', 'aria-label': 'Credits'
        });
        input.value = data.credits != null ? data.credits : '';
        return {
          cell: field('Credits', input),
          controls: [input],
          target: () => input,
          raw: () => input.value,
          num: () => parse(input.value),
          state: () => ({ credits: input.value, custom: '' })
        };
      }

      // Preset select, with "x (manual)" revealing a number input
      const sel = el('select', { class: 'ctl', 'aria-label': 'Credits' });
      CREDIT_PRESETS.forEach((c) => sel.append(el('option', { value: String(c), text: c.toFixed(1) })));
      sel.append(el('option', { value: 'x', text: 'x (manual)' }));
      const custom = el('input', {
        type: 'number', class: 'ctl', min: '0', step: '0.5', inputmode: 'decimal',
        placeholder: 'Credits', 'aria-label': 'Manual credits', hidden: true
      });

      const wanted = data.credits || '3';
      sel.value = [...sel.options].some((o) => o.value === wanted) ? wanted : '3';
      custom.value = data.custom != null ? data.custom : '';

      const sync = () => { custom.hidden = sel.value !== 'x'; };
      sel.addEventListener('change', () => { sync(); if (!custom.hidden) custom.focus(); });
      sync();

      const isManual = () => sel.value === 'x';
      return {
        cell: field('Credits', sel, custom),
        controls: [sel, custom],
        target: () => (isManual() ? custom : sel),
        raw: () => (isManual() ? custom.value : sel.value),
        num: () => (isManual() ? parse(custom.value) : parseFloat(sel.value)),
        state: () => ({ credits: sel.value, custom: custom.value })
      };
    }

    /* ---------- Grade / GPA control ---------- */
    function buildValue(data) {
      if (opts.valueMode === 'grade') {
        const sel = el('select', { class: 'ctl', 'aria-label': 'Grade' });
        sel.append(el('option', { value: '', text: 'Select grade' }));
        GRADES.forEach((g) => sel.append(el('option', { value: g.key, text: g.label + ' \u2013 ' + g.points.toFixed(1) })));
        sel.value = GRADES.some((g) => g.key === data.value) ? data.value : '';
        return {
          cell: field('Grade', sel),
          control: sel,
          raw: () => sel.value,
          num: () => { const g = GRADES.find((x) => x.key === sel.value); return g ? g.points : NaN; },
          valid: (v) => Number.isFinite(v)
        };
      }
      const input = el('input', {
        type: 'number', class: 'ctl', min: '0', max: '10', step: '0.01', inputmode: 'decimal',
        placeholder: 'e.g. 8.75', 'aria-label': 'GPA'
      });
      input.value = data.value != null ? data.value : '';
      return {
        cell: field('GPA', input),
        control: input,
        raw: () => input.value,
        num: () => parse(input.value),
        valid: (v) => v >= 0 && v <= 10
      };
    }

    /* ---------- Click-to-rename title ---------- */
    function editTitle(row, button) {
      const input = el('input', { type: 'text', class: 'ctl title-input', maxlength: '40', 'aria-label': 'Name' });
      input.value = row.dataset.title;
      button.replaceWith(input);
      input.focus();
      input.select();

      let done = false;
      const finish = (commit, refocus) => {
        if (done) return;
        done = true;
        if (commit && input.value.trim()) row.dataset.title = input.value.trim(); // empty keeps old name
        button.textContent = row.dataset.title;
        input.replaceWith(button);
        if (refocus) button.focus();
      };
      input.addEventListener('blur', () => finish(true, false));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); finish(true, true); }
        else if (e.key === 'Escape') { finish(false, true); }
      });
    }

    /* ---------- Row ---------- */
    function addRow(data) {
      data = data || {};
      const row = el('li', { class: 'row' });
      row.dataset.title = data.title ? String(data.title).slice(0, 40) : uniqueTitle();

      const titleBtn = el('button', { type: 'button', class: 'title-btn', title: 'Click to rename' });
      titleBtn.textContent = row.dataset.title;
      titleBtn.addEventListener('click', () => editTitle(row, titleBtn));

      const credits = buildCredits(data);
      const value = buildValue(data);
      const remove = el('button', { type: 'button', class: 'icon-btn', title: 'Remove', 'aria-label': 'Remove entry', html: icon.x });

      row.append(
        el('div', { class: 'cell-title' }, [field('Name', titleBtn)]),
        credits.cell,
        value.cell,
        el('div', { class: 'cell-remove' }, [remove])
      );

      const item = { row, credits, value };
      remove.addEventListener('click', () => {
        items.splice(items.indexOf(item), 1);
        row.remove();
        NS.track('entry_removed', { calculator: opts.id });
        emit();
      });

      items.push(item);
      list.append(row);
    }

    /* ---------- Public API ---------- */
    const api = {
      add: addRow,
      count: () => items.length,

      clear() {
        items.length = 0;
        list.replaceChildren();
      },

      /* Plain, JSON-safe snapshot for localStorage. */
      getState() {
        return items.map((it) => ({
          title: it.row.dataset.title,
          credits: it.credits.state().credits,
          custom: it.credits.state().custom,
          value: it.value.raw()
        }));
      },

      setState(rows) {
        api.clear();
        if (Array.isArray(rows)) rows.forEach((r) => { if (r && typeof r === 'object') addRow(r); });
      },

      /* Validate every row, flag bad fields, and return numeric values. */
      collect() {
        let ok = true;
        const rows = items.map((it) => {
          it.credits.controls.forEach((c) => c.classList.remove('invalid'));
          it.value.control.classList.remove('invalid');

          const credits = it.credits.num();
          const value = it.value.num();
          const badCredits = !(credits > 0);
          const badValue = !it.value.valid(value);
          if (badCredits) it.credits.target().classList.add('invalid');
          if (badValue) it.value.control.classList.add('invalid');
          if (badCredits || badValue) ok = false;
          return { title: it.row.dataset.title, credits, value };
        });
        return { ok, rows };
      },

      /* Drop rows where nothing was filled in (used before programmatic adds). */
      pruneBlank() {
        items.filter((it) => !it.credits.raw() && !it.value.raw()).forEach((it) => {
          items.splice(items.indexOf(it), 1);
          it.row.remove();
        });
      }
    };

    addBtn.addEventListener('click', () => {
      addRow();
      NS.track('entry_added', { calculator: opts.id });
      emit();
    });

    return api;
  };
})();
