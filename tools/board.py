#!/usr/bin/env python3
"""Read and write the work board — the GitHub project of this repository's organisation,
where work is registered (the `project-board` skill; ADR-0004).

    uv run tools/board.py list [--status Todo] [--json]     # every card by column, with its number
    uv run tools/board.py show 89                           # a card's text, column and comments
    uv run tools/board.py add "Title" [--body TEXT | --body-file F] [--status Todo] [--draft]
    uv run tools/board.py link 91 [--status Todo]           # an existing issue or pull request onto the board
    uv run tools/board.py claim 89 --branch agent/2026-09-19-slug   # In Progress + a comment naming the branch
    uv run tools/board.py move 89 "In Progress"             # set the column
    uv run tools/board.py comment 89 "Text"                 # comment on the card's issue
    uv run tools/board.py comment 89 --body-file F
    uv run tools/board.py close 89 [--reason not_planned] [--keep-status]   # close the issue, move to Done
    uv run tools/board.py remove 89                         # take the card off the board (the issue stays)

A card is an issue of this repository on the board; its column is the project's
single-select field `Status` (Todo, In Progress, Done; names match case-insensitively).
Every call goes through `gh api`, which the sandbox host authenticates as the GitHub App
(`.claude/rules/environment/git-identity.md`); nothing here holds or reads a credential.
The board is found by title (`--project`, default below) in the organisation that owns
`origin`. A card is named by its issue or pull request number; a draft card, which has
no number, by its exact title. The agent writes to the board only with the maintainer's
permission — the command that names a card is permission for that card (`claim`, the
closing comment); everything else is asked for first.

A refusal `Resource not accessible by integration` (403) means the App's installation
lacks a permission for that call — GitHub names it in the `X-Accepted-Github-Permissions`
response header, which the tool prints. That is a maintainer setting, not something to
work around; `Bad credentials` (401) is the host-side token pipeline. Report either and stop.
"""


from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PROJECT = "planning-graph.med"
STATUS_FIELD = "Status"


class BoardError(Exception):
    pass


# --- GitHub calls ------------------------------------------------------------------------


def gh(*args: str, data: dict | None = None) -> dict | list | str:
    """Run `gh api` and return the parsed JSON; raise BoardError with GitHub's words on failure."""
    cmd = ["gh", "api", "-i", *args]
    if data is not None:
        cmd += ["--input", "-"]
    try:
        proc = subprocess.run(cmd, text=True, capture_output=True, input=json.dumps(data) if data is not None else None)
    except FileNotFoundError:
        raise BoardError("gh is not installed; the board is reached through the GitHub CLI only") from None
    headers, _, body = proc.stdout.partition("\n\n")
    if proc.returncode != 0:
        try:
            message = json.loads(body).get("message", body.strip())
        except (ValueError, AttributeError):
            message = body.strip() or proc.stderr.strip()
        hint = ""
        accepted = re.search(r"^x-accepted-github-permissions:\s*(.+)$", headers, re.I | re.M)
        if "not accessible by integration" in message:
            hint = "\n  the App's installation lacks a permission for this call"
            if accepted:
                hint += f" — GitHub accepts: {accepted.group(1).strip()}"
            hint += "\n  a maintainer grants it on the App and accepts it on the installation; report, do not work around"
        elif "Bad credentials" in message or "Requires authentication" in message:
            hint = "\n  no usable credential reached GitHub — host-side (memory environment/push-failure-triage.md); report and stop"
        raise BoardError(f"GitHub: {message}{hint}")
    try:
        return json.loads(body) if body.strip() else {}
    except ValueError:
        return body


def graphql(query: str, **variables) -> dict:
    result = gh("graphql", "-f", f"query={query}", *[a for k, v in variables.items() for a in ("-F" if isinstance(v, int) else "-f", f"{k}={v}")])
    if isinstance(result, dict) and result.get("errors"):
        messages = "; ".join(e.get("message", "") for e in result["errors"])
        hint = ""
        if "not accessible by integration" in messages:
            hint = "\n  the App's installation lacks a permission for this call; report, do not work around"
        raise BoardError(f"GitHub: {messages}{hint}")
    return result["data"]


