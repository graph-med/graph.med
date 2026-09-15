---
id: WP-0015
title: A "suggest a change" link opening a prefilled issue
status: review
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

Append only; architectural ones go to `docs/adr/`, knowledge-model ones to `.claude/memory/design/`.

- 2026-09-14 (agent): the link reads **suggest a change**, English like the rest of
  the chrome (the headings, "copy", "json"); a trailing "opens a prefilled issue on
  GitHub" says where it leads before the reader leaves the page. It is one
  `<p class="cite">` under the sixth question in `details.html`, so the sheet and
  the entity page carry it from the one template; statements only — the fields
  are statement-shaped, a concept or claim section has no box to name.
- 2026-09-14 (agent): the form has one home, the issue template; the build reads
  it, fills its `- statement:` / `- source:` / `- box:` / `- page:` lines from the
  statement's claims (several boxes or pages joined with ", "), and passes it as
  `body` with `template=` naming the file and `title` "suggest a change: <id>". A
  build without the template stops. The template declares no labels: the
  repository's labels are not known from the sandbox, and GitHub drops an unknown
  one silently — add `labels:` to the front matter when one exists.
- 2026-09-14 (agent): the link opens in the same tab with `rel="noopener"`, as
  the source links do; the deep link brings the reader back to the box.
- 2026-09-14 (agent): the Verification's "opened once by hand" is left to the
  maintainer — `gh` answers 401 in the sandbox; the decoded URL is in the pull
  request.

## Open questions

None.

## Verification

Browser capture of the link in the section; the prefilled issue opened once by
hand and closed, its number in the PR. Build passes.
