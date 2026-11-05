# Insulin dashboard

Approved scope: a phone-friendly dashboard with Start, Continue and Resume modes based only on the supplied IMG_8779 order text. The user explicitly approved “Clarify order” for unresolved rules. Use a buildless static app in emuhleej/Insulin-; no backend, identifiers, persistent patient records, external scripts or screenshot publication.

Start uses the stated 4 units/hr only when the entered glucose does not conflict with lower-glucose instructions. Continue evaluates all applicable adjustment clauses and withholds a numerical dose when actions conflict. Resume after a low-glucose hold requires glucose strictly greater than 120 and uses 50% of the pre-hold rate. Potassium less than 3.3 blocks infusion. Restart after potassium, combined or other holds needs clarification. Low glucose stop instructions remain visible even when other fields are incomplete.

Do not fill the 9–10 units/hr rate-band gap, infer rounding, clamp a negative rate, invent a hypoglycemia treatment or use another hospital's algorithm. Explain source limitations and display source rules. Clear results on edits. Show hourly check guidance, without background alarms. No claim of clinical validation.

Approach: a small static browser app with a separately testable pure calculation module is sufficient; a backend adds unnecessary sensitive-data storage and a framework adds unnecessary setup. Use responsive cream/teal styling, explicit labels, keyboard controls and readable status text.