# --- the repository and the project ------------------------------------------------------


def origin() -> tuple[str, str]:
    """(owner, repo) of `origin`."""
    url = subprocess.run(["git", "-C", str(ROOT), "remote", "get-url", "origin"], text=True, capture_output=True, check=True).stdout.strip()
    m = re.search(r"github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?/?$", url)
    if not m:
        raise BoardError(f"origin is not a GitHub remote: {url}")
    return m.group(1), m.group(2)


class Board:
    def __init__(self, owner: str, repo: str, project: str):
        self.owner, self.repo = owner, repo
        self.title = project
        self._load(project)

    def _load(self, project: str) -> None:
        by_number = project.isdigit()
        for kind in ("organization", "user"):
            try:
                data = graphql(
                    "query($login:String!){ %s(login:$login){ projectsV2(first:50){ nodes{ id number title url "
                    "field(name:\"%s\"){ ... on ProjectV2SingleSelectField { id options { id name } } } } } } }" % (kind, STATUS_FIELD),
                    login=self.owner,
                )
            except BoardError as e:
                if "Could not resolve" in str(e) or "not accessible" in str(e):
                    continue
                raise
            nodes = (data.get(kind) or {}).get("projectsV2", {}).get("nodes", [])
            for node in nodes:
                if (by_number and str(node["number"]) == project) or node["title"] == project:
                    self.id, self.number, self.url = node["id"], node["number"], node["url"]
                    field = node.get("field") or {}
                    self.status_field = field.get("id")
                    self.statuses = {o["name"]: o["id"] for o in field.get("options", [])}
                    if not self.status_field:
                        raise BoardError(f"project {node['title']} has no single-select field {STATUS_FIELD!r}")
                    return
        raise BoardError(f"no project {project!r} readable under {self.owner}; `gh api graphql` lists projectsV2 of the owner")

    def status_id(self, name: str) -> str:
        for option, oid in self.statuses.items():
            if option.lower() == name.lower():
                return oid
        raise BoardError(f"no column {name!r}; the board has: {', '.join(self.statuses)}")

    def items(self) -> list[dict]:
        items, cursor = [], None
        while True:
            data = graphql(
                "query($id:ID!,$after:String){ node(id:$id){ ... on ProjectV2 { items(first:100, after:$after){ "
                "pageInfo{ hasNextPage endCursor } nodes{ id type content{ "
                "... on DraftIssue { title body } "
                "... on Issue { number title url state repository{ nameWithOwner } } "
                "... on PullRequest { number title url state repository{ nameWithOwner } } } "
                "status: fieldValueByName(name:\"%s\"){ ... on ProjectV2ItemFieldSingleSelectValue { name } } } } } } }" % STATUS_FIELD,
                id=self.id, **({"after": cursor} if cursor else {}),
            )
            page = data["node"]["items"]
            for n in page["nodes"]:
                c = n.get("content") or {}
                items.append({
                    "item_id": n["id"],
                    "type": n["type"].lower(),
                    "number": c.get("number"),
                    "title": c.get("title", ""),
                    "url": c.get("url"),
                    "state": (c.get("state") or "").lower() or None,
                    "repository": (c.get("repository") or {}).get("nameWithOwner"),
                    "status": (n.get("status") or {}).get("name"),
                })
            if not page["pageInfo"]["hasNextPage"]:
                return items
            cursor = page["pageInfo"]["endCursor"]

    def find(self, ref: str) -> dict:
        """The item named by an issue/PR number (`89`, `#89`) or, for a draft, its exact title."""
        ref = ref.lstrip("#")
        for attempt in range(4):  # an item just written can take a few seconds to show up in the list
            items = self.items()
            if ref.isdigit():
                hits = [i for i in items if i["number"] == int(ref)]
            else:
                hits = [i for i in items if i["type"] == "draft_issue" and i["title"] == ref]
            if hits:
                return hits[0]
            time.sleep(2 * (attempt + 1))
        raise BoardError(f"no item {ref!r} on {self.title}; `list` shows what is there")

    def set_status(self, item_id: str, status: str) -> str:
        graphql(
            "mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){ updateProjectV2ItemFieldValue(input:{projectId:$p,itemId:$i,fieldId:$f,"
            "value:{singleSelectOptionId:$o}}){ projectV2Item{ id } } }",
            p=self.id, i=item_id, f=self.status_field, o=self.status_id(status),
        )
        return next(n for n in self.statuses if n.lower() == status.lower())

    def add_content(self, node_id: str) -> str:
        data = graphql("mutation($p:ID!,$c:ID!){ addProjectV2ItemById(input:{projectId:$p,contentId:$c}){ item{ id } } }", p=self.id, c=node_id)
        return data["addProjectV2ItemById"]["item"]["id"]

    def add_draft(self, title: str, body: str) -> str:
        data = graphql(
            "mutation($p:ID!,$t:String!,$b:String!){ addProjectV2DraftIssue(input:{projectId:$p,title:$t,body:$b}){ projectItem{ id } } }",
            p=self.id, t=title, b=body,
        )
        return data["addProjectV2DraftIssue"]["projectItem"]["id"]

    def remove(self, item_id: str) -> None:
        graphql("mutation($p:ID!,$i:ID!){ deleteProjectV2Item(input:{projectId:$p,itemId:$i}){ deletedItemId } }", p=self.id, i=item_id)

    # issues in the repository
    def issue(self, number: int) -> dict:
        return gh(f"repos/{self.owner}/{self.repo}/issues/{number}")


