---
# sequences (spec §5 `follows`; #294, #295; card #296): within chapter 4, each candidate read by the four tests of
# spec §5. 4.6 follows 4.5, the edge replacing the `complements` the pair carried (#294 Decision 3); 8.1's edges to
# 4.5 and 4.1 are in cross-chapter.yaml. No edge, each candidate named in the pull request: 4.2 → 4.1 keeps
# `complements` above (its „wenn große Mengen an Flüssigkeit benötigt werden“ is a state worded without a measure,
# test 2); 4.6 → 4.1 (p. 64's caution for patients „die nicht euvolämisch sind“: a state, and a limit); 4.9 → 4.1 and
# 4.9 → 4.5 („trotz angemessenem Flüssigkeitsstatus und arteriellem Blutdruck“: states, test 2); 4.11 → 4.5
# („therapierefraktären“ names no measure, test 2). The steps only the body text gives stay as §5.1 links them, no
# node of a chain (#294 Decision 7): higher vasopressin doses where alternative vasopressors failed (p. 64, limits),
# the arterial catheter and its removal (p. 65, supplements), the β-blocker exception after volume and vasopressors
# (p. 72, supplements).
id: edges/e7cc8bf4
type: edge
from: statements/vasopressin-ergaenzen-septischer-schock
kind: follows
to: statements/noradrenalin-vasopressor-erster-wahl
source: modelling
transition: adds
trigger: target_missed
rationale: 'Empfehlung 4.6 (S. 63) ergänzt Vasopressin, „wenn mit Noradrenalin alleine kein ausreichender Blutdruck erzielt
  werden kann“ — wenn unter dem Noradrenalin, das Empfehlung 4.5 (S. 62) als Vasopressor erster Wahl empfiehlt, der Blutdruck
  nicht ausreicht. Vasopressin tritt hinzu, Noradrenalin bleibt („alleine“, „zu ergänzen“). Ab welcher Laufrate, nennt der
  Hintergrund: „ab einem Dosisbereich von 0,25-0,5 μg/kg/min für die Noradrenalinlaufrate Vasopressin zu ergänzen“ (S. 64–65);
  der Bereich steht auf jenem Satz (refines), nicht auf der Bedingung.'
lang: de
as_of: '2026-10-22'
---
