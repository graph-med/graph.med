---
id: claims/pomgat-lv-1.0/ed10bff2
type: claim
order: 1
lang: de
kind: criterion
section: "4.1"
label: 'Als kardiovaskuläre Hochrisikopatienten gelten Patienten mit mindestens zwei klinischen Risikofaktoren (nach dem
  Revised Cardiac Risk Index (RCRI) score: ischämische Herzerkrankung, zerebrovaskuläre Erkrankung, Niereninsuffizienz mit
  einem Serumkreatinin von >2mg/dl oder insulinpflichtiger Diabetes mellitus)'
combination:   # as printed (spec §3.1): two of the four factors the parenthesis lists, each a claim — replaces the count threshold (#204)
  operator: at_least
  n: 2
  of: [claims/pomgat-lv-1.0/be00943b, claims/pomgat-lv-1.0/f7a164a2, claims/pomgat-lv-1.0/6059f1ba, claims/pomgat-lv-1.0/5beed795]
  connective: mindestens zwei
  source: {at: sources/pomgat-lv-1.0#page=27, quote: "kardiovaskuläre Hochrisikopatienten gelten Patienten mit mindestens zwei klinischen"}
  rationale: "„mit mindestens zwei klinischen Risikofaktoren (… : …, …, … oder …)“ zählt: zwei der vier in der Klammer genannten Faktoren genügen, gleich welche; das „oder“ vor dem letzten Faktor schließt die Aufzählung und verknüpft nicht."
source:
  at: sources/pomgat-lv-1.0#page=27
  quote: kardiovaskuläre Hochrisikopatienten gelten Patienten mit mindestens zwei klinischen
---