# --- commands ----------------------------------------------------------------------------


def name(item: dict) -> str:
    """`#89 Title (closed)`, or `draft "Title"` for an item that is no issue."""
    state = f" ({item['state']})" if item["state"] and item["state"] != "open" else ""
    return f"#{item['number']} {item['title']}{state}" if item["number"] else f'draft "{item["title"]}"'


def fmt(item: dict) -> str:
    return f"{(item['status'] or '—'):<12}  {name(item)}"


def cmd_list(board: Board, args) -> None:
    items = board.items()
    if args.status:
        items = [i for i in items if (i["status"] or "").lower() == args.status.lower()]
    if args.json:
        print(json.dumps(items, indent=1, ensure_ascii=False))
        return
    print(f"{board.title} — {board.url}")
    for status in list(board.statuses) + [None]:
        group = [i for i in items if i["status"] == status]
        if args.status and status != next((s for s in board.statuses if s.lower() == args.status.lower()), None):
            continue
        if group or not args.status:
            print(f"\n{status or 'no status'} ({len(group)})")
            for i in group:
                print("  " + fmt(i))


def cmd_show(board: Board, args) -> None:
    item = board.find(args.item)
    print(fmt(item))
    if item["number"]:
        issue = board.issue(item["number"])
        print(issue["html_url"])
        print()
        print(issue.get("body") or "(no text)")
        comments = gh(f"repos/{board.owner}/{board.repo}/issues/{item['number']}/comments")
        for c in comments:
            print(f"\n--- {c['user']['login']}, {c['created_at']}\n{c['body']}")


def body_of(args) -> str:
    if getattr(args, "body_file", None):
        return Path(args.body_file).read_text(encoding="utf-8")
    return getattr(args, "body", None) or getattr(args, "text", None) or ""


def cmd_add(board: Board, args) -> None:
    body = body_of(args)
    if args.draft:
        item_id = board.add_draft(args.title, body)
        ref = "draft"
    else:
        issue = gh(f"repos/{board.owner}/{board.repo}/issues", "-X", "POST", data={"title": args.title, "body": body})
        item_id = board.add_content(issue["node_id"])
        ref = f"#{issue['number']} {issue['html_url']}"
    status = board.set_status(item_id, args.status)
    print(f"added {ref} to {board.title} as {status}")


def cmd_link(board: Board, args) -> None:
    issue = board.issue(int(args.item.lstrip("#")))
    item_id = board.add_content(issue["node_id"])
    status = board.set_status(item_id, args.status)
    print(f"linked #{issue['number']} {issue['html_url']} as {status}")


