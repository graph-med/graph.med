---
name: box-granularity-per-sentence
description: The unit of a claim is the sentence of a marked recommendation, not the box; a box with several sentences is several claims sharing its recommendation_no, every sentence whatever its form; the box's printed grade goes to its recommendation and gap-notice sentences (one per wording where it prints several, like "A/B"; a lettered part's to that part's), its consensus to every sentence, never a grade to a fact, criterion or definition; a sentence instructing two actions supports two statements, a lead-in over full-sentence items is no claim, a fact saying only what the evidence shows stays unlinked, an adapted box is read like any other; a sentence yields a narrower claim beside its own for a rule printed inside it (a criterion claim, its concept derived) and for a half a „sondern“ joins with its own case and direction, unless an arrow grade fixes the other direction, as for each member a connective joins (#328); the physician confirmed the split is clinically right.
metadata:
  type: project
---

A recommendation *box* is not the unit of a claim; a *sentence* is. A box that
holds several sentences with their own verbs and directions (POMGAT 4.1: kann /
soll / sollte nicht / soll) becomes several claims sharing the box's
`recommendation_no`. A box is therefore not automatically one node in the
graph. Decided 2026-09-11 when the physician reviewed the live site; applied in
`docs/graph-representation.md` §3.1 and throughout `data/claims/`.

Every sentence of the box is a claim, whatever its form — a remark, an
extension ("Dies gilt auch für …"), a fact, a dose, a definition, a gap notice
beside a recommendation. What the box prints once reaches them by one rule
(card #213, 2026-09-24, the agent's proposal awaiting the maintainer):

- the **grade** goes to every sentence of recommendation or gap-notice form,
  whatever its wording: a remark worded "sollte" in a box graded by another
  scheme's word carries the box's grade, since the box prints the grade for
  the box. Where the box prints one grade per wording ("A/B" over a *soll*
  and a *sollte* sentence), each sentence carries the one whose wording its
  verb is. A fact, criterion or definition carries none;
- the **consensus**, and its share, goes to every sentence;
- the **verb** is the sentence's own ([[grading-scheme-on-the-source]]).

A recommendation-form sentence supports a statement of its own; a fact or
criterion supports the statement of the sentence it extends, restricts, fills
or gives the reason for, and one of its own only where it states another action
or comparison (POMGAT 5.2's second sentence) or the box holds no recommendation
(POMGAT 7.11); a definition supports none and is reached by `defined_by`; a gap
notice stays unlinked.

Card #325 (2026-10-10 on the maintainer's delegation, ADR-0009; the
physician's questions answered by the maintainer on 2026-10-11) settled the
box forms the third guideline prints (spec §3.1):

- **Lettered parts.** A box prints part a) graded and voted on its own and
  part b) likewise. The box stays the unit — one number, the letter kept in
  each label — and each part's sentences take that part's grade, basis and
  share by the same rule as a box's; no sentence takes one from the other
  part. The maintainer read the two parts as two recommendations, two
  statements, and a part's second sentence ("Dies kann mittels … erfolgen")
  as a remark on how, which instructs in another wording, carries its part's
  grade and supports a statement of its own.
- **A lead-in over full sentences.** "… folgende Werte herangezogen werden:"
  over two items, each a full sentence with its own "soll", is no sentence of
  its own: each item is a claim labelled as printed, and the lead-in's
  qualifier ("Orientierend") stays with every item's statement and is named
  in the pull request.
