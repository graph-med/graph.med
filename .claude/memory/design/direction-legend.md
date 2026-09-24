---
name: direction-legend
description: The site's four-word direction (für, gegen, abwägen, Lücke) derives from claims read in their source's grading scheme: the wording of an open grade → abwägen with a lean, any other recommendation by its direction, gap notices → Lücke, facts none.
metadata:
  type: project
---

A statement's direction on the site is derived at build time from its supporting
claims, each read in the grading scheme its source declares
([[grading-scheme-on-the-source]]): a claim whose verb is the wording of a grade
the scheme marks `open` → *abwägen*, with the lean "eher für" or "eher gegen"
shown beside it; any other recommendation → *für* with `direction: for`, *gegen*
with `against`; `kind: gap_notice` → *Lücke*; disagreeing directions →
*abwägen*; a fact has no direction. In the AWMF scheme the open grade is 0,
worded `kann`, so `soll`/`sollte` read für or gegen and `kann` abwägen; in the
two-level GRADE scheme no grade is open, so `empfehlen` and `schlagen vor` both
read für or gegen. A verb another guideline's scheme defines (a *sollte* in a
GRADE guideline) is read in that scheme. The verbs beside the word are the claims'
own, an against claim's in the negated form its scheme prints ("soll nicht",
"schlagen nicht vor"), never the verb with "nicht" appended. Decided 2026-09-10
in chunk `site-labels-panel` of pass 2 for `kann`; read from the scheme since
2026-09-24 (#212, #214); applied in `docs/publication.md` §3 and `tools/build.py`
(`direction_of`, `Pool.claim_view`).

**Why:** The physician asked for a four-word legend and for "Zeitpunkt" to leave
the direction axis. The open question was whether mapping `kann` to *abwägen*
conflates strength with conditionality. Against the ninety statements it does
not: in the AWMF grading scheme "kann" (grade 0, "offene Empfehlung") *is* the
guideline's own third category, thirty statements rest on it, and no statement
had claims disagreeing in direction, so the alternatives (abwägen only on
disagreement, or dropping it) would have left the physician's category empty.
The lean keeps "kann verzichtet werden" distinguishable from "kann erwogen
werden" without inventing a fifth word. The second guideline's weak GRADE
recommendation ("Wir schlagen vor") is no such category: its table gives it an
arrow up or down, and the maintainer, for the physician, decided it reads für or
gegen (2026-09-24). So *abwägen* belongs to whatever grade a scheme itself calls
open — a literal `kann` in the build would have read a sepsis box worded "kann
NICHT empfohlen werden" as abwägen although the guideline advises against.

**How to apply:** Never store a direction on a statement; derive it. Never name a
verb in the build: which wording is open, and its negated form, come from the
source's `grading_scheme`. Keep the four words and glyphs (✓ ✗ ⚖ ∅; `⚖` with U+FE0E
and text faces in the font stack, so that it is text and never an emoji); the glyph
stands on the box, in the judgement and in the legend, which lists only the
directions the view has ([[page-chrome-in-the-view-layer]]). Timing stays in the
label. When gap notices are linked to statements (open question gap-notices),
*Lücke* starts to appear without a build change. Related: [[box-colour-by-direction]]
— the box takes the direction's colour, strength is the grade beside the glyph and,
where the grade does not carry it, the verb as a word; [[grade-derivation]] is
still open and unaffected.
