---
id: WP-0022
title: Statement box border shows soll vs sollte, direction glyph moves to the detail panel only
status: claimed
created: 2026-09-16
updated: 2026-09-16
depends_on: []
blocks: []
owner: agent
initiative: ui
kind: build
slug: site-statement-verb-strength-and-glyph
---

## Outcome

a. A statement box whose supporting claims are unambiguously `soll` and direction
   `für` gets a green border. `sollte` and `für` gets no border, as today. A `soll`
   and `gegen` box ("soll nicht") gets a red border; `sollte` and `gegen`
   ("sollte nicht") gets none. This holds for every statement with this verb and
   direction combination, not only `EK`-graded ones — it is most useful there,
   since `A`/`B`/`0` already differ visually by letter while `EK` does not, but the
   rule itself does not test the grade.
b. The direction glyph (✓ ✗ ⚖ ∅) no longer appears on the box, all four, not only
   the three (✓ ✗ ⚖) named first. The box reads grade letters and the short label
   only (e.g. "EK · Magensonde vor Ausleitung (kolorektal)" instead of
   "✓ EK · …"; a gap statement's box reads its short label with no leading glyph
   either). Direction stays conveyed by the box's fill colour, as it already is.
   The glyph stays exactly where it already lives independently of the box, the
   detail panel's banner (`details.html`, `direction.glyph`) and the graph's
   colour legend under it (`view.html` `.hint`), both unaffected.

## Scope

In:
- `tools/build.py`, function `hang()`: the `head` assembly drops `d["glyph"]`
  entirely (part b, all four glyphs, not a subset) and gains a new per-statement
  verb-strength value derived the same way `direction_of()` derives direction,
  passed through to the node's data (part a).
- `tools/site/static/graph.js`: two new cytoscape style rules for
  `node[type = 'statement']` selecting on the new verb-strength attribute and
  direction, one green border, one red (part a).
- `tools/site/static/site.css` (`:root` and its dark block): the two new border
  colours the rules use.
- `docs/publication.md` §3: the sentence "carries its grade as a letter after the
  direction glyph" is corrected (no glyph is on the box, in any direction), and a
  line is added for the new border rule, as WP-0006 and WP-0019 amend this
  section alongside their own build change.
- The colour legend (`.hint` in `view.html`) gets one more entry so the border's
  meaning is explained where the direction colours already are, not left for the
  reader to infer.

Out: the detail panel's banner and its glyph (`details.html`, unaffected, already
separate); the grade letters themselves (A/B/0/EK, unaffected); `kann`-verb
statements (`abwägen` direction, no border either way, `soll`/`sollte` do not
co-occur with `kann` on one claim).

## Constraints

- Only claims on the `supports` edge count, the same set `direction_of()` and the
  grade letters already use, per `docs/publication.md` "Grades are shown, never
  composed": no single verb is invented when supporting claims disagree (see
  Decisions, no statement currently disagrees, but the rule must still hold).
- The border colours must read clearly against both direction fills the rule can
  land on (`--dir-for`'s pastel green for a "soll" box, `--dir-against`'s pastel
  red/pink for a "soll nicht" box), in both themes. A colour that merely repeats
  `--dir-for`/`--dir-against` at the same saturation will not show against its
  own fill; two new, more saturated variables are expected, not a reuse of the
  direction fills.
- A future `contested` statement (`node[type = 'statement'][contested = 1]`, 3px
  dashed `var(--contested)`) keeps that border and suppresses the verb-strength
  border, per the Decision below; the selector order or specificity must
  implement that, not leave it to whichever rule happens to be declared last.
- ui initiative: `tools/build.py` and `tools/site/` only, no schema change (the
  fields this reads, `verb` and `direction`, already exist).
- Checked in a browser, desktop and phone, light and dark, with the `screenshot`
  skill: one `soll`/`für`, one `sollte`/`für`, one `soll`/`gegen`, one
  `sollte`/`gegen` statement, ideally all four at `EK` grade to match the
  motivating case, plus one `Lücke` statement to confirm it carries no glyph
  either. The pull request links the preview.

## Decisions

- 2026-09-16 (maintainer): the border is wanted on every `soll`/`sollte` box, not
  only `EK`-graded ones, even though the motivating case is telling two `EK`
  recommendations apart.
- 2026-09-16 (maintainer): the glyph is removed from the box entirely, all four
  (✓ ✗ ⚖ ∅), because direction is already colour-coded.
- 2026-09-16 (checked against `data/`): no statement currently has mixed
  `soll`/`sollte` supporting claims (0 of 87 statements with a verb), and no
  `contests` edge exists yet, so `contested` has never rendered on the live site.
  Neither case is live today. Defaults, to be revisited if either ever occurs
  rather than re-derived: a mixed-verb statement gets no border, the same way a
  mixed-direction statement gets no single glyph today; a contested statement
  keeps its dashed border and the verb-strength border is suppressed on it, so
  the rarer, more urgent signal is never the one silently dropped.

## Open questions

None.

## Verification

1. `uv run tools/validate.py` passes (no data or schema change).
2. `uv run tools/build.py` succeeds.
3. Browser, one statement of each: `soll`/`für` (green border), `sollte`/`für`
   (no border), `soll`/`gegen` (red border), `sollte`/`gegen` (no border) —
   ideally all four at grade `EK` — plus one `Lücke` statement. No box anywhere
   shows ✓, ✗, ⚖ or ∅. The detail panel's banner and the graph's colour legend
   still show their glyphs unchanged. Screenshot captures light and dark,
   desktop and phone.
