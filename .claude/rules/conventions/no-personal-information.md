---
description: Personal information never enters a file, a path, a commit, a pull request, or a log.
---

# Personal information stays out of everything you write

Never write personal information anywhere: not into a file, a file path, a commit
message, a pull request, an issue, a comment, or a log. Personal information means
anything that identifies a person or their machine — a user name, a home-directory
path, an email address, a host name, a session or account identifier.

This is a rule about *where things go*, not only about what they say. A file whose
content is harmless is still a violation if it is written into a directory named
after someone's home path. The places where this comes up:

- **Paths you write to.** Claude Code's per-machine memory and scratch directories
  are named after the workspace's absolute path, which contains the user's home
  directory. Do not write there. Durable facts go into project memory
  (`.claude/memory/`, checked in and reviewed); temporary files go into a directory
  with a neutral path (for example under `/tmp/graph.med/`), never one derived from a
  home path.
- **Paths you mention.** Refer to files relative to the repository root. A mount
  point or an absolute path belongs in no document, commit or PR.
- **Text you paste.** Error output, shell prompts and stack traces carry paths and
  user names. Trim them before they go into a pull request.
- **Identity.** Commits and pull requests are authored by the bot
  (`environment/git-identity.md`). Never substitute a person's name or email.

**Why:** the repository is public and its history is permanent. Anything written
into it, or into a path it is later copied from, cannot be reliably taken back.
The maintainer set this rule on 2026-09-06.

**The one exception is the about page.** At the maintainer's request (2026-10-24, #433),
the site's about page (`tools/site/templates/about.html`, `graph.med/about/`) names the
people who make graph.med and carries their bios. It shows a person's photo only once the
maintainer adds one. Nothing else is exempt, and the rest of this rule still holds for that
page's own commits and pull requests.

**What not to do about the past.** Occurrences that already exist in the history
are left alone; do not rewrite history or open a clean-up on your own initiative.
The maintainer said so explicitly. The rule is for what you write from now on.
