# Later — named, not registered

> **Frozen on 2026-09-19.** Nothing is added here any more: work an agent
> finds and cannot do goes into its final message, and the maintainer
> registers what they want as a Todo card on the board (ADR-0004). The
> entries below were migrated to Todo cards on 2026-09-19, each marked with
> its card number.

Work that is known and not registered as a package. A human turns an entry into a
package (`README.md`) when they decide it is next; a session may add an entry here
when it finds work it cannot do, stated as the durable shape of the work, not as a
log. Remove an entry when its package is registered.





- **#99** zone 8 of the statement card names the source by its title once per supporting claim, so a statement with several claims from one source repeats a long title per entry (seen on a throwaway fixture; no such statement is in the pool yet); name the source once per zone, or once per source, when the first such statement exists (`tools/site/templates/details.html`)

- **#100** the detail sections of concepts, claims and sources, and the entity page's "json" link, still carry English chrome ("Used in", "Bears on", "codes", "grade", "No.", "copy", "section", "page") and the old `.tag` styling; the card's per-language table (`CARD_WORDS` in `tools/build.py`) could cover them under the same no-fallback rule

- **#101** fill `claim.evidence` (schema 0.6.0, WP-0023) from the per-outcome GRADE tables under POMGAT's evidence-based boxes: an `extraction` pass over the source, one entry per outcome row in the guideline's own words, `outcome` where the endpoint has a concept; every statement reads `Evidenz: nicht erfasst` until it runs. Registered once the schema has merged, so its scope can name the real field (WP-0023, Notes)

- **#102** an outcome the guideline lists without a certainty rating has no shape in schema 0.6.0: `evidence_entry` requires `value`, so the extraction pass that fills `claim.evidence` cannot record such a row, and the card's mixed state (`Evidenz: endpunktabhängig (3 von 5 Endpunkten erfasst)`, rows `nicht erfasst`; built by WP-0025, reachable only from data) stays unreachable. Either `value` becomes optional (a schema change with a validator rule that an entry states an outcome or a value) or the pass leaves such rows out and the count silently shrinks; decide with the first table that has an empty cell

- **#103** the counting lines of zone 4 are fixed strings in the plural (`{n} Endpunkte`), so a per-outcome table with one row reads `1 Endpunkte`; a singular form is a maintainer's string, not one to invent (`CARD_WORDS` in `tools/build.py`)

- **#104** a statement box's "no border" is a hairline: `tools/site/static/graph.js` sets `border-color: rgba(0,0,0,0)` on `node[type = 'statement']`, but Cytoscape ignores the alpha and draws the 1.5px base border near-black, so every box without a verb, contested or picked border still shows a thin dark rim (seen by pixel sample on WP-0022's captures, present before it). `border-opacity: 0` or `border-width: 0` on that rule makes "none" mean none; look at every box in both themes afterwards, since the hairline is currently what gives a pastel box its crisp edge

- **#105** the chapter panel's bottom edge runs under the legend on a phone: its `max-height` leaves room for the legend's three desktop lines, and on a 390 px screen the legend wraps to five; the panel should stop above the legend at every width (`tools/site/static/site.css`, `.chapters` and `.hint`)

- **#106** the question a dimension axis adds is a per-language form, "Welche {label}?", filled with the axis's short label (`WORDS` in `tools/build.py`); it cannot inflect, so a neuter axis ("Stadium") would read "Welche Stadium?" — either a `question` the axis declares in its own language, or a gender beside the label, would fix it; decide with the first axis the form gets wrong

- **#107** a hierarchy axis over `condition` (spec §4.1 allows `population` and `condition`) is not built: the tree has junctions for patient groups only, a condition is an answer straight into its box, so there is nothing for such an axis to fold; the build stops with a message. Needs condition junctions, or the answer becoming a node, when the first such axis is asserted (`tools/build.py`, `hierarchy()`)

- **#108** the switch redraws the graph from the chosen grouping's tree (the page holds one tree per grouping, `groupings` in the view's JSON), so a view with several axes ships every tree in its JSON; fine at ninety recommendations, worth one shared node table if a view ever grows to thousands

