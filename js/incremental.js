/* Tab 3: incremental CGPA. Combines credits and CGPA so far with one more semester. */
(function () {
  'use strict';

  const NS = window.CGPA;
  const { fmt, fmtCredits, parse } = NS;
  const panel = document.getElementById('panel-incremental');

  const ids = ['inc-prev-credits', 'inc-prev-cgpa', 'inc-next-credits', 'inc-next-gpa'];
  const input = (id) => panel.querySelector('#' + id);

  // Validity rule per field (NaN fails every comparison, so empty fields are invalid)
  const rules = {
    'inc-prev-credits': (v) => v >= 0,
    'inc-prev-cgpa': (v) => v >= 0 && v <= 10,
    'inc-next-credits': (v) => v > 0,
    'inc-next-gpa': (v) => v >= 0 && v <= 10
  };

  const reset = (values) => ids.forEach((id) => {
    input(id).value = values && values[id] != null ? values[id] : '';
    input(id).classList.remove('invalid');
  });

  NS.createCalculator({
    id: 'incremental',
    panel,
    getState: () => Object.fromEntries(ids.map((id) => [id, input(id).value])),
    setState: reset,
    clear: () => reset(null),

    compute() {
      const v = {};
      let ok = true;
      ids.forEach((id) => {
        v[id] = parse(input(id).value);
        const good = rules[id](v[id]);
        input(id).classList.toggle('invalid', !good);
        if (!good) ok = false;
      });
      if (!ok) return { error: 'Fill in all four fields. Next semester credits must be above 0, and CGPA and GPA must be between 0 and 10.' };

      const prevCredits = v['inc-prev-credits'];
      const prevCgpa = v['inc-prev-cgpa'];
      const nextCredits = v['inc-next-credits'];
      const nextGpa = v['inc-next-gpa'];

      const totalCredits = prevCredits + nextCredits;
      const cgpa = (prevCredits * prevCgpa + nextCredits * nextGpa) / totalCredits;
      const delta = cgpa - prevCgpa;

      return {
        headline: fmt(cgpa),
        caption: 'Updated CGPA',
        stats: [
          ['Total credits', fmtCredits(totalCredits)],
          ['Previous CGPA', fmt(prevCgpa)],
          ['Next semester GPA', fmt(nextGpa)],
          ['Change', (delta >= 0 ? '+' : '') + fmt(delta), delta >= 0 ? 'ok' : 'bad']
        ],
        copyText: 'Updated CGPA: ' + fmt(cgpa) + ' (' + fmtCredits(totalCredits) + ' credits; was ' + fmt(prevCgpa) +
          ' over ' + fmtCredits(prevCredits) + ' credits, next semester ' + fmt(nextGpa) + ' over ' + fmtCredits(nextCredits) + ')',
        meta: {}
      };
    }
  });
})();
