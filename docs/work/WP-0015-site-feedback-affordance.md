---
id: WP-0015
title: A "suggest a change" link opening a prefilled issue
status: claimed
created: 2026-09-12
updated: 2026-09-14
depends_on: [WP-0005]
blocks: []
owner: agent
initiative: review
kind: build
slug: site-feedback-affordance
---

## Outcome

Every statement's detail section (and entity page) has one link, "suggest a
change", that opens a new issue in the repository prefilled with the statement
id, the source, box number and page, and a short form asking what should differ
and why. Nothing is stored on the site; the issue is the proposal, a person
triages it, and an agent's package can act on it. An issue template under
`.github/ISSUE_TEMPLATE/` carries the form.

## Scope

In: `tools/site/templates/details.html`, `tools/build.py` for the prefilled
URL, `.github/ISSUE_TEMPLATE/suggest-a-change.md` (an issue template is not a
workflow file; still name it in the PR as a change under `.github/`),
`docs/publication.md` §3.
Out: accounts, comments, anything that writes to the pool.

## Constraints

No third-party request from the page; the link is a plain GitHub URL. No
personal information in the template (`.claude/rules/conventions/
no-personal-information.md`).

## Decisions

None yet. Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

## Open questions

None.

## Verification

Browser capture of the link in the section; the prefilled issue opened once by
hand and closed, its number in the PR. Build passes.
