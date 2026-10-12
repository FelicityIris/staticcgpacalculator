/* Tab 1: course-wise semester GPA. */
(function () {
  'use strict';

  const NS = window.CGPA;
  const { fmt, fmtCredits } = NS;
  const panel = document.getElementById('panel-semester');
  let calc; // assigned below; referenced lazily by the editor callback

  // A, B, C ... Z, then plain numbers
  const courseName = (n) => 'Course ' + (n <= 26 ? String.fromCharCode(64 + n) : n);

  const editor = NS.createListEditor({
    id: 'semester',
    list: panel.querySelector('.rows'),
    addBtn: panel.querySelector('.add-btn'),
    defaultTitle: courseName,
    creditsMode: 'select',
    valueMode: 'grade',
    onChange: () => calc.markStale()
  });
  editor.add(); // start with one row

  calc = NS.createCalculator({
    id: 'semester',
    panel,
    getState: editor.getState,
    setState: editor.setState,
    clear() { editor.clear(); editor.add(); },

    compute() {
      const { ok, rows } = editor.collect();
      if (!rows.length) return { error: 'Add at least one course first.' };
      if (!ok) return { error: 'Choose credits and a grade for every course. The highlighted fields need attention.' };

      const credits = rows.reduce((sum, r) => sum + r.credits, 0);
      const points = rows.reduce((sum, r) => sum + r.credits * r.value, 0);
      const gpa = points / credits;

      return {
        headline: fmt(gpa),
        caption: 'Semester GPA',
        stats: [
          ['Total credits', fmtCredits(credits)],
          ['Courses', rows.length],
          ['Weighted grade points', fmt(points)]
        ],
        copyText: 'Semester GPA: ' + fmt(gpa) + ' (' + fmtCredits(credits) + ' credits, ' + rows.length + ' courses)',
        actions: [{
          label: 'Add to aggregate',
          icon: 'plus',
          onClick: () => NS.aggregate.addSemester(credits, gpa)
        }],
        meta: { entries: rows.length }
      };
    }
  });
})();
