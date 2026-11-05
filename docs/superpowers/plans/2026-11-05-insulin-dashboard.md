# Insulin Dashboard Implementation Plan

> Execute inline using superpowers:executing-plans.

**Goal:** Build the approved three-mode protocol reference with unresolved cases blocked.
**Architecture:** Static HTML/CSS, pure protocol function, DOM adapter. No persistence or external dependencies.
**Tech Stack:** HTML, CSS, browser JavaScript, Node test runner.
**Spec:** ../specs/2026-11-05-insulin-design.md

## Global Constraints
Use only the supplied protocol for dosing. Never publish the patient screenshot. No guessed restart rate, band boundary, rounding, or conflicting rule precedence.

## Review Focus
Missing/invalid inputs must not produce a dose; glucose emergencies must stay visible; boundary 120 for restart is exclusive; fractional rate gaps must be blocked when adjustment depends on them; edits and mode changes must clear old results.

## Tasks
- [x] Write tests in tests/protocol.test.cjs for evaluate(input), expecting {kind,title,rate,reason,next}; run and observe failure.
- [x] Implement protocol.js; verify starts, holds, resume, all adjustment bands, overlaps, invalid input, nonpositive output. Run node --test.
- [x] Build index.html, styles.css and app.js with labelled mode-specific inputs, explicit review, source reference and reset. Check JavaScript and responsive browser behavior where available.
- [x] Review the complete source, fix significant findings, rerun tests and publish source to the supplied empty GitHub repository. Verify returned commit and file tree.

## Verification ledger
45 calculation tests pass. Browser exercised Start, Continue conflict, Resume glucose and potassium cases, edit invalidation and reset. Review corrected unqualified restart text and decimal display artifacts. Browser reset regression reproduced, fixed by avoiding a form.reset name collision, and retested. No physical iPhone verification.
