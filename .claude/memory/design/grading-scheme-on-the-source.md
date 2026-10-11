---
name: grading-scheme-on-the-source
description: A claim's grade, verb, basis and consensus are its source's own words, checked against the grading scheme the source declares as data (`grading_scheme`, quoted from its pages): grades in the table's order with wording, negated form as its own pages print it, open flag and a direction where the symbol carries one; bases beside the grade (EK beside an arrow); consensus classes with bounds, or none where only shares are printed; verbs pool-wide; nothing mapped, nothing enumerated in the schema.
metadata:
  type: project
---

A source declares its grading scheme on its entity, `grading_scheme`, quoted
from its own pages: its **grades** in the order the legend follows (the
table's rows in the table's order; a grade that fixes no wording, such as EK
printed instead of a letter, after them), each with the table's description,
the **wording** it gives the grade (`verb`), that wording's **negated** form as
the source's own pages print it (in the table or in a recommendation of the
grade; `modelling` only for a form none prints), whether it is an **open**
recommendation, and, where the symbol carries the direction (an arrow up or
down), the **direction** it fixes; its **bases**, the tokens its boxes print
beside the grade or in its place for what a recommendation rests on ("EK"
beside an arrow); and its **consensus classes**, each with its bounds as
printed and, where the source prints shares, read as numbers — none where the
source prints only shares and names no class. A claim's `grade` is one of its
own source's grades as printed, its `basis` one of its bases, its `consensus`
one of its classes, its `consensus_share` the share as printed (beside the
class where the source classes shares, alone where it does not); its
`direction` is the one its grade fixes, where it fixes one; its `verb` is one
some declared scheme defines, read in its own source's scheme where that
defines it, otherwise in the schemes that do, which must read it alike. One
wording stands under several grades of a scheme only where each fixes another
direction (⇑ and ⇓ both "sollte") and they read it alike; an open grade fixes
none. The validator checks all of it, and that every word of a grade, wording,
negated form, basis or class lies in the entry's quotes — a symbol as a whole
token, never inside a longer run of symbols. The schema enumerates none of
these words.

Decided on 2026-09-24 for card #212, the second guideline (sepsis, AWMF
079-001) grading by GRADE's two levels beside the first (POMGAT, AWMF/OL A, B,
0, EK): the maintainer, for the physician, decided that a weak GRADE
recommendation reads *für* or *gegen* with "schlagen vor" as its word, so
GRADE two-level has no open grade. Where the scheme lives (on the source, as
data), class and share both, the negated form from the scheme's wording, and
pool-wide verbs are the card's leanings, taken as the agent's proposal and
awaiting confirmation at review; EK's place (last) and provenance (the source's
own count of its expert-consensus recommendations, and a box that prints the
token) were decided by the worker by the card's rule and are flagged. It also
settled the open question `verb-word-scope`: the grade names its scheme
through its source, so which grades carry their verb is computed per scheme.

Extended on 2026-10-10 for card #323, the third guideline (Vorhofflimmern,
AWMF 019-014), whose Tabelle 1 grades by arrows (⇑⇑, ⇑, ⇔, ⇓, ⇓⇓) with a
letter two rows share, prints the open grade with two wordings ("kann erwogen
werden/kann verzichtet werden"), and whose boxes print "EK" beside the arrow
and print only the share of agreement. The agent answered the maintainer's
questions on the maintainer's delegation by the card's leanings (Decisions
8–12): a `direction` on the grade; the open grade's wording the modal "kann",
each scheme declaring the against-form its own pages print — POMGAT's grade 0
then quotes "kann verzichtet werden" from its box 4.8 in place of the modelled
"kann nicht", which settled the open question `negated-open-wording`; EK
beside an arrow a basis; "Statement" in a grade cell no grade, the box's type;
a grade the text layer prints as a private character (U+F0F3 for ⇔) recorded
as the rendered page shows it, the entry's rationale naming the boxes. On
2026-10-11 the maintainer, answering the physician's questions, confirmed that
every ⇔ box reads as the open grade worded "kann" with "kann verzichtet werden"
its against-form, and that "EK" beside an arrow means consensus-based with the
strength the arrow gives.

**Why:** the first schema enumerated one guideline's vocabulary (A, B, 0, EK;
soll, sollte, kann; konsens, starker_konsens), and the second guideline's
printed values were refused or had to be mapped — a *Stark* shown as *A*, a
letter the guideline never prints — the mapping this pool forbids
([[claim-evidence-per-outcome]], [[generic-over-guidelines]]). Declaring the
scheme as data makes the next guideline ("offer", "consider") a data change,
not a schema change, and gives the build the order, the words, the negated
forms and the open rule instead of literals. A slug per claim naming its scheme
was rejected: it would have to be added to every graded claim of the first
source, or implied by a default that is itself guideline-specific. The class
alone would hide a boundary case (95 % is *Konsens* where *Starker Konsens*
begins above 95 %); the share alone would make badges incomparable. Negating
by appending "nicht" gave "schlagen vor nicht". A per-scheme verb list would
drop the printed verb from every sentence that uses another guideline's
wording. For the third guideline: the letters as grades would give a claim a
value no box prints and map a shared letter inside one scheme; arrows without
a direction would read ⇓ as an expert consensus and let a ⇓ claim be recorded
`for`; the printed phrase "kann erwogen werden" as ⇔'s wording would read four
of its five ⇔ boxes through another guideline's scheme; "⇑ EK" as a grade of
its own would split one strength over two grades no table row gives; and the
whole-word test found "⇑" inside "⇑⇑", because a symbol is no word.

**How to apply:** record `grade` and `verb` as the recommendation prints them
(the verb in the form the scheme gives it: "sollten" is `sollte`, "empfohlen"
is `empfehlen`), `direction` as the sentence reads — under a grade that fixes
one, that one, the action being what the sentence says to do ("auf
Tabakkonsum zu verzichten" under ⇑⇑ is the abstinence, `for`) —, `basis` as
the box prints it, to every sentence of the box like the consensus, a fact's
too and with no grade where the box prints none, `consensus` as the class the
source's table gives, and `consensus_share` as printed where the source prints
a share, with provenance naming the share's line and, where there is one, the
table's row. A new guideline's scheme is declared on its source, before its
claims, quoted cell by cell from its method table, a basis from the boxes that
print it and the passage that says what it means; a negated form it prints in
a recommendation is quoted from there; a form it prints nowhere is
`modelling` with a rationale, never computed. Never add a grade, verb, basis
or class to the schema, the validator or the build as a literal, never map a
value between schemes or inside one, and never form a negated verb by
appending a word. The validator does not check that a grade and a verb agree:
which grade a sentence without its box's wording carries is the rule of spec
§3.1 and §5.1.
Related: [[direction-legend]], [[box-colour-by-direction]],
[[box-granularity-per-sentence]].