def cmd_move(board: Board, args) -> None:
    item = board.find(args.item)
    status = board.set_status(item["item_id"], args.status)
    print(f"{name(item)} → {status}")


def cmd_comment(board: Board, args) -> None:
    item = board.find(args.item)
    if not item["number"]:
        raise BoardError("a draft item has no comment thread; add it as an issue (`add` without --draft) to comment")
    c = gh(f"repos/{board.owner}/{board.repo}/issues/{item['number']}/comments", "-X", "POST", data={"body": body_of(args)})
    print(c["html_url"])


def cmd_claim(board: Board, args) -> None:
    item = board.find(args.item)
    if not item["number"]:
        raise BoardError("a draft card cannot be claimed; the maintainer turns it into an issue first")
    status = board.set_status(item["item_id"], "In Progress")
    text = f"Claimed by the agent on branch `{args.branch}`."
    if args.note:
        text += f" {args.note}"
    c = gh(f"repos/{board.owner}/{board.repo}/issues/{item['number']}/comments", "-X", "POST", data={"body": text})
    print(f"{name(item)} → {status}; {c['html_url']}")


def cmd_close(board: Board, args) -> None:
    item = board.find(args.item)
    if not item["number"]:
        raise BoardError("a draft item is not an issue; `remove` takes it off the board")
    gh(f"repos/{board.owner}/{board.repo}/issues/{item['number']}", "-X", "PATCH", data={"state": "closed", "state_reason": args.reason})
    line = f"closed #{item['number']} ({args.reason})"
    if not args.keep_status:
        line += f", → {board.set_status(item['item_id'], 'Done')}"
    print(line)


def cmd_remove(board: Board, args) -> None:
    item = board.find(args.item)
    board.remove(item["item_id"])
    print(f"removed {name(item)} from {board.title}")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0], formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--project", default=DEFAULT_PROJECT, help=f"the project's title or number (default: {DEFAULT_PROJECT})")
    sub = p.add_subparsers(dest="command", required=True)
    s = sub.add_parser("list", help="every card by column"); s.add_argument("--status"); s.add_argument("--json", action="store_true"); s.set_defaults(run=cmd_list)
    s = sub.add_parser("show", help="a card's text, column and comments"); s.add_argument("item"); s.set_defaults(run=cmd_show)
    s = sub.add_parser("add", help="a new issue on the board (or a draft with --draft)"); s.add_argument("title")
    g = s.add_mutually_exclusive_group(); g.add_argument("--body", default=""); g.add_argument("--body-file", metavar="FILE")
    s.add_argument("--status", default="Todo"); s.add_argument("--draft", action="store_true"); s.set_defaults(run=cmd_add)
    s = sub.add_parser("claim", help="move a card to In Progress and comment which branch works it"); s.add_argument("item")
    s.add_argument("--branch", required=True); s.add_argument("--note", default=""); s.set_defaults(run=cmd_claim)
    s = sub.add_parser("link", help="an existing issue or pull request onto the board"); s.add_argument("item"); s.add_argument("--status", default="Todo"); s.set_defaults(run=cmd_link)
    s = sub.add_parser("move", help="set an item's Status"); s.add_argument("item"); s.add_argument("status"); s.set_defaults(run=cmd_move)
    s = sub.add_parser("comment", help="comment on a card's issue"); s.add_argument("item"); s.add_argument("text", nargs="?", default="")
    s.add_argument("--body-file", metavar="FILE"); s.set_defaults(run=cmd_comment)
    s = sub.add_parser("close", help="close the issue and move it to Done"); s.add_argument("item")
    s.add_argument("--reason", choices=["completed", "not_planned"], default="completed"); s.add_argument("--keep-status", action="store_true"); s.set_defaults(run=cmd_close)
    s = sub.add_parser("remove", help="take an item off the board"); s.add_argument("item"); s.set_defaults(run=cmd_remove)
    args = p.parse_args(argv)
    try:
        owner, repo = origin()
        board = Board(owner, repo, args.project)
        args.run(board, args)
    except BoardError as e:
        print(f"board: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
