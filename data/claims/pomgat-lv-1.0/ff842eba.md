---
id: claims/pomgat-lv-1.0/ff842eba
type: claim
order: 10
lang: de
kind: criterion
section: "4.1"
label: 'Als kardiovaskuläre Hochrisikopatienten gelten Patienten mit mindestens zwei klinischen Risikofaktoren (nach dem
  Revised Cardiac Risk Index (RCRI) score: ischämische Herzerkrankung, zerebrovaskuläre Erkrankung, Niereninsuffizienz mit
  einem Serumkreatinin von >2mg/dl oder insulinpflichtiger Diabetes mellitus), ferner Patienten mit einem ASA Status von
  mindestens 3 und Patienten mit koronarer Herzkrankheit oder nachgewiesener Myokardischämie'
combination:   # as printed (spec §3.1): the passage joining the three groups; the top of the rule the defined_by edge reaches (#204)
  operator: any_of
  of: [claims/pomgat-lv-1.0/ed10bff2, claims/pomgat-lv-1.0/2f2ded84, claims/pomgat-lv-1.0/5410f724]
  connective: ferner … und
  source:
    - {at: sources/pomgat-lv-1.0#page=27, quote: "Serumkreatinin von >2mg/dl oder insulinpflichtiger Diabetes mellitus), ferner"}
    - {at: sources/pomgat-lv-1.0#page=27, quote: "Patienten mit einem ASA Status von mindestens 3 und Patienten mit koronarer"}
  rationale: "„Als … gelten Patienten mit …, ferner Patienten mit … und Patienten mit …“ zählt drei Patientengruppen auf, deren jede für sich als Hochrisikopatient gilt: das „und“ reiht die Gruppen, es verlangt nicht, dass alle zugleich vorliegen (ODER)."
source:
  at: sources/pomgat-lv-1.0#page=27
  quote: kardiovaskuläre Hochrisikopatienten gelten
---
