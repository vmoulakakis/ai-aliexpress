# NHMA AI Scout — Agent Operating Guide

This repository is an AI-assisted shopping decision product, not a generic ecommerce template and not a chat-only interface.

## Product principle

Keep **Smart Search** and **Conversational Shopping** independent but interoperable. Search is the fast path for users who can state a need. Chat is the exploration path for ambiguous needs, trade-offs, compatibility questions and follow-up refinement. They must share session state without becoming the same UI or backend function.

## Skills to load by task

- `skills/commerce-ux-auditor/SKILL.md` — page structure, product-list usability, mobile, trust and accessibility.
- `skills/conversational-shopping/SKILL.md` — intent, clarification, memory, tool choice and multi-turn behavior.
- `skills/product-evidence-judge/SKILL.md` — product identity, hard constraints, evidence and ranking.
- `skills/affiliate-growth/SKILL.md` — affiliate value, disclosure, attribution, conversion and content quality.
- `skills/agentic-orchestrator/SKILL.md` — agent/tool boundaries, routing, cost control, tracing and deterministic gates.
- `skills/agent-evals/SKILL.md` — golden cases, regressions and release grading.
- `skills/web-performance-accessibility/SKILL.md` — WCAG 2.2, Core Web Vitals and interaction quality.

## Non-negotiable release gates

1. Never fabricate stock, warehouse country, shipping cost, delivery time, seller score, discount, review score or compatibility.
2. Budget and other explicit hard constraints are gates, not ranking hints.
3. Do not return an accessory when the user asked for the main product unless the user explicitly asks for accessories/parts.
4. Prefer zero relevant products over irrelevant filler.
5. Ask at most one high-information clarification when it materially changes retrieval; otherwise search first.
6. Follow-up turns preserve product family, budget, recipient/use case, accepted/rejected constraints and prior comparisons.
7. Affiliate links are visibly disclosed and use `rel="sponsored noopener noreferrer"`.
8. The UI must not hide keyboard focus or place persistent controls over core mobile actions.
9. New agent behavior requires regression cases before production release.
10. Do not create a new production deployment for every edit. Batch changes on a branch, run acceptance, then promote one tested revision.

## Decision hierarchy

`user value > factual correctness > relevance > trust > speed > conversion > visual novelty`

Conversion optimizations that reduce transparency, increase irrelevant clicks or use dark patterns are rejected.
