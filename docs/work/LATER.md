# Later — named, not registered

Work that is known and not registered as a package. A human turns an entry into a
package (`README.md`) when they decide it is next; a session may add an entry here
when it finds work it cannot do, stated as the durable shape of the work, not as a
log. Remove an entry when its package is registered.

- the chapter panel's bottom edge runs under the legend on a phone: its `max-height` leaves room for the legend's two desktop lines, and on a 390 px screen the legend wraps to four; the panel should stop above the legend at every width (`tools/site/static/site.css`, `.chapters` and `.hint`)

- the question a dimension axis adds is a per-language form, "Welche {label}?", filled with the axis's short label (`WORDS` in `tools/build.py`); it cannot inflect, so a neuter axis ("Stadium") would read "Welche Stadium?" — either a `question` the axis declares in its own language, or a gender beside the label, would fix it; decide with the first axis the form gets wrong

- a hierarchy axis over `condition` (spec §4.1 allows `population` and `condition`) is not built: the tree has junctions for patient groups only, a condition is an answer straight into its box, so there is nothing for such an axis to fold; the build stops with a message. Needs condition junctions, or the answer becoming a node, when the first such axis is asserted (`tools/build.py`, `hierarchy()`)

- the switch redraws the graph from the chosen grouping's tree (the page holds one tree per grouping, `groupings` in the view's JSON), so a view with several axes ships every tree in its JSON; fine at ninety recommendations, worth one shared node table if a view ever grows to thousands

- a `broader` edge that holds both plainly and on a hierarchy axis (the same concept under the same parent, once without `axis` and once with it) is refused by the validator as a duplicate — `axis` is not an edge discriminator — although spec §4.1 lets a concept have a parent per respect; met on a throwaway assertion of `axes/region`, whose five families are the plain hierarchy's. The linking pass that asserts a hierarchy axis needs either `axis` in the edge's identity (`tools/validate.py`) or the rule that a coinciding plain edge is the axis's edge too

- codes_as: no terminology namespace is imported yet. Rule once one is, by facet — procedure → OPS, patient_state → ICD-10-GM, outcome and finding → SNOMED CT where available; first candidates concepts/pankreasresektion → ops-2026/5-52 and the codes C18/C20 in QI 1's denominator (p. 122). A concept without a code must be shown as uncoded, not as unchecked.

- evidence profiles (the per-outcome GRADE tables in evidence-based boxes) — no shape in the schema; open-questions → evidence-profiles

- gap_notice claims (boxes 4.3, 4.6, 5.10, 5.13, 7.8) are extracted and unlinked — no edge kind fits; open-questions → gap-notices

- quality indicators (chapter 9, Tabelle 7, pp. 122–124): QI 1 → statements/keine-drainage-kolorektale-resektion (box 6.9), QI 2 → keine-drainage-unkomplizierte-leberresektion (6.8), QI 3 → magensonde-entfernung-vor-narkoseausleitung-kolorektal (7.1) with a denominator also covering the -magenresektion and -leberresektion statements, QI 4 → dauerkatheter-entfernung-24h-kolorektal and dauerkatheter-verlaengert-bei-harnverhaltrisiko (7.5/7.6) narrowed to onkologische Kolonresektion; also the chapter's definition of Qualitätsindikatoren (p. 122) and the note that none is in the onkologischer Basisdatensatz; open-questions → quality-indicators

- body-text enrichment (refines/supplements/limits beyond the criterion claims), page-anchored candidates: p. 27 continue calcium antagonists for angina, pause for hypertension on the day of surgery (a recommendation outside any box); §5.7 sedierende Prämedikation has no box, its text weighs benzodiazepines case by case and names melatonin; p. 78 no recommendation on nasogastric tubes after pylorus-preserving pancreatic head resection, pancreato-gastrostomy and distal pancreatectomy; p. 79 a secondary nasogastric tube on delayed gastric emptying after liver resection; p. 84 defers balanced analgesia to the S3 guideline on acute perioperative pain; pp. 92–100 five gap notices outside boxes (methylnaltrexone p. 92, local anaesthetics p. 93, propranolol p. 94, dexmedetomidine p. 95 withheld after the 2022 Rote-Hand-Brief, laxatives p. 100, each "für andere viszeralonkologische Operationen … keine Empfehlung") and the note that alvimopan is effective but unlicensed in Germany (p. 92); p. 105 no RCT data on chewing gum after minimally invasive liver or pancreatic resection; pp. 108–109 the rationale for 7.29's EK; p. 121 "zu anderen Organ-Entitäten … keine Empfehlung" for the specialised nurse, in tension with box 8.7 and to be read with it

