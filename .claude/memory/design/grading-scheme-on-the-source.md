---
name: grading-scheme-on-the-source
description: A claim's grade, verb and consensus are its source's own words, checked against the grading scheme the source declares as data (`grading_scheme`, quoted from its method table): grades in the legend's order with wording, negated form and open flag, consensus classes with bounds; a printed share sits beside its class; verbs pool-wide; nothing mapped between schemes, nothing enumerated in the schema.
metadata:
  type: project
---

A source declares its grading scheme on its entity, `grading_scheme`, quoted
from its own method table: its **grades** in the order the legend follows (the
table's rows, strongest first; a grade that fixes no wording, such as EK,
after them), each with the table's description, the **wording** it gives the
grade (`verb`), that wording's **negated** form as printed, and whether it is
an **open** recommendation; and its **consensus classes**, each with its bounds
as printed and, where the source prints shares, read as numbers. A claim's
`grade` is one of its own source's grades as printed, its `consensus` one of
its own source's classes, its `consensus_share` the share as printed beside
the class where the source prints a share; its `verb` is one some declared
scheme defines, read in its own source's scheme where that defines it,
otherwise in the schemes that do, which must read it alike. The validator
checks all of it, and that every word of a grade, wording, negated form or
class lies in the entry's quotes. The schema enumerates none of these words.

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
wording.

**How to apply:** record `grade` and `verb` as the recommendation prints them
(the verb in the form the scheme gives it: "sollten" is `sollte`, "empfohlen"
is `empfehlen`), `direction` as the sentence reads, `consensus` as the class
the source's table gives, and `consensus_share` as printed where the source
prints a share, with provenance naming the share's line and the table's row.
A new guideline's scheme is declared on its source, before its claims, quoted
cell by cell from its method table; a form it prints nowhere is `modelling`
with a rationale, never computed. Never add a grade, verb or class to the
schema, the validator or the build as a literal, never map a value between
schemes, and never form a negated verb by appending a word. The validator
does not check that a grade and a verb agree: which grade a sentence without
its box's wording carries is the rule of spec §3.1 and §5.1.
Related: [[direction-legend]], [[box-colour-by-direction]],
[[box-granularity-per-sentence]].
