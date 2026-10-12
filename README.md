# Static CGPA Calculator
Originally made as a useful personal tool using Claude.

A static, weighted CGPA calculator. Plain HTML, CSS and JavaScript: no build step and no dependencies. Open `index.html` or host the folder anywhere (GitHub Pages works).

## Calculators
1. **Semester GPA**: add courses with credits (1.0, 1.5, 2.0, 3.0, 4.0 or manual) and a grade.
2. **Aggregate CGPA**: add semesters with credits and GPA. A semester result can be sent here from tab 1.
3. **Incremental CGPA**: combine credits and CGPA so far with one more semester.

Grade scale: S 10, A 9, B 8, C 7, D 6, E 5, F/N 0. Results are weighted by credits.

Each tab has a toolbar: **Clear all**, **Reset** (reload saved entries), **Save** (browser localStorage, with a delete icon once saved) and **Compute**. Dark and light themes are available from the top bar.

## Structure
```
index.html
css/style.css        theme tokens and base styles
css/calculator.css   tabs, rows, toolbar, results
js/common.js         grades, storage, analytics wrapper, helpers
js/list-editor.js    editable course/semester rows
js/calculator.js     shared toolbar, save/reset, result display
js/semester.js  js/aggregate.js  js/incremental.js
js/app.js            theme switch and tabs
```

## Analytics
Google Analytics events (no entered values or titles are sent): `cgpa_computed`, `compute_invalid`, `entry_added`, `entry_removed`, `entries_saved`, `entries_reset`, `entries_cleared`, `saved_data_deleted`, `result_copied`, `semester_sent_to_aggregate`, `tab_switched`, `theme_changed`.

## License
GPLv3, see `LICENSE`.