- **#109** a `broader` edge that holds both plainly and on a hierarchy axis (the same concept under the same parent, once without `axis` and once with it) is refused by the validator as a duplicate — `axis` is not an edge discriminator — although spec §4.1 lets a concept have a parent per respect; met on a throwaway assertion of `axes/region`, whose five families are the plain hierarchy's. The linking pass that asserts a hierarchy axis needs either `axis` in the edge's identity (`tools/validate.py`) or the rule that a coinciding plain edge is the axis's edge too

- **#110** codes_as: no terminology namespace is imported yet. Rule once one is, by facet — procedure → OPS, patient_state → ICD-10-GM, outcome and finding → SNOMED CT where available; first candidates concepts/pankreasresektion → ops-2026/5-52 and the codes C18/C20 in QI 1's denominator (p. 122). A concept without a code must be shown as uncoded, not as unchecked.

- **#111** gap_notice claims (boxes 4.3, 4.6, 5.10, 5.13, 7.8) are extracted and unlinked — no edge kind fits; open-questions → gap-notices

- **#112** quality indicators (chapter 9, Tabelle 7, pp. 122–124): QI 1 → statements/keine-drainage-kolorektale-resektion (box 6.9), QI 2 → keine-drainage-unkomplizierte-leberresektion (6.8), QI 3 → magensonde-entfernung-vor-narkoseausleitung-kolorektal (7.1) with a denominator also covering the -magenresektion and -leberresektion statements, QI 4 → dauerkatheter-entfernung-24h-kolorektal and dauerkatheter-verlaengert-bei-harnverhaltrisiko (7.5/7.6) narrowed to onkologische Kolonresektion; also the chapter's definition of Qualitätsindikatoren (p. 122) and the note that none is in the onkologischer Basisdatensatz; open-questions → quality-indicators

- **#113** body-text enrichment (refines/supplements/limits beyond the criterion claims), page-anchored candidates: p. 27 continue calcium antagonists for angina, pause for hypertension on the day of surgery (a recommendation outside any box); §5.7 sedierende Prämedikation has no box, its text weighs benzodiazepines case by case and names melatonin; p. 78 no recommendation on nasogastric tubes after pylorus-preserving pancreatic head resection, pancreato-gastrostomy and distal pancreatectomy; p. 79 a secondary nasogastric tube on delayed gastric emptying after liver resection; p. 84 defers balanced analgesia to the S3 guideline on acute perioperative pain; pp. 92–100 five gap notices outside boxes (methylnaltrexone p. 92, local anaesthetics p. 93, propranolol p. 94, dexmedetomidine p. 95 withheld after the 2022 Rote-Hand-Brief, laxatives p. 100, each "für andere viszeralonkologische Operationen … keine Empfehlung") and the note that alvimopan is effective but unlicensed in Germany (p. 92); p. 105 no RCT data on chewing gum after minimally invasive liver or pancreatic resection; pp. 108–109 the rationale for 7.29's EK; p. 121 "zu anderen Organ-Entitäten … keine Empfehlung" for the specialised nurse, in tension with box 8.7 and to be read with it

- **#114** cross-statement edges (specializes/complements) not yet asserted; first candidates 7.12 (TAP block, minimally invasive colorectal) and 7.13 (peripheral regional analgesia) against 7.9/7.10 (epidural)

- **#115** no pathway authored; chapter 6 is a recommendation list, not a decision algorithm; open-questions → decision-graph-derivation

- **#116** screenshot driver: `tools/screenshot.js` opens only a view page and captures only the viewport — it waits for `window.graphmed`, so an entity page (`statements/<id>/`) cannot be captured, and a sheet longer than the screen is seen only through a tall `--size`; on a phone a deep link (`open=`) scrolls the sheet into view, so the graph under a selection — dimmed siblings, the picked box — cannot be captured at phone width at all. An action or flag for an entity page, a full-page capture, and a scroll back to the graph after `open=` would let a build package show the entity page it claims to render and the phone graph under a selection

- **#117** theme switch while a view page is open: `tools/site/static/graph.js` reads the stylesheet's colours once, when the graph is drawn, so a change of `prefers-color-scheme` restyles the page but leaves the graph in the old theme until it is reloaded; a `matchMedia` listener that re-reads the variables and restyles the graph would follow it

- **#118** screenshot driver: `tools/screenshot.js` has no keyboard action — it drives the page only through `window.graphmed` — so what a key does in a control (↓ and ↑ in the search box stepping through the matches) is checked by reading the handler, not in the browser; a `key=<name>` action that focuses the search box and presses the key would close that gap
