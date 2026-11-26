---
# 8.2, the Hb value in g/dl, printed in the parenthesis; its own quote prints the threshold
id: claims/sepsis-lf-4.0/fe8b3cac
type: claim
order: 5
lang: de
kind: criterion
recommendation_no: '8.2'
section: '8.2.1'
label: "< 7.0 g/dl"
consensus: starker_konsens
consensus_share: 100 %
threshold: {quantity: concepts/hb-wert, comparator: "<", value: "7.0", unit: "g/dl"}
source:
  at: sources/sepsis-lf-4.0#page=107
  quote: "(< 7.0 g/dl)"
provenance:
  consensus:
    - {at: sources/sepsis-lf-4.0#page=107, quote: "Konsensstärke: 100 %"}
    - {at: sources/sepsis-lf-4.0#page=148, quote: "> 95 % der Stimmberechtigten"}
  consensus_share: {at: sources/sepsis-lf-4.0#page=107, quote: "Konsensstärke: 100 %"}
---
