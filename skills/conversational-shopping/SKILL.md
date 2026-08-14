---
name: conversational-shopping
description: Design and audit NHMA multi-turn shopping conversations, clarification policy, memory, query planning and search-tool use. Use for chatbot behavior, intent planning, follow-ups, suggested replies, photo-to-query flows and no-result recovery.
---

# Conversational Shopping

## Goal
Turn vague needs into confident decisions without turning shopping into an interview.

## Canonical intent state
Maintain a structured state with:
- `goal`
- `productFamily`
- `useCase`
- `recipient`
- `budgetMin`, `budgetMax`, `currency`
- `hardConstraints[]`
- `softPreferences[]`
- `compatibility[]`
- `desiredOutcome`
- `acceptedProductIds[]`
- `rejectedProductIds[]` with reasons
- `unknowns[]`

Do not use a small hard-coded category whitelist as the product ontology.

## Clarification policy
- Search immediately when the request is actionable.
- Ask **one** clarification only when the expected information gain is high enough to change product family, hard compatibility, safety, size/fit, or budget feasibility.
- Prefer compact choice chips when the options are natural, plus free text.
- Never repeat a question already answered in this session.
- Never ask for facts the live product source cannot use.

## Multi-turn state
Follow-ups modify the prior intent rather than starting over.

Examples:
- “δείξε μου πιο φθηνά” keeps product family and lowers/prioritizes budget.
- “το δεύτερο αλλά με πιο γρήγορη παράδοση” keeps the referenced product context and changes delivery preference.
- “μαύρη και με μπράτσα” adds color and armrests.
- “όχι αυτό το brand” adds a rejection, not a new category.

Persist stable constraints and meaningful preference/rejection state. Do not memorialize every transient sentence.

## Tool policy
Use Smart Search when the user needs current products, prices, availability evidence or alternatives. Do not call product search for ordinary explanation, planning or generic advice that does not require live product evidence.

Search and chat are complementary modes. The user can move between them without losing session context.

## Query ladder
When a live search produces no clean candidates:
1. Retry with a precise normalized product phrase.
2. Try safe synonyms / equivalent category language.
3. Remove only non-essential descriptive keywords.
4. Relax a **soft** preference and tell the user what changed.
5. Keep hard constraints unless the user explicitly authorizes relaxation.
6. If still empty, explain which constraint is blocking results and offer the nearest safe next action.

Never broaden into another product family just to return something.

## Photo flow
Treat image requests as one of: `exact`, `similar`, `replacement`, `compatibility`, `identify`, `problem`.
Extract visible attributes into structured evidence before forming text queries. If direct visual retrieval is unavailable, say so and ask for the minimum textual identifier needed; do not claim visual similarity from keyword search alone.

## Response style
- Lead with the decision-relevant answer, not internal system status.
- Mention uncertainty when evidence is incomplete.
- Keep product-card facts synchronized with backend evidence.
- Suggested replies should move the decision forward: cheaper, compare, stricter requirement, different style, explain trade-off.
