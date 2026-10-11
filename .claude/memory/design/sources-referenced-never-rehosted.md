---
name: sources-referenced-never-rehosted
description: Source documents are never committed or rehosted; the graph links to public URLs, and agents download sources per session.
metadata:
  type: project
---

Source documents are never committed to the repository and never rehosted
anywhere under project control — no mirror, no bucket, no preservation copy.
The working model is: an agent downloads the PDF or HTML from its public URL
into the session working copy, extracts facts into the graph, and references
the public location; the repository and those links are the only assets. A
hosted, content-addressed mirror with a highlighting viewer was seriously
considered and deliberately rejected (2026-09-05).

**Why:** Two reasons, one legal and one of scope. Legally, rehosting is the
only step that needs anyone's permission: extracting facts, quoting short
verbatim passages with attribution, and deep-linking to public documents are
covered without asking (§ 51 UrhG quotation right; §§ 44b/60d UrhG
text-and-data-mining) — while AWMF/OL guideline terms require written consent
for any electronic storage, so hosting them would put the project's cleanest
asset (its licence posture) at risk for a convenience. The BfArM
classifications (ICD-10-GM, OPS, ICD-10-WHO) *could* lawfully be mirrored —
they are amtliche Werke under § 5 Abs. 2 UrhG, redistributable unmodified with
the attribution annex of the Downloadbedingungen (verified against the
2025-08-01 text) — so for them the choice is simplicity, not law. In scope
terms, the project is young: a bucket, its credentials, its curation, and a
viewer are infrastructure that would outweigh the graph itself. Revisit when
the graph data moves to its own location.

Costs accepted knowingly: no snapshot under project control (the AWMF register
removes superseded documents — a reference can go dark), and no in-app quote
highlighting (their responses carry no CORS headers, and proxying would be the
rehosting we rejected). The mitigation is the content hash on the source
entity (drift and disappearance are detected loudly) plus verification
attestations as the durable evidence once a public copy is gone.

**How to apply:** Record on each source entity the public URL and the content
hash of the downloaded bytes; its `license` holds the source's own terms
only — that it is linked and never rehosted is the project's rule, which the
site says once as page chrome beside every licence line (#254, 2026-10-10).
Never commit a downloaded source, and never
serve one from project infrastructure. Build layers emit
`<url>#page=N&search=<quote>` links — PDF.js-based viewers highlight the
quote, others land on the page. Verify quotes at extraction time, while the
downloaded copy is at hand, and record the verification as an attestation
(see `docs/open-questions.md` → quote-verification while that design is
open).
