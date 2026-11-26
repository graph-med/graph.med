---
id: claims/pomgat-lv-1.0/dcc1bac8
type: claim
order: 1
lang: de
kind: recommendation
recommendation_no: '5.2'
section: "5.1.2"
label: Im Rahmen abdominalchirurgischer Tumoroperationen sollte eine Propofol-basierte totalintravenöse Anästhesie (TIVA)
  anstelle einer volatilen Anästhesie durchgeführt werden, sofern keine zusätzlichen Antiemetika verabreicht werden.
grade: B
verb: sollte
direction: for
consensus: starker_konsens
source:
  at: sources/pomgat-lv-1.0#page=42
  quote: "totalintravenöse Anästhesie (TIVA) anstelle einer volatilen Anästhesie"
evidence:   # spec §3.1: the two PONV rows keyed by their comparator; "früh"/"Spät" are the endpoint's time frame (#261)
- outcome: concepts/ponv-risiko
  key: "im Vergleich zu volatilen Anästhetika"
  value: "moderat"
  system: grade
- outcome: concepts/ponv-risiko
  key: "im Vergleich zu volatilen Anästhetika in Kombination mit Antiemetikum"
  value: "moderat"
  system: grade
- outcome: concepts/schwere-nebenwirkungen
  value: "sehr niedrig"
  system: grade
- outcome: concepts/patientenzufriedenheit
  value: "sehr niedrig"
  system: grade
provenance:
  evidence:
  - at: sources/pomgat-lv-1.0#page=42
    quote: "⊕⊕⊕⊝: Reduktion des PONV-Risikos: Propofol zeigt einen Effekt im Vergleich zu volatilen"
  - at: sources/pomgat-lv-1.0#page=42
    quote: "⊕⊕⊕⊝: Reduktion des PONV-Risikos: früh: Kein Effekt"
  - at: sources/pomgat-lv-1.0#page=42
    quote: "⊕⊝⊝⊝: Schwere Nebenwirkungen (CDC 3-4): Kein Effekt"
  - at: sources/pomgat-lv-1.0#page=42
    quote: "⊕⊝⊝⊝: Patientenzufriedenheit: Kein Effekt"
---
