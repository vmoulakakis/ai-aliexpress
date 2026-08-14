---
name: commerce-ux-auditor
description: Audit and redesign NHMA product discovery, search results, product cards, mobile flows, trust states and shopping usability. Use whenever changing layout, search UX, result lists, filters, product cards, empty states, chat placement or mobile behavior.
---

# Commerce UX Auditor

## Mission
Make the shortest path from a human need to a confident product decision clear, calm and trustworthy.

## Method
1. Identify the user's primary task on the screen.
2. Check whether the first action is obvious within one glance.
3. Separate **search**, **refinement**, **evaluation**, and **conversation**. Do not visually merge all four into one giant control.
4. Audit desktop and mobile independently.
5. Evaluate every persistent element for overlap, interruption and cognitive load.
6. Grade product cards by decision usefulness, not visual decoration.

## Search rules
- Natural-language product, feature, use-case, symptom/problem, compatibility, recipient and budget queries must all be viable entry points.
- Keep the search field prominent and conversational.
- Do not force the user through a wizard before first retrieval when the query is already actionable.
- Show the interpreted need and applied hard constraints after search so the user can see what the system understood.
- Make applied constraints removable or refinable.
- If no relevant result survives, explain the limiting constraint and offer a safe next action. Never fill with unrelated products.

## Product-list rules
- Show result count when known.
- Offer sorting only by fields actually available: relevance, price, seller feedback, sales/popularity where present.
- Product cards must prioritize: product identity, price, why it matches, verified decision attributes and clear outbound action.
- Merchant SEO titles may be noisy; visually de-emphasize excess title length rather than inventing specifications.
- Do not expose an opaque numeric AI score as if it were objective certainty. Prefer labels such as “Υψηλή αντιστοίχιση” only when grounded by the ranking system.
- Never label every product “best”. Distinguish roles only when evidence supports them.
- Unknown evidence stays unknown; absence of evidence is not a positive badge.

## Trust and affiliate UX
- State clearly that NHMA is a decision assistant, not the seller.
- Place a concise affiliate disclosure near the first outbound product actions, not hidden only in legal footer text.
- Explain that affiliate compensation does not change the user's price when that is true for the program.
- No fake countdowns, fake scarcity, forced urgency or hidden commercial intent.

## Mobile rules
- Search and photo actions need comfortable tap targets.
- Floating chat must not cover search, filters, comparison controls or product CTAs.
- Chat opens as a dismissible bottom sheet/compact panel, not an unavoidable full-screen takeover.
- Avoid horizontally overflowing filter chips; collapse secondary refinements behind a clear control when necessary.

## Accessibility gate
- Visible keyboard focus.
- Logical heading hierarchy.
- Inputs have labels; icon buttons have accessible names.
- Status/clarification updates use appropriate live regions without repeated announcements.
- Pointer targets meet WCAG 2.2 minimum sizing/spacing; prefer ~44px controls for primary mobile actions.

## Output format for audits
For each issue return: `severity`, `user impact`, `evidence`, `recommended change`, `acceptance test`.