- cross-statement edges (specializes/complements) not yet asserted; first candidates 7.12 (TAP block, minimally invasive colorectal) and 7.13 (peripheral regional analgesia) against 7.9/7.10 (epidural)

- no pathway authored; chapter 6 is a recommendation list, not a decision algorithm; open-questions → decision-graph-derivation

- screenshot driver: `tools/screenshot.js` opens only a view page and captures only the viewport — it waits for `window.graphmed`, so an entity page (`statements/<id>/`) cannot be captured, and a sheet longer than the screen is seen only through a tall `--size`. An action or flag for an entity page and a full-page capture would let a build package show the entity page it claims to render

- theme switch while a view page is open: `tools/site/static/graph.js` reads the stylesheet's colours once, when the graph is drawn, so a change of `prefers-color-scheme` restyles the page but leaves the graph in the old theme until it is reloaded; a `matchMedia` listener that re-reads the variables and restyles the graph would follow it
- two claims of box 4.5 hold two sentences in one label (`claims/pomgat-lv-1.0/01ba1a06` carries the exception sentence that `5d24c688` also is; `3e709b29` carries "Dies sollte von Fall zu Fall entschieden werden") against the per-sentence rule (spec §3.1); a correction is one claim per sentence and an edit with history, not a rewrite — noticed while checking the body-text rule (WP-0011), outside its scope

- the canonical form and content hash (spec §2): `tools/validate.py` fixes the canonical serialisation of an entity and an edge and computes the hash — printed on request, written nowhere. Nothing consumes it yet; the judge's attestations (`subject_hash`, spec §8.1) and staleness (§5, §8) are the first consumers, so it comes before the judge tool

- the schema words the automated review needs (spec §8.1), one package with `tools/validate.py`: a value of `attestation.claim` for "a software agent read the subject against its ground and found it consistent"; the URL form of an edge as an attestation subject (open-questions → edge-address); attestation ids that do not collide across parallel branches (open-questions → attestation-identity); a role on the agent saying which claims it may make, with the validator's rule that `expert_reviewed` is never `by` a software agent; the shape of a judge run's `proof` (tool and version, model, prompt hash, properties checked, the property and finding of a dispute with `lang`)

- the judge tool (spec §8.1), `tools/judge.py`: given a diff against `main`, reads each added or changed claim against its physical page (the validator's download and cache), each statement whose evidence changed against its supporting claims, each body-text edge against §5.1, by a model behind an API key; prints the report; writes one attestation per subject under `data/attestations/`, `consistent` or `disputed`, hashes pinned. Never edits, never blocks. Its first test is the worked example in §8.1 (box 6.7 and the amylase criterion). Depends on the canonical hash and the schema words; the model and its key are open-questions → judge-provider

- the judge's agent entity, `data/agents/<judge-id>.yaml` (spec §8.1): one entity for the role, identity claims naming the tool and the workflow, no key; the model and prompt live in each attestation's proof. Lands with the tool's package or the first attestation, whichever is first

- the judge workflow, `.github/workflows/judge.yml`, handed over in the tool package's pull request for a person to commit (`.claude/rules/environment/git-identity.md`): on `pull_request`, `permissions: contents: read`, the model's key a repository secret, `tools/judge.py` on the diff, the report to the step summary, failing only when the tool cannot run. The author's own run in the sandbox needs the model's domain on the egress allowlist, like the source's

- the site shows the judge's findings (`docs/publication.md` §4): a disputed subject carries its finding on the sheet next to the property it concerns, a subject judged consistent a mark, an unjudged one nothing — read from attestations, once they exist

