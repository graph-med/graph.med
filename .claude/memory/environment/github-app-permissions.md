---
name: github-app-permissions
description: What the GitHub App may do beyond git — organisation projects and issues, read and write — and how a 403 "Resource not accessible by integration" names the permission that is missing.
metadata:
  type: project
---

The App that authenticates the agent holds, besides its repository permissions
for code and pull requests, **organisation permission Projects: read and
write** and **repository permission Issues: read and write** (granted
2026-09-19, so that the agent can work the planning board and comment on
issues). It cannot be added to a team or as a project collaborator: a bot is
not a user account, and reaches a project only through the installation's
permissions.

**Why:** an organisation-owned project (every Projects-v2 board, also one
created from a repository's Projects tab) is governed by the organisation
permission, not by the repository one; and commenting on or editing an issue
needs Issues: write, which pull-request write does not cover. Each was found
by a refused call.

**How to apply:** `Resource not accessible by integration` (HTTP 403) means a
permission is missing from the token in use. Read the
`X-Accepted-Github-Permissions` header of the refusal (`gh api -i`, or
`tools/board.py` prints it): it names what the endpoint accepts, e.g.
`organization_projects=write` or `issues=write`. Three things have to be true
in order: the permission is set on the App, the change is accepted on the
installation, and the token was minted after that — a token minted earlier
keeps its old permissions until it expires. Report which of the three is
missing as far as it can be seen; never substitute a credential
([[credential-handling]]).
