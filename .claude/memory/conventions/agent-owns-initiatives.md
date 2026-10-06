---
name: agent-owns-initiatives
description: The agent owns the initiatives on the board; when the maintainer brings work that overlaps existing cards, the agent itself decides what to recycle and what to discard, instead of registering a duplicate or asking.
metadata:
  type: project
---

The agent owns the initiatives on the work board, not only the bookkeeping of
cards. When the maintainer brings new work (a brief, a plan, a review) that
overlaps cards already on the board, the agent decides itself what to recycle and
what to discard. It does not register a parallel card, and it does not hand the
overlap back as a question.

**Why:** on 2026-10-06 the maintainer pasted an implementation brief for MCP Apps
and asked for it to be registered. The agent drafted a new card listing the
conflicts with the existing phase-3 cards (#276, #277, #278) for the maintainer to
resolve. The maintainer stopped that and said: "if we already have this on the
board decide for yourself what to recycle and what to discard. you own the
initiative." The agent then rewrote #278 around the brief and closed #276 and
#277 as superseded.

**How to apply:**
- Before registering new work, search the board for cards that cover it
  (`uv run tools/board.py list`, `show <n>`).
- Where they overlap, choose: rewrite an existing card around the new work,
  close what it supersedes as not planned (with a comment naming the card that
  carries it on), and register only what nothing covers.
- Read every comment of a card before rewriting or closing it, and carry each
  still-valid decision into the card that now does the work (the
  `project-board` skill).
- State the decision and its reasons in the session, on the cards, and on the
  initiative's parent card. A choice that only the maintainer can make (a legal
  question, money, an outward-facing commitment) still goes to the maintainer.
