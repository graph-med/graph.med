---
name: claim-evidence-per-outcome
description: A claim carries how certain its evidence is as `evidence`, a list of {outcome?, key?, value?, system}, one entry per printed row, and per endpoint where a row names several, in the rating system's own words, each entry stating an outcome or a value. A row keyed by anything but an endpoint (component, subgroup, arm, comparator, device, regimen) keeps its printed `key`, never an outcome, several names under one rating one key joined by ", "; values as printed, compared without regard to case; never a scalar, never mapped between systems, never reduced to one; a box's rows go to each of its sentences with a statement of its own.
metadata:
  type: project
---

How certain the evidence behind a recommendation is lives on the claim as
`evidence`: a list, one entry per row the source prints and per endpoint
where a row names several, in its order, each entry the rating in the words
of the system that made it (`value`, `system`), the `outcome` concept it
applies to where the row names an endpoint, and the row's `key` as printed
where the row names anything else — a component of the action, a subgroup, an
arm, a comparator, a device, a regimen. A row naming both (an endpoint for a
device, an endpoint under a comparison) carries both; an endpoint's own time
frame or setting is part of the endpoint, not a key. A row that rates several
names under one rating — agents, comparators, anything but an endpoint — is
one entry whose key lists the names the rating covers, as printed and in
printed order, joined by ", ", without the effect data between them; a row
that rates several endpoints under one rating is one entry per endpoint, in
printed order, each with the row's value and system and, as its key, the
names the row prints for that endpoint. A source that states one certainty
for the whole recommendation gives a one-entry list without `outcome` or
`key`. An outcome the source lists without a rating is an entry with
`outcome` and `system` and no `value`; every entry states an outcome or a
value. Absent or empty means "not recorded". Neither `system`, `value` nor
`key` is an enum, and the list is the only shape — no scalar, no
scalar-or-list alternative. Its provenance is `required`, like `grade` and
`consensus`: one quote per entry, the line printing its key or outcome (for
an endpoint of a row that names several, the line printing that endpoint).
Decided by the maintainer on 2026-09-17 when registering WP-0023: the second
option of the former `evidence-profiles` open question, narrowed to the
rating and its outcome; in the schema since 0.6.0. `value` became optional in
0.7.0, decided by the maintainer on 2026-09-23 (card #102). `key` came in
0.14.0 (card #215, 2026-09-24), when the second guideline printed rows keyed
by component, subgroup, arm, comparator, device and regimen: the card's
leanings, taken as the agent's proposal and awaiting the maintainer's
confirmation at review. Rows that rate several names or several endpoints
under one rating came with card #261 (2026-10-10), its Decisions 1–2:
answered by the agent on the maintainer's delegation, by the card's leanings,
and awaiting the maintainer's confirmation at review.

**Why:** two rules make the field safe, and both are about not inventing a
value. A value is never mapped between systems: the ESC evidence levels
(A/B/C) and GRADE's four words have no correspondence that would not be made
up, so an unknown system is a valid state a consumer shows as it is
([[generic-over-guidelines]]: no guideline's vocabulary is privileged).
Several entries are never reduced to one: POMGAT rates per outcome under a
box, and a single summary certainty would be a value the guideline never
stated — `docs/publication.md` §3, grades are shown, never composed. A
scalar-or-list schema would reintroduce exactly the ambiguity the list
removes. The third option — each outcome row its own `fact` claim with a
`refines` edge — was not taken: it multiplies claims roughly fivefold per box
and puts the certainty a step away from the recommendation the card has to
show it beside. The key is a printed string, not typed qualifiers
(`comparator`, `subgroup`, `arm` as concepts): a list of row kinds is a
vocabulary the next source breaks, and minting the row label as the outcome
put "Sepsis-Screening" under the column *Endpunkt* and made three devices
rated alike for one endpoint one entry, which the list refuses. The value is
as printed ("Moderat") because the case is the print's, not a second level;
the build's display order compares without regard to case, and the older
lower-case values stay. A row that names several agents stays one entry so
that the count the card shows is the page's and the key tells the reader
what each rating covers: an entry per name would turn one printed row into
many, and the row's lead-in as its key would hide the names. A row that
names several endpoints becomes one entry per endpoint, not one keyed entry
without an endpoint, so that every endpoint stays an `outcome` the validator
holds to its facet and quote i stays paired with entry i.

**How to apply:** extract the rating as the source words it, one entry per
row, and per endpoint where a row names several. Record an endpoint as
`outcome` (a concept of facet `outcome`, which the validator checks) and
anything else the row names as `key`, as printed, line breaks and
end-of-line hyphens joined, its reference marks left out as a label's are
([[reference-marks-left-out]], spec §3.1). Where a row
rates several names under one rating, its key is those names joined by ", "
— the one place a key joins words the page prints apart —, leaving out the
effect data between them and a name the row mentions only to say that
nothing reports on it; where it rates several endpoints, write one entry per
endpoint, each quoting the line that prints its endpoint. Never mint a
component, subgroup or comparator as an outcome. An entry without `outcome`
and `key` only where the source rates the recommendation as a whole; a bare
level whose system only the method section names ("Evidenzgrad: 1") quotes
that section's line after the box's. Where word and symbols disagree, record
the word and name the disagreement in the pull request. A box's rows go to
every sentence of it that supports a statement of its own, all of them, in
the source's order — two sentences of opposite direction under rows keyed by
arm each carry both — and to no sentence that supports another's statement
or none, which would show each row twice. An outcome the source lists with an
empty certainty cell is recorded as the outcome alone, never dropped:
dropping it would shrink the count the card shows (`3 von 5 Endpunkten
erfasst`) without saying so. Its `system` is the system of the table that
lists it. Never add an enum of systems, values or row kinds, or a mapping
table, to the schema, the validator or the build; a renderer may hold a
display order per system it knows and shows an unknown one unranked. Never
compute one certainty for a claim or a statement from several entries. The
effect data under a rating (effect sizes, intervals, study counts) is not
this field. Related: [[box-granularity-per-sentence]],
[[relations-are-edges-not-fields]].
