/* Tab 2: aggregate CGPA from semester GPAs, weighted by each semester's credits. */
(function () {
  'use strict';

  const NS = window.CGPA;
  const { fmt, fmtCredits, round2 } = NS;
  const panel = document.getElementById('panel-aggregate');
  let calc;

  const editor = NS.createListEditor({
    id: 'aggregate',
    list: panel.querySelector('.rows'),
    addBtn: panel.querySelector('.add-btn'),
    defaultTitle: (n) => 'Semester ' + n,
    creditsMode: 'number', // semester totals are too varied for presets
    valueMode: 'gpa',
    onChange: () => calc.markStale()
  });
  editor.add();

  calc = NS.createCalculator({
    id: 'aggregate',
    panel,
    getState: editor.getState,
    setState: editor.setState,
    clear() { editor.clear(); editor.add(); },

    compute() {
      const { ok, rows } = editor.collect();
      if (!rows.length) return { error: 'Add at least one semester first.' };
      if (!ok) return { error: 'Enter credits above 0 and a GPA between 0 and 10 for every semester. The highlighted fields need attention.' };

      const credits = rows.reduce((sum, r) => sum + r.credits, 0);
      const points = rows.reduce((sum, r) => sum + r.credits * r.value, 0);
      const cgpa = points / credits;

      return {
        headline: fmt(cgpa),
        caption: 'CGPA',
        stats: [
          ['Total credits', fmtCredits(credits)],
          ['Semesters', rows.length],
          ['Weighted grade points', fmt(points)]
        ],
        copyText: 'CGPA: ' + fmt(cgpa) + ' (' + fmtCredits(credits) + ' credits, ' + rows.length + ' semesters)',
        meta: { entries: rows.length }
      };
    }
  });

  /* Called from the semester tab's "Add to aggregate" button. */
  NS.aggregate = {
    addSemester(credits, gpa) {
      editor.pruneBlank(); // reuse the empty starter row
      editor.add({ credits: String(round2(credits)), value: String(round2(gpa)) });
      calc.markStale();
      NS.showTab('aggregate', { track: false });
      NS.toast('Added to Aggregate CGPA');
      NS.track('semester_sent_to_aggregate');
    }
  };
})();