- **Two actions in one sentence.** The unit stays the sentence: one claim,
  one verb, one statement per action it instructs — "befragt und … beraten
  werden" is two, a "wobei … geprüft werden sollte" clause a second. A
  predicate that says how the first action is done ("und soll sich an den
  jeweiligen Leitlinien orientieren") instructs none of its own: the
  maintainer read such a box as one recommendation.
- **Statement boxes.** In a box that holds no recommendation, a sentence whose
  subject is the evidence and that says only what it shows ("Die Daten … sind
  widersprüchlich", "Die wenigen Daten … sprechen gegen eine Assoziation …")
  is a fact that supports no statement: it asserts no action or comparison a
  statement could hold. "Aus den Studiendaten kann keine Empfehlung …
  abgeleitet werden" declines, a gap notice; "wird … nicht empfohlen, weil …"
  recommends against, its reason in the label.
- **Adapted and quoted boxes** ("Adaptierte Empfehlung", "zitiert nach …")
  are the source's marked recommendations like any other: the grade cell as
  printed, never dropped for the origin; kind line, origin and status words
  stay on the page (open question origin-and-status-labels).
- **Boxes that delegate to a figure** ("nach dem in Abb. N dargestellten
  Algorithmus vorgegangen werden") are a claim as printed; the statement's
  action is what the sentence names, its label keeping "nach Abb. N", and no
  slot holds the figure's content (spec §5.1 F, #327).

Card #328 (2026-10-10 on the maintainer's delegation, ADR-0009) settled when a
sentence yields a claim beside its own (spec §3.1), and with it the open
questions rule-claim-granularity and two-directions-in-one-sentence:

- **A rule inside a sentence.** A parenthesis or qualifier that states which
  cases a term covers — a threshold or range in parentheses („(PaO2/FiO2 <
  150 mmHg)“), a duration qualifying the group („länger als 24 Stunden“), a
  score's bound („Score von ≥2“) — is a criterion claim of its own, a
  narrower place quoting the qualifier and labelled with its words, as #204
  made each member a connective joins. It takes what the box gives every
  sentence (number, section, consensus, basis), no grade, the threshold or
  combination it prints, and supports no statement; its concept reaches it by
  `defined_by` and is derived ([[derived-concepts-defined-by]]). The
  sentence's claim and statement stay as they are. Until then such a rule
  stayed in the sentence's claim and its concept stated, which modelled one
  quantity two ways: a body-text „maschinelle Beatmung > 48 h“ as a threshold,
  a box's „länger als 24 Stunden invasiv beatmet“ as a label.
- **Two directions in one sentence.** Where „sondern“ joins two halves, each
  printed with its own case and direction (Sepsis 8.3), each is a claim with
  its own direction — the sentence's claim the half it opens with, a narrower
  place the other —, both with the box's grade, consensus and number, each
  supporting a statement. A half against the direction an arrow grade fixes
  cannot carry that grade, and stays in its sentence's claim and its
  statement's label ([[grading-scheme-on-the-source]]). What a „nur“ only
  implies (Sepsis 8.14: none without the risk factors) is not recorded: no
  quote carries it.

The card gave no leaning for the route of the rule; the agent took the first
of the entry's three — the smallest step since #204, and the only one that
makes a score's bound inside a box a threshold on the score —, which the
maintainer may overturn at review. The claims already in the pool that kept
such a rule or half in their sentence follow by a linking pass of their own,
never silently.

**Why:** a claim carries one verb and one direction by schema, and per-sentence
claims are what keep statements at the smallest independently contestable unit.
The first expert reviewer wanted the fine split — it is "fachlich sinnvoll" —
and the box stays recoverable through the shared `recommendation_no`. The
earlier wording, "the one grade its verb maps to (A↔soll, B↔sollte, 0↔kann)",
described only the first source's "A/B" boxes and fails as soon as a box's
wording is not its scheme's (an EK box saying *soll* and *kann*, a GRADE box
with an AWMF *sollte*). Reading the grade as printed for the box, and never
giving it to a sentence that recommends nothing, changes no claim of the first
source and never grades a sentence from its neighbour.

**How to apply:** extract per sentence; never merge sentences into one claim to
match the box. Give the box's grade and consensus as above, and nothing the box
does not print. Where an expert judges that a particular box should read as one
recommendation, that is a proposal about that box, made through the review and
feedback mechanism (a card on the board, once registered), not a change of the
rule. Related: [[relations-are-edges-not-fields]], [[body-text-rule]],
[[derived-concepts-defined-by]].
