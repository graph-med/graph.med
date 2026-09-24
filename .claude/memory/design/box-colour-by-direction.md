---
name: box-colour-by-direction
description: A recommendation box on the view page is coloured by its direction (für, gegen, abwägen, Lücke — the banner's four colours) and its label begins with the glyph, the grade letter and, where the letter does not carry it in that view, the verb as a word; EK is coloured like any other and marked "EK". Not by grade, not by verb; the border carries only state.
metadata:
  type: project
---

A recommendation box takes the colour of its **direction** — *für*, *gegen*,
*abwägen*, *Lücke*, the same four colours as the banner at the top of its details —
and shows its **grade as a letter** after the direction glyph (A · B · 0 · EK, the
guideline's own scale). An EK box is coloured by its direction like every other
recommendation and carries "EK" as its grade text: marked, not demoted. The legend
explains colours as directions and letters as grades. Decided by the maintainer on
2026-09-13; applied in `docs/publication.md` §3; built by WP-0006.

**Why:** Before, colour said the grade. The physician found that unintuitive: the
colours tracked the soll/sollte/kann gradation and expert consensus at once, and a
reader confused strength with answer. Direction is what the reader asks first
("what should I do?"), and colour is the fastest channel a box has, so the first
question gets it; strength is a lookup detail and one letter is enough. Most
recommendations are *für*, so under this rule the tree is mostly one colour and the
*gegen* and *abwägen* boxes stand out — the exceptions are where the reader must
slow down, which colour by grade never showed. Colour and glyph now encode the same
thing, which is the redundancy a reader who does not see the colour needs. Colour
by verb (soll, sollte, kann) was rejected as colour by grade in disguise: under the
AWMF scheme A↔soll, B↔sollte, 0↔kann, with EK the odd one out. Keeping the grade
colours with a larger glyph was rejected because it leaves the reported confusion
in place.

**The stamp, and the border (2026-09-21, WP-0037).** The glyph stands in the
box, before the letter: `✗ EK soll nicht · Keine präoperative Haarentfernung`.
Under red-green deficiency the *für* and *gegen* fills are one colour (simulated
contrast 1.06:1), so colour alone cannot carry the direction; `⚖` carries U+FE0E
so that it is never a colour emoji (settled 2026-09-24), and the font stack names
text faces that have it — the selector alone did not stop Chromium's fallback. The verb is written as a
word only where the grade letter does not determine it: the build reads, per
view, which verbs the supporting claims say under each letter, and writes none
for a letter with exactly one — in the first view A is always *soll*, B *sollte*,
0 *kann*, while EK, a consensus mode and not an evidence grade, splits three
ways. The word carries its negation (*soll nicht*), as the judgement does. The
verb border it replaces (a solid rim for *soll*) was dropped: it drew in the
fill's own hue, encoded by absence (no border meant *sollte*, *kann* or
disagreement alike), shared the border with contested and the selection, and was
sub-pixel at phone zoom. The border now means state alone.

**How to apply:** The box and the banner share the direction colours; change one
and the other follows. Für and gegen are the banner's hues, not a traffic light,
and every box colour is light enough for dark text in both themes. Never move
the grade back into colour; if a new grade scale arrives, it is a new letter. Never
declare which letters imply which verb — compute it from the view — and never give
the border a meaning beyond state.
Related: [[direction-legend]] derives the direction; [[view-page-is-a-decision-tree]]
fixes the tree this colours.
