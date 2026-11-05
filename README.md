# Insulin infusion reference

A responsive, dependency-free dashboard for the specific insulin order supplied by the repository owner. Choose **Start**, **Continue**, or **Resume**. Undefined or conflicting cases display **Clarify order** without a calculated dose.

## Open the dashboard

Download the repository and open `index.html` in a modern browser, keeping `styles.css`, `protocol.js`, `session.js`, and `app.js` beside it. No build or install is needed. To host with GitHub Pages, select **Settings → Pages → Deploy from a branch → main → / (root)**. Source delivery does not itself enable Pages.

## Check-by-check workflow

Enter glucose and potassium, then review the starting rate. Confirm **Rate applied — next glucose check** after applying and verifying the displayed rate. The next form carries forward the prior glucose and actual confirmed rate. Enter the next reading, review the potassium result, confirm consecutive hourly readings, and review the next instruction. The displayed due time is based on the recorded glucose check time; no background alarm is provided. Below 70 mg/dL, timing defers to the separate hypoglycemia protocol.

Saving a hold keeps the pre-hold rate and reason. Unknown, potassium and combined holds never silently become a glucose-only restart. Clarification results cannot be saved as applied doses. New patient clears the saved history after confirmation.

## Scope and review status

This is a draft protocol reference, not a clinically validated medical device or a substitute for the active patient-specific order, institutional policy, or clinical judgment. It must be reviewed and validated by the appropriate clinical team before clinical use. Dosing logic is transcribed from the supplied order image; it is not replaced by general web guidance. No original patient screenshot, patient identifiers, weight, timestamps, or other medications are included in the repository.

- Start: stated 4 units/hr, with potassium and glucose checks. Starting glucose 100–139 produces clarification because the initial-rate and reduction instructions overlap.
- Continue: compare current and previous consecutive hourly glucose results. All matching adjustment clauses are evaluated. Different applicable actions produce clarification, even if they could coincidentally yield the same number.
- Resume: glucose-only hold can restart at half the actual pre-hold rate only above 120 mg/dL and with potassium at least 3.3 mEq/L. Exactly 120 remains held. Potassium, combined, other or unknown holds require clarification.
- Below 100 mg/dL: explicit stop instruction. Below 70: additionally use the separate hypoglycemia protocol and notify the provider. No missing hypoglycemia treatment is invented.
- Rates greater than 9 and less than 10 require clarification when a table adjustment is needed. Zero/negative calculated adjustment outcomes are not clamped. No clinical pump rounding or mL/hr conversion is assumed.
- Results clear on every field edit or mode change. Reset clears the form. The current session is saved to browser localStorage (up to 1,000 checks), with no patient identifiers, analytics, external assets, or network submissions. The same browser and site can restore it after same-patient confirmation; it does not sync between devices. New patient clears it. Another tab changing or clearing the session blocks stale forms until reload.

## Verify

Requires Node.js 20+ only for tests:

```sh
node --test tests/*.test.cjs
node --check app.js
node --check protocol.js
```

58 tests cover thresholds, rate bands, conflicts, missing/invalid input, start/resume distinctions, low-glucose messages and decimal arithmetic. Browser checks exercised all three modes, conflict display, result invalidation, and reset. Responsive CSS includes a 720px breakpoint; a separate physical iPhone test has not been performed.

## Files

- `index.html`: accessible form and visible source transcription.
- `styles.css`: responsive layout and status styling.
- `protocol.js`: pure calculation module, also exported for Node tests.
- `app.js`: guided form, explicit applied/off confirmation, browser storage and restore handling.
- `session.js`: check history, retained pre-hold state and next-check timing.
- `tests/protocol.test.cjs`: behavior and boundary tests.
- `docs/superpowers/`: approved scope and implementation plan.

General safety reference: [ISMP high-alert medications list](https://www.ismp.org/system/files/resources/2024-01/ISMP_HighAlert_AcuteCare_List_010924_MS5760.pdf). This reference informed caution around validation, not the supplied dosing algorithm.
