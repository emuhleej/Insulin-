# Insulin infusion reference

A responsive, dependency-free dashboard for the specific insulin order supplied by the repository owner. Choose **Start**, **Continue**, or **Resume**. Undefined or conflicting cases display **Clarify order** without a calculated dose.

## Open the dashboard

Download the repository and open `index.html` in a modern browser, keeping `styles.css`, `protocol.js`, and `app.js` beside it. No build or install is needed. To host with GitHub Pages, select **Settings → Pages → Deploy from a branch → main → / (root)**. Source delivery does not itself enable Pages.

## Scope and review status

This is a draft protocol reference, not a clinically validated medical device or a substitute for the active patient-specific order, institutional policy, or clinical judgment. It must be reviewed and validated by the appropriate clinical team before clinical use. Dosing logic is transcribed from the supplied order image; it is not replaced by general web guidance. No original patient screenshot, patient identifiers, weight, timestamps, or other medications are included in the repository.

- Start: stated 4 units/hr, with potassium and glucose checks. Starting glucose 100–139 produces clarification because the initial-rate and reduction instructions overlap.
- Continue: compare current and previous consecutive hourly glucose results. All matching adjustment clauses are evaluated. Different applicable actions produce clarification, even if they could coincidentally yield the same number.
- Resume: glucose-only hold can restart at half the actual pre-hold rate only above 120 mg/dL and with potassium at least 3.3 mEq/L. Exactly 120 remains held. Potassium, combined, other or unknown holds require clarification.
- Below 100 mg/dL: explicit stop instruction. Below 70: additionally use the separate hypoglycemia protocol and notify the provider. No missing hypoglycemia treatment is invented.
- Rates greater than 9 and less than 10 require clarification when a table adjustment is needed. Zero/negative calculated adjustment outcomes are not clamped. No clinical pump rounding or mL/hr conversion is assumed.
- Results clear on every field edit or mode change. Reset clears the form. No app storage, analytics, external assets, or network submissions. Close the tab when finished; browser session restoration remains browser-controlled.

## Verify

Requires Node.js 20+ only for tests:

```sh
node --test tests/protocol.test.cjs
node --check app.js
node --check protocol.js
```

45 tests cover thresholds, rate bands, conflicts, missing/invalid input, start/resume distinctions, low-glucose messages and decimal arithmetic. Browser checks exercised all three modes, conflict display, result invalidation, and reset. Responsive CSS includes a 720px breakpoint; a separate physical iPhone test has not been performed.

## Files

- `index.html`: accessible form and visible source transcription.
- `styles.css`: responsive layout and status styling.
- `protocol.js`: pure calculation module, also exported for Node tests.
- `app.js`: mode-specific form and result handling.
- `tests/protocol.test.cjs`: behavior and boundary tests.
- `docs/superpowers/`: approved scope and implementation plan.

General safety reference: [ISMP high-alert medications list](https://www.ismp.org/system/files/resources/2024-01/ISMP_HighAlert_AcuteCare_List_010924_MS5760.pdf). This reference informed caution around validation, not the supplied dosing algorithm.
