---
# a part of p. 122's combination, itself any_of over two values (#204); the rule of concepts/gerinnungsstoerung.
id: claims/sepsis-lf-4.0/ce6ced84
type: claim
order: 4
lang: de
kind: definition
section: '8.8'
label: "Gerinnungsstörung definiert als INR > 1,5 oder Thrombozytenzahl < 50 000/mm3"
combination:
  operator: any_of
  of: [claims/sepsis-lf-4.0/2e76f244, claims/sepsis-lf-4.0/38a3dc57]
  connective: "oder"
  source: {at: sources/sepsis-lf-4.0#page=122, quote: "Gerinnungsstörung definiert als INR > 1,5 oder Thrombozytenzahl < 50 000/mm3"}
  rationale: "„INR > 1,5 oder Thrombozytenzahl < 50 000/mm3“: „oder“ verbindet zwei Werte, von denen jeder allein die Gerinnungsstörung ausmacht (ODER)."
source:
  at: sources/sepsis-lf-4.0#page=122
  quote: "Gerinnungsstörung definiert als INR > 1,5 oder Thrombozytenzahl < 50 000/mm3"
---
