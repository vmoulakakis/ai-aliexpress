---
name: agent-evals
description: Build NHMA regression suites and release gates for intent, tool use, memory, product identity, hard constraints, hallucinations, latency and affiliate behavior. Use before merging agent/search/chat changes to production.
---

# Agent Evals

## Release philosophy
A new prompt, model, rule or ranking change is incomplete until it has regression evidence.

## Required eval dimensions
For every case capture:
- expected intent/product family
- expected preserved constraints
- expected clarification behavior
- required tool calls
- forbidden tool calls
- allowed product type
- forbidden product/accessory patterns
- hard-constraint assertions
- memory/state assertions
- factual-claim assertions
- expected fallback behavior
- latency target

## Core golden cases
1. `Θέλω εργονομική καρέκλα γραφείου μέχρι 180 ευρώ.`
2. `Laptop για τον γιο μου 12 χρονών` -> clarification only if use/budget materially needed; follow with `coding μέχρι 600` then `πιο ελαφρύ`.
3. `Ο γιος μου πάει Β Γυμνασίου, τι να του πάρω;` -> need decomposition, not unknown dead end.
4. `Απλή κασετίνα με ένα άνοιγμα.` -> retain specific product identity.
5. `Ρομποτική σκούπα για τρίχες σκύλου μέχρι 250 ευρώ.` -> no hooks, parts, brushes, pool/window vacuums.
6. `Power bank για αεροπλάνο μέχρι 30 ευρώ.` -> preserve travel use case; do not invent airline compliance unless verified/rule-grounded.
7. strict `μόνο EU stock`.
8. strict `δωρεάν μεταφορικά`.
9. `δείξε μου πιο φθηνά` after results.
10. `το δεύτερο αλλά με πιο γρήγορη παράδοση`.
11. compare two previously shown products.
12. Greeklish / typo-heavy query.
13. photo exact/similar request with direct image search unavailable.
14. no-result recovery that relaxes only a soft preference.
15. chat question that requires no product search.

## Hard-fail conditions
Any one of these fails release:
- product outside explicit maximum budget
- wrong product family shown as recommendation
- accessory shown instead of requested main product
- invented EU stock / shipping / seller / delivery / warranty / compatibility claim
- losing explicit multi-turn hard constraint
- affiliate commission influencing relevance ordering
- loop/repeated clarification already answered

## Metrics
Track by test suite and production sample:
- intent accuracy
- clean candidate precision
- accessory false-positive rate
- hard-constraint violation rate
- hallucinated-claim rate
- clarification rate
- repeat-clarification rate
- zero-result rate and recovery success
- state retention across turns
- tool-call correctness
- p50/p95 latency
- provider/model cost when applicable

## Judge policy
Prefer deterministic assertions for facts and constraints. Use an LLM judge only for semantic qualities that cannot be specified exactly, and never let an LLM judge override a deterministic hard failure.

## Promotion gate
Merge/deploy only when:
- all hard assertions pass
- no known P0 regression remains
- new behavior has at least one positive and one adversarial case
- production rollback point is known
