# Edges: notes of the former part files

The notes the former file of each part carried at its head, kept as they were when
the pool became an Open Knowledge Format bundle (ADR-0011, #438). Each entry now is a
file of its own, the comments that stood before it at the head of its frontmatter.
This file has no frontmatter, so OKF reads it as no concept.

## `pomgat-lv-1.0/broader-edges`

broader edges (spec §5): "is a special case of", between uncoded concepts, all modelling with a
rationale. They group and fold; nothing is inherited along them. Written in chunk broader-edges of pass 2.
Only what holds whatever guideline one reads: what holds only inside this guideline's scope, and a
situation after an operation, are scope edges (scope-edges.yaml, spec §5 `in_scope_of`; WP-0031).

## `pomgat-lv-1.0/defined-by-edges`

defined_by edges (spec §3.2, §5): a derived concept → the criterion or definition claim that gives
its rule, all modelling, the rationale naming the term as printed and the clause that gives the rule.
One edge per concept, to the claim at the top of its rule; several rules combine there as the page prints them
(`combination`, spec §3.1), never by a second edge. Written by #192, one edge each since #204.

## `pomgat-lv-1.0/scope-edges`

scope edges (spec §5 `in_scope_of`): "counts, within the scope of this guideline, as a case of" —
what the guideline stipulates for its own scope and `broader` cannot hold, because it is not true
whatever guideline one reads. All modelling with a rationale; `condition` names the circumstance under
which the membership holds, its absence means unconditional. They form the scope tree of
views/pomgat-lv-1.0, which ends in its scope_root, the guideline's patient target group (2.1.2, p. 17).
Written by WP-0031 (card #190); nine of them were broader edges until then.

## `sepsis-lf-4.0/broader-edges`

broader edges (spec §5): "is a special case of", between concepts that fill a population or condition slot of a
statement in views/sepsis-lf-4.0, all modelling with a rationale, only what holds whatever guideline one reads —
what holds only inside the guideline's scope is a scope edge (scope-edges.yaml). They group and fold; nothing is
inherited along them. Written by card #228 where the view's first axis (axes/sepsis-population) needs an edge and
the pool lacks it: a form or a severity under the disease it is a special case of. The ARDS family and ARDS under
the acute respiratory insufficiency are card #223's, in ch05.yaml, and are reused, not repeated here; the families
of concepts that fill no population or condition slot are card #227's, in cross-chapter.yaml. No broader edge runs
from a concept the first source uses.

## `sepsis-lf-4.0/ch02`

Edges minted with chapter 2 of sources/sepsis-lf-4.0 (card #218), all modelling: the supports edges of its
box sentences, the defined_by edges #217's ledger gives this card, the body-text edges of spec §5.1 (the
rationale names the clause and the term as printed), and the cross-statement edges within the chapter.

## `sepsis-lf-4.0/ch03a`

Edges minted with the claims of sections 3.1-3.3 of sources/sepsis-lf-4.0 (card #219): each box claim
supports its statement (spec §3.1), each body-text claim carries the edge spec §5.1 gives it (the
gap notice on p. 43 none), and the statements of one box, or of 3.4 and 3.5, are related (§5.1 N1).
No defined_by edge: the part's condition concepts are stated (#213 checklist, #217 ledger).

## `sepsis-lf-4.0/ch03b`

Edges minted with the claims of sources/sepsis-lf-4.0, sections 3.4–3.5 (pp. 51–56), card #221:
supports from the box claims (spec §3.1), the body-text relations (spec §5.1), and the edges between
the statements of these sections. No defined_by edge: #217's ledger assigns none to this part, and
no concept minted here is established by a rule.

## `sepsis-lf-4.0/ch04`

Edges minted with chapter 4 of sources/sepsis-lf-4.0 (card #222): the box claims' supports, the body-text
relations of spec §5.1 (the clause that decided each edge and the term as printed, in the rationale), and the
relations between the chapter's statements. No defined_by: the chapter prints no rule for a concept it mints. Card
#296 replaced 4.6 → 4.5's `complements` by the sequence edge `follows` (spec §5).
evidence — each box sentence of recommendation form supports its own statement; 4.7 and 4.11's second
sentence are gap notices and stay unlinked

## `sepsis-lf-4.0/ch05`

Edges of chapter 5 „Beatmungstherapie“ of sources/sepsis-lf-4.0 (card #223), all modelling: each box sentence's
supports edge; the body-text relations of spec §5.1; the defined_by edges of the two ARDS severities whose rule
the chapter prints, and of the three concepts whose rule a box sentence prints (#355); the ARDS family's broader
edges within the chapter; and the cross-statement edges between boxes of the chapter (§5.1 N1).

## `sepsis-lf-4.0/ch06`

Edges of card #224 (chapter 6 of sources/sepsis-lf-4.0): the supports edges of the box claims, the body-text
edges of spec §5.1 (rationale: the clause and the term as printed), the two defined_by edges #217's ledger
assigns to #224, and the cross-statement edges within the chapter (§5.1 N1). All modelling.
evidence: each box sentence of recommendation form supports its statement

## `sepsis-lf-4.0/ch07`

Edges of card #225 from chapter 7 of sources/sepsis-lf-4.0 (pp. 103–104), all modelling.
evidence (spec §3.1): the claim of box 7.1 supports its statement

## `sepsis-lf-4.0/ch08`

Edges of card #225 from chapter 8 of sources/sepsis-lf-4.0 (pp. 105–126), all modelling; card #355 added the
edges of the rules printed inside the sentences of 8.2, 8.4 and 8.13, and of 8.3's „sondern“ half.
evidence (spec §3.1): each recommendation-form box sentence supports its own statement; 8.1's Bemerkung 1 (the
dose) supports 8.1's. The gap notices 8.7 and 8.8, 8.1's Bemerkung 2 (a definition) and the body text support none

## `sepsis-lf-4.0/ch09`

Edges minted with chapter 9 of sources/sepsis-lf-4.0 (card #226), all modelling: the supports edges of its
box sentences, the body-text edges of spec §5.1 (the rationale names the clause and the term as printed), and
the cross-statement edges within the chapter. No defined_by: #217's ledger gives this card none, and no concept
of these pages is established by a rule.

## `sepsis-lf-4.0/ch10`

Edges minted with chapter 10 of sources/sepsis-lf-4.0 (card #226), all modelling: the supports edges of its
box sentences (10.4's one claim supports the three statements of its three coordinated actions, hard case 4),
the body-text edges of spec §5.1 (the rationale names the clause and the term as printed), and the
cross-statement edges within the chapter. No defined_by: #217's ledger gives this card none, and no concept
of these pages is established by a rule.

## `sepsis-lf-4.0/cross-chapter`

Edges between statements or concepts of two chapters of sources/sepsis-lf-4.0 (card #227), all modelling: what a
chapter part could not see, asserted once after all of them (card #210, Decision 6). Two kinds:
  - cross-statement semantics (spec §5), statement → statement, each rationale naming both boxes — card #296 added
    the sequence edges `follows` of box 8.1;
  - subsumption (spec §5 `broader`), the families across chapters of concepts that fill no population or condition
    slot of a statement in views/sepsis-lf-4.0 (those that do are card #228's, in broader-edges.yaml).
No `broader` edge runs from a concept the first source also uses (open question scope-edge-pinning); one into
concepts/mortalitaet, which both sources use, is allowed (card #217). Nothing is inherited along `broader`.

## `sepsis-lf-4.0/scope-edges`

scope edges (spec §5 `in_scope_of`): "counts, within the scope of this guideline, as a case of" — what the
guideline stipulates for its own scope and `broader` cannot hold, because it is not true whatever guideline
one reads. All modelling with a rationale; `condition` names the circumstance under which the membership
holds, its absence means unconditional. They form the scope tree of views/sepsis-lf-4.0, which ends in its
scope_root, the guideline's patient target group (1.3, p. 20; 1.1, p. 19: adults, >18 Jahre). Card #228.

Every edge into the root is a scope edge, never broader: the root's patients are adults, and that holds only
inside the guideline (card #217). No scope edge runs from a concept the first source uses.

## `vorhofflimmern-lf-1.1/broader-edges`

broader edges (spec §5): "is a special case of", between concepts that fill a population slot of a statement in
views/vorhofflimmern-lf-1.1 or name a form above one, all modelling with a rationale, only what holds whatever
guideline one reads — what holds only inside the guideline's scope is a scope edge (scope-edges.yaml). They group
and fold; nothing is inherited along them. Written by card #393 (#314's part X2) where the view's first axis
(axes/vorhofflimmern-population) needs an edge and the pool lacks it, one per placement and no other: the five
forms of Tabelle 3 (p. 14) under the scope root, the four groups that narrow a form by a state, an indication or a
duration under that form, perioperative AF as a family of its own named by its trigger and postoperative new-onset
AF under it, three groups under the narrowest concept they are a case of (strong obesity, the two heart-failure
groups, chronic kidney disease), and the two groups whose own label prints AF under the root. The families of
concepts that fill no population or condition slot are card #394's, in cross-chapter.yaml. No broader edge runs
from a concept another source uses.

## `vorhofflimmern-lf-1.1/ch01`

Edges of card #380 (#314's part C1) from chapter 1 of sources/vorhofflimmern-lf-1.1 (pp. 11–14), all modelling. The
chapter holds no box: its definitions and criteria carry no body-text edge, E's included (spec §5.1 G1). Edges across
parts are X1's, the scope and hierarchy edges X2's (#314 Decision 6).

## `vorhofflimmern-lf-1.1/ch02`

Edges of card #380 (#314's part C1) from chapter 2 of sources/vorhofflimmern-lf-1.1 (pp. 16–22), all modelling. Edges
across parts are X1's, the scope and hierarchy edges X2's (#314 Decision 6).

## `vorhofflimmern-lf-1.1/ch03`

Edges of card #380 (#314's part C1) from chapter 3 of sources/vorhofflimmern-lf-1.1 (pp. 24–26), all modelling. Edges
across parts are X1's, the scope and hierarchy edges X2's, the condition „bei Vorhofflimmern“ of 3.1's and 3.2's
groups among them (#314 Decision 6).

## `vorhofflimmern-lf-1.1/ch04`

Edges of card #376 (#314's part C2) from chapter 4 of sources/vorhofflimmern-lf-1.1 (pp. 28–36), all modelling. Edges
across parts are X1's — §8.10's restatement of 4.1 and §8.9's of 4.9 (p. 90), the cross-references to chapters 3 and
8 (p. 28, l. 15–16; p. 31, l. 9) —, the scope and hierarchy edges X2's (#314 Decision 6).
evidence (spec §3.1): each box sentence of recommendation form supports a statement per action it instructs — 4.1's
one claim two (#376 Decision 3); the four sentences of the statement boxes 4.7 and 4.8 and the body text support none

After its last entry:

sequences (spec §5 `follows`; #294, #295; #376 Decision 13): none within chapter 4, each candidate read by the four
tests and named in the pull request — 4.1's ask → its counselling (one sentence, no outcome of the ask triggers the
counselling); 4.1 → 4.2 and 4.3 (their groups are states worded without reference to a measure: test 2); 4.5 S1 → S2
(no outcome of the counselling triggers the advice); 4.9 → Tabelle 7 (a deferral, §5.1 N4). Abb. 2's path is never
read for an edge (memory figures-without-text).

## `vorhofflimmern-lf-1.1/ch05`

Edges of card #365 (#314's part C3, the pilot) from chapter 5 of sources/vorhofflimmern-lf-1.1 (pp. 37–45), all
modelling. Edges across parts are X1's, the scope and hierarchy edges X2's (#314 Decision 6).
evidence (spec §3.1): each box sentence of recommendation form supports a statement of its own; the narrower
claims of 5.4 (one per bound) and the body text support none

## `vorhofflimmern-lf-1.1/ch06a`

Edges of card #381 (#314's part C4) from sections 6.1–6.5 of sources/vorhofflimmern-lf-1.1 (pp. 47–60), all
modelling. Edges across parts are X1's, the scope and hierarchy edges X2's (#314 Decision 6).

## `vorhofflimmern-lf-1.1/ch06b`

Edges of card #378 (#314's part C5) from sections 6.6–6.8 of sources/vorhofflimmern-lf-1.1 (pp. 61–66), all modelling.
Edges across parts are X1's, the scope and hierarchy edges X2's (#314 Decision 6).
evidence (spec §3.1): each box sentence of recommendation form supports a statement of its own, and the facts of
6.14 and 6.16 the statement of the sentence they restrict or give the reason for; the narrower claim of 6.14 and
the body text support none

## `vorhofflimmern-lf-1.1/ch07`

Edges of card #377 (#314's part C6) from chapter 7 of sources/vorhofflimmern-lf-1.1 (pp. 70–77), all modelling. Edges
across parts are X1's, the scope and hierarchy edges X2's (#314 Decision 6).
evidence (spec §3.1): each box sentence of recommendation form supports a statement of its own, 7.2's sentence two (one
per action, card #377 Decision 3); 7.4's narrower claim, Tabelle 15's rows and the body text support none

## `vorhofflimmern-lf-1.1/ch08a`

Edges of card #382 (#314's part C7a) from chapter 8 of sources/vorhofflimmern-lf-1.1, sections 8.1–8.6 (pp. 78–86),
all modelling. Edges across parts are X1's (the OAK family across C3, C5 and C7; E edges leaving these pages;
sequence chains across parts), the scope and hierarchy edges X2's (#314 Decision 6). The claims of §§8.3–8.5.2 and
p. 84, l. 6–7 are §5.1 U claims: no edge, no statement, except where a disagreement joins them (D).

## `vorhofflimmern-lf-1.1/ch08b`

Edges of card #383 (#314's part C7b) from chapter 8 of sources/vorhofflimmern-lf-1.1, sections 8.7–8.10 (pp. 86–90),
all modelling. Edges across parts are X1's (8.5 → 5.3, 5.4; 8.7 → 4.9; 8.6 → 6.5, 6.6, 6.10, 6.11; 5.10 ↔ 8.4, 8.5;
6.12 ↔ 8.4), the scope and hierarchy edges X2's (#314 Decision 6). No sequence edge within these pages: 8.4 → 8.5 is
none, postoperatively new AF being the patients' state, not the outcome of 8.4's measure (spec §5, test 1; #383
reading 12).
evidence (spec §3.1): each box sentence of recommendation form supports a statement of its own; 8.6's narrower claim,
the caption's claim and the body text support none

## `vorhofflimmern-lf-1.1/cross-chapter`

Edges between claims, concepts or statements of two parts of sources/vorhofflimmern-lf-1.1 (card #394, #314's part
X1), all modelling: what no chapter part could write, since none saw another's pages (#314 Decision 6), asserted once
after all of them. Five groups:
  - the second printings (spec §5 `defined_by`; #341): a rule two parts print differently, the concept reaching each
    printing by a defined_by edge of its own, every pair of printings joined by disagrees_with, none chosen;
  - E (spec §5.1 E): a definition the source marks for its term as such, to another part's claims using the term;
  - disagreement (spec §5, §5.1 D): places of two parts that answer one question otherwise;
  - statement edges (spec §5 `specializes`, `complements`, `follows`), each read by the four tests of spec §5, one
    edge per pair of statements, each rationale naming both boxes;
  - subsumption (spec §5 `broader`): the families across parts of concepts that fill no population or condition slot
    of a statement in views/vorhofflimmern-lf-1.1 (those that do are card #393's, in broader-edges.yaml and
    scope-edges.yaml).
Edges into concepts/mortalitaet and concepts/blutungsrate, which other sources use, are allowed; none leaves a reused
concept (#314 Decision 9; open question scope-edge-pinning). Nothing is inherited along `broader`. No figure gives an
edge here: Abb. 1, 2 and 4 are postponed (#327 question 4), Abb. 3's rows for 6.10 and 6.11 only leave words out,
and no figure is read for `follows` (#394 Decisions 4–6).

## `vorhofflimmern-lf-1.1/scope-edges`

scope edges (spec §5 `in_scope_of`): "counts, within the scope of this guideline, as a case of" — what the
guideline stipulates for its own scope and `broader` cannot hold, because it is not true whatever guideline one
reads. All modelling with a rationale; `condition` names the circumstance under which the membership holds, its
absence means unconditional. With broader-edges.yaml they form the scope tree of views/vorhofflimmern-lf-1.1,
which ends in its scope_root, the patients with AF whose care the guideline means to optimise (Zielsetzung,
p. 10, l. 55–57). Card #393 (#314's part X2), one edge per placement of axes/vorhofflimmern-population and no
other. No scope edge runs from a concept another source uses.
