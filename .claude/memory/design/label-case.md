---
name: label-case
description: A concept's `label` and `short_label` are written in running-text case — as their words read inside a sentence of the label's language, the first word included (German "angemessener Flüssigkeitsstatus", "ohne Schocksymptomatik", "Hypoperfusion", "pH"); the build shows every label as stored and changes no case.
metadata:
  type: project
---

A concept's `label` and `short_label` are written as their words read inside a
sentence of the label's language (its `lang`), the first word included. A first
word that language writes in lower case inside a sentence opens in lower case;
a noun, a name or a token whose case is fixed (an acronym, a symbol, a unit)
keeps its case. In German that lowers an adjective, a participle, an adverb, a
preposition or a determiner ("angemessener Flüssigkeitsstatus", "hämodynamisch
instabil", "ohne Schocksymptomatik", "keine zusätzliche Gabe von Antiemetika")
and keeps "Hypoperfusion", "ARDS", "pH", "β-Blocker", "qSOFA", "mPOM". In a
hyphenated compound a noun keeps its capital ("Sepsis-assoziierte
Organdysfunktion", "Chlorhexidin-alkoholische Desinfektion"); one word read two
ways is read in its label ("erwachsene Patienten …", an adjective; "Erwachsene
mit …", a noun). Words a page prints keep their printed case (a claim's
sentence, a quote, an evidence `key` or `value`, grade, verb and consensus
words, an outline title), and a statement's `label` begins as a sentence does.
The rule is the concepts'; statements, structural nodes, axes, views and sources
are not under it. Spec §3.2. Decided 2026-10-10 on the maintainer's delegation
(card #257, option 1 of three); the relabel of both graphs lowered 262 values
in 211 concept files, ids unchanged.

**Why:** A statement's conditions are shown joined by "und", one per line, in
the order stored ([[conditions-are-a-conjunction-list]]), so each label stands
inside a phrase; a heading-case label put a capital mid-line ("und Angemessener
Flüssigkeitsstatus"). The build cannot fix that: it cannot tell a German noun
from an adjective, and some labels open with a token whose case is fixed, so
any case change in the build would be a word list or a language rule in code
([[generic-over-guidelines]]). Running-text case is one rule with no schema
field, the build stays blind to case, and part of the pool already followed it
(the dimension values, the "ohne …" labels). The rejected options were heading
case shown as a list with an operator (it changes the join and still needs an
exception for fixed-case tokens) and a case-significance mark per label (a
schema field and a judgement per concept). The cost, accepted: a concept's
label standing alone — a patient group's box, a concept page's title, the first
line of an answer — opens in lower case where its first word does, as a
dictionary lists an adjective.

**How to apply:** Mint every concept label and short label in running-text
case, in every language and for every guideline; read the first word in its
label, not from a list. Never lower, capitalise or `text-transform` a label in
the build or the stylesheet. The validator cannot check the rule, since it
cannot tell a noun, so review checks it — the pull request names each first
word that could be read either way. A relabel is an edit: the id stays
([[two-layer-identity]]) and a short label stays within 60 characters
([[short-label-limit]]). Where the tree orders siblings by label, compare
labels with case folded, so that a lowered label does not sort after every
capitalised one.
