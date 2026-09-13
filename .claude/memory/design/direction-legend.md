---
name: direction-legend
description: The site's four-word direction (für, gegen, abwägen, Lücke) derives from claims: soll/sollte by direction, kann → abwägen with a lean, gap notices → Lücke, facts none.
metadata:
  type: project
---

A statement's direction on the site is derived at build time from its supporting
claims: `soll`/`sollte` with `direction: for` → *für*, with `against` → *gegen*;
`kann` → *abwägen*, with the lean "eher für" or "eher gegen" shown beside it;
`kind: gap_notice` → *Lücke*; disagreeing directions → *abwägen*; a fact has no
direction. Decided 2026-09-10 in chunk `site-labels-panel` of pass 2; applied in
`docs/publication.md` §3 and `tools/build.py` (`direction_of`).

**Why:** The physician asked for a four-word legend and for "Zeitpunkt" to leave
the direction axis. The open question was whether mapping `kann` to *abwägen*
conflates strength with conditionality. Against the ninety statements it does
not: in the AWMF grading scheme "kann" (grade 0, "offene Empfehlung") *is* the
guideline's own third category, thirty statements rest on it, and no statement
had claims disagreeing in direction, so the alternatives (abwägen only on
disagreement, or dropping it) would have left the physician's category empty.
The lean keeps "kann verzichtet werden" distinguishable from "kann erwogen
werden" without inventing a fifth word.

**How to apply:** Never store a direction on a statement; derive it. Keep the
four words and glyphs (✓ ✗ ⚖ ∅); timing stays in the label. When gap notices
are linked to statements (open question gap-notices), *Lücke* starts to appear
without a build change. Related: [[box-colour-by-direction]] — the box takes
the direction's colour, strength is the grade letter beside the glyph;
[[grade-derivation]] is still open and unaffected.
