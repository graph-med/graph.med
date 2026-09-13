# Later — named, not registered

Work that is known and not registered as a package. A human turns an entry into a
package (`README.md`) when they decide it is next; a session may add an entry here
when it finds work it cannot do, stated as the durable shape of the work, not as a
log. Remove an entry when its package is registered.





- the chapter panel's bottom edge runs under the legend on a phone: its `max-height` leaves room for the legend's two desktop lines, and on a 390 px screen the legend wraps to four; the panel should stop above the legend at every width (`tools/site/static/site.css`, `.chapters` and `.hint`)

- codes_as: no terminology namespace is imported yet. Rule once one is, by facet — procedure → OPS, patient_state → ICD-10-GM, outcome and finding → SNOMED CT where available; first candidates concepts/pankreasresektion → ops-2026/5-52 and the codes C18/C20 in QI 1's denominator (p. 122). A concept without a code must be shown as uncoded, not as unchecked.

- evidence profiles (the per-outcome GRADE tables in evidence-based boxes) — no shape in the schema; open-questions → evidence-profiles

- gap_notice claims (boxes 4.3, 4.6, 5.10, 5.13, 7.8) are extracted and unlinked — no edge kind fits; open-questions → gap-notices

- quality indicators (chapter 9, Tabelle 7, pp. 122–124): QI 1 → statements/keine-drainage-kolorektale-resektion (box 6.9), QI 2 → keine-drainage-unkomplizierte-leberresektion (6.8), QI 3 → magensonde-entfernung-vor-narkoseausleitung-kolorektal (7.1) with a denominator also covering the -magenresektion and -leberresektion statements, QI 4 → dauerkatheter-entfernung-24h-kolorektal and dauerkatheter-verlaengert-bei-harnverhaltrisiko (7.5/7.6) narrowed to onkologische Kolonresektion; also the chapter's definition of Qualitätsindikatoren (p. 122) and the note that none is in the onkologischer Basisdatensatz; open-questions → quality-indicators

- body-text enrichment (refines/supplements/limits beyond the criterion claims), page-anchored candidates: p. 27 continue calcium antagonists for angina, pause for hypertension on the day of surgery (a recommendation outside any box); §5.7 sedierende Prämedikation has no box, its text weighs benzodiazepines case by case and names melatonin; p. 78 no recommendation on nasogastric tubes after pylorus-preserving pancreatic head resection, pancreato-gastrostomy and distal pancreatectomy; p. 79 a secondary nasogastric tube on delayed gastric emptying after liver resection; p. 84 defers balanced analgesia to the S3 guideline on acute perioperative pain; pp. 92–100 five gap notices outside boxes (methylnaltrexone p. 92, local anaesthetics p. 93, propranolol p. 94, dexmedetomidine p. 95 withheld after the 2022 Rote-Hand-Brief, laxatives p. 100, each "für andere viszeralonkologische Operationen … keine Empfehlung") and the note that alvimopan is effective but unlicensed in Germany (p. 92); p. 105 no RCT data on chewing gum after minimally invasive liver or pancreatic resection; pp. 108–109 the rationale for 7.29's EK; p. 121 "zu anderen Organ-Entitäten … keine Empfehlung" for the specialised nurse, in tension with box 8.7 and to be read with it

- cross-statement edges (specializes/complements) not yet asserted; first candidates 7.12 (TAP block, minimally invasive colorectal) and 7.13 (peripheral regional analgesia) against 7.9/7.10 (epidural)

- no pathway authored; chapter 6 is a recommendation list, not a decision algorithm; open-questions → decision-graph-derivation

- screenshot driver: `tools/screenshot.js` opens only a view page and captures only the viewport — it waits for `window.graphmed`, so an entity page (`statements/<id>/`) cannot be captured, and a sheet longer than the screen is seen only through a tall `--size`. An action or flag for an entity page and a full-page capture would let a build package show the entity page it claims to render
