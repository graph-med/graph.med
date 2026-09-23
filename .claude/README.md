# `.claude/`

Operating instructions for coding agents working on this repository. `CLAUDE.md` at
the repository root describes the *project*, `docs/` holds its *design*
documentation, and everything here describes *how work is done* and by whom.

These files are read by the agent, not enforced by it. The constraints they describe —
branch protection, the sandbox's egress policy — are enforced by GitHub and by the
sandbox host. A rule file that drifts from what those systems actually
do is worse than none, because it gets trusted.

## Layout

| Path | What it holds |
|---|---|
| `rules/environment/` | What is true of the world an agent runs in. One `.md` per topic. |
| `rules/conventions/` | How work is done in this repository. One `.md` per topic. |
| `memory/` | Durable facts about this project, filed by level. One `.md` per fact. |
| `agents/` | Subagent definitions, one `.md` each. One so far, `judge.md`: the automated review of `docs/graph-representation.md` §8.1, read-only. |
| `skills/` | Skills, one `<skill-name>/SKILL.md` each: `handover/`, `process-next-work-package/`, `process-work-package/`, `project-board/`, `screenshot/`. |
| `settings.json` | Claude Code project settings: the plugins enabled for every session in this repository. One so far, `frontend-design`, for work on the site's look (`docs/publication.md` §6). |

The levels — environment, conventions, design — and what each owes the reader are
defined in `rules/conventions/documentation.md`. Design lives in `docs/` at the
repository root, not here.

## Rules

Every `.md` file under `rules/`, including in its subdirectories, is a rule. Whether
it loads always or conditionally is decided by one frontmatter key:

- **No `paths:` key** — the rule loads at the start of every session, like `CLAUDE.md`.
- **A `paths:` list** — the rule loads when a file matching one of the patterns comes
  into context. Patterns are matched gitignore-style against the path relative to the
  repository root, so `.claude/**` covers everything in that directory.

| Rule | `paths:` |
|---|---|
| `environment/sandbox-environment.md` | — always |
| `environment/git-identity.md` | — always |
| `conventions/contribution-workflow.md` | — always |
| `conventions/documentation.md` | `**/*.md` |
| `conventions/governed-files.md` | `.claude/**`, `.github/**`, `CLAUDE.md`, `AGENTS.md`, `CODEOWNERS` |
| `conventions/memory.md` | — always |
| `conventions/no-personal-information.md` | — always |

Three things worth knowing before adding one:

- **Frontmatter is stripped before the rule reaches the model.** `description:` is for
  the human reading the directory, not for the agent; put anything the agent needs in
  the body.
- **Loading fails silently.** A rule with an unmatched or mistyped pattern produces no
  error — it simply never appears. After adding a scoped rule, open a file it covers
  and confirm it is in context. After moving or renaming any rule, compare the rules
  loaded in a fresh session against the tree in `CLAUDE.md`.
- **A rule is read in full when it loads.** One topic per file; keep it short.
  `**/*.md` is about as broad as a scope should get.

## Memory

`memory/` records what an agent has learned about this project and cannot re-derive
from the code — why a constraint exists, what was decided against, what someone
explained once. One fact per file, filed under the level it belongs to, in the format
`rules/conventions/memory.md` sets out, indexed there.

Being checked in is the point. Claude Code also keeps a per-machine memory outside the
repository, but nobody reviews that and it does not travel. A fact here is versioned,
shared, and approved by a human before it counts — because every pull request is.

## The sandbox

Everything here is written for an agent running inside a Docker Sandbox (`sbx`): only
this repository is mounted, egress is deny-by-default, and nothing outside the
workspace survives the sandbox. `rules/environment/sandbox-environment.md` is the full
account; `README.md` at the root covers the same environment from the contributor's
side.

## Changing anything in here

Anything here is editable. Changes land the way every change does: a pull request a
human approves. Say explicitly in the description what a change permits that was not
permitted before, and do not bundle it with unrelated work. See
`rules/conventions/governed-files.md`.
