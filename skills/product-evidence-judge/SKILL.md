---
name: product-evidence-judge
description: Validate product identity, hard constraints, evidence quality and ranking before NHMA shows recommendations. Use for AliExpress candidate filtering, ranking, comparison, badges and any claim shown on product cards.
---

# Product Evidence Judge

## Rule zero
A candidate must first be the thing the user asked for. Ranking cannot rescue a wrong product type.

## Validation order
1. **Product identity** — whole product vs accessory/part, correct product family, obvious semantic mismatch.
2. **Hard constraints** — budget, destination, required compatibility, required warehouse, explicitly required shipping condition, explicit seller threshold when data exists.
3. **Evidence integrity** — whether each displayed claim is actually returned/derived from an approved source.
4. **Semantic/use-case fit**.
5. **Trust/value signals** — seller feedback, sales/popularity, total price where known.
6. **Soft preferences**.
7. **Affiliate economics** only after user-value ranking, never as a relevance feature.

## Evidence states
Every decision attribute has one state:
- `verified`: directly supported by the live source.
- `calculated`: deterministically derived from verified fields.
- `inferred`: plausible model/rule inference; never shown as a verified fact.
- `unknown`: absent or ambiguous.
- `contradicted`: live evidence conflicts with the requirement.

Unknown never becomes “yes”.

## Hard constraint gates
- `price > budgetMax` => reject.
- `price < budgetMin` when minimum is meaningful => reject.
- Explicit EU-warehouse requirement + known non-EU ship-from => reject.
- Explicit free-shipping requirement + known non-free shipping => reject.
- Required compatibility contradicted => reject.
- Seller threshold contradicted by available feedback => reject.

If a hard field is unknown, policy must be explicit: either reject for strict requests or keep with a visible “δεν επιβεβαιώνεται”. Never silently pass it as compliant.

## Product identity guards
When the user asks for a main product, reject obvious accessories, replacements and variants such as covers, mounts, filters, brushes, cases, cushions, hooks, spare parts or implausible low-price variants unless explicitly requested.

Use title + category + price sanity + available structured fields. Avoid endless category-specific regex patches by logging false positives and promoting recurring failures into structured identity rules/evals.

## Ranking
Recommended ordering:
`identity > hard constraints > semantic fit > evidence confidence > value/trust > soft preferences > popularity`

Do not use affiliate commission, EPC or payout to move a less relevant item above a better user match.

## Product card claims
Allowed when supported:
- price/currency
- seller feedback
- sales/popularity
- ship-from country
- shipping cost
- delivery estimate
- category
- direct/promotion link

Do not invent warranty, stock status, delivery, “EU stock”, discount, seller trust, bestseller status or compatibility.

## Qualitative relevance
Do not expose raw internal scores as scientific certainty. Map score bands and evidence to cautious labels such as:
- `Πολύ καλή αντιστοίχιση`
- `Καλή αντιστοίχιση`
- `Σχετική επιλογή`

Always show *why* in human terms.

## Zero-result policy
Zero clean candidates is a valid, often preferable result. Trigger controlled query relaxation, not irrelevant filler.
