# NHMA AI Scout — Deep Research & V2 Design Direction

Date: 2026-08-14
Production URL: https://nhma-ai-scout.vercel.app/
Working branch: `research/agentic-commerce-v2`

## Executive conclusion

NHMA should not become a chat-only storefront and should not become a generic ecommerce clone. The strongest product position is a **shopping decision assistant** with two interoperable paths:

- **Smart Search** for fast, actionable product needs.
- **Conversational Shopping** for ambiguity, trade-offs, follow-up refinement, compatibility and decision support.

Both share session/memory and product evidence, but remain different UX surfaces and backend responsibilities.

## What current research supports

### AI-native shopping
OpenAI's 2026 product-discovery work emphasizes describing needs in natural language, visual product browsing, image-based inspiration, conversation-driven refinement and side-by-side comparison. This aligns with NHMA's direction, especially the need for comparison and multimodal discovery rather than a larger chat window.

Sources:
- https://openai.com/index/powering-product-discovery-in-chatgpt/
- https://openai.com/index/chatgpt-shopping-research/

### Product-list usability
Baymard's large-scale ecommerce research repeatedly identifies product-list filtering/sorting, applied-filter visibility and decision-relevant list information as major determinants of product-finding success. Mobile product lists are especially fragile when controls become noisy or require repeated navigation.

Sources:
- https://baymard.com/blog/current-state-product-list-and-filtering
- https://baymard.com/research/ecommerce-product-lists

### Affiliate quality
Google explicitly distinguishes useful affiliate sites from thin affiliation. Added value includes original analysis, comparisons, navigation and useful product decision features. NHMA must therefore generate its affiliate value from *decision quality*, not merchant-feed reproduction.

Sources:
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/appearance/reviews-system

### Agent skills and agent architecture
Anthropic's public Agent Skills model packages specialized workflows as self-contained `SKILL.md` resources that are loaded when relevant. OpenAI's Agents SDK emphasizes a small set of primitives — agents, tools/handoffs, guardrails, sessions and tracing — rather than uncontrolled numbers of agents.

Sources:
- https://github.com/anthropics/skills
- https://github.com/openai/openai-agents-js
- https://github.com/openai/openai-agents-python/blob/main/docs/tracing.md

### Accessibility
WCAG 2.2 adds explicit focus-obscuration and pointer-target guidance. NHMA's floating chat and compact mobile controls must be tested against these rules.

Source:
- https://www.w3.org/TR/WCAG22/

## Current-source UX audit

This audit is based on the repository source and live backend tests. The generic crawler could not render the current Vercel page, so this is **not** presented as a visual screenshot audit of production pixels.

### Strengths
- restrained, modern visual baseline
- natural-language search is clearly primary
- chat is already independent and compact rather than full-screen
- no fake products or demo cards
- simple static frontend has a strong performance budget
- basic responsive grid, labels and loading states exist

### P0 weaknesses
1. **Too many helper chips immediately under search.** The interface exposes constraints and category starters at equal visual weight, increasing scanning cost.
2. **Opaque numeric `% match`.** An internal rank score looks like objective probability even though it is a heuristic. Replace with qualitative relevance + explanation.
3. **Cards are commerce-thin.** Price/title/one why line are not enough for confident comparison. Surface only verified evidence and make uncertainty explicit.
4. **Interpreted intent is transient.** Users should see the normalized need and active constraints as a persistent, editable overview after search.
5. **No comparison flow.** Decision-oriented shopping needs a low-friction way to compare 2–3 candidates.
6. **No saved shortlist.** Lightweight local save creates continuity without requiring auth.
7. **Affiliate disclosure is too distant.** Add concise disclosure near the first outbound product actions.
8. **No-result recovery is generic.** Explain whether the blocker is budget/warehouse/shipping/relevance when evidence is available and offer safe refinement actions.
9. **Chat lacks a clean “new conversation” action.** Users need an explicit way to clear local context and create a new session.
10. **Technical live-status cue is overemphasized.** Consumer trust should focus on evidence and product-source transparency rather than backend health jargon.

## V2 interaction model

### First view
- compact brand/trust header
- one primary natural-language search area
- 3–4 high-value starter examples, not two full rows of chips
- secondary filters inside a compact expandable refinement section
- photo action remains adjacent to search

### After search
Show:
1. `Κατάλαβα:` normalized human-readable intent
2. removable/visible active constraints
3. result count + sorting
4. cards
5. compare tray when 2+ items selected

### Card anatomy
- product image
- qualitative relevance label
- merchant title (clamped)
- price
- “Γιατί ταιριάζει”
- verified evidence badges only
- save + compare controls
- outbound CTA

Do not show unknown fields as positive badges.

### Comparison
Compare up to three products on fields actually returned by the backend. Never manufacture a comparison field just to fill a table.

### Chat
- remains independent floating panel / mobile bottom sheet
- add “Νέα συζήτηση”
- retain suggested replies
- product mini-cards link to same product evidence
- chat can trigger search but is not search itself

## Agent roles — deliberately minimal

### 1. Conversation Manager
Owns multi-turn state and decides whether live product evidence is needed.

### 2. Intent Planner
Converts natural Greek/Greeklish into structured intent and a bounded retrieval plan.

### 3. Product Evidence Judge
Deterministically rejects identity/hard-constraint violations, then semantically ranks clean candidates.

### 4. Affiliate Growth Analyst
Optimizes qualified decisions, attribution and content value without influencing relevance ranking.

### 5. UX / Accessibility Auditor
Reviews interaction hierarchy, mobile behavior, WCAG 2.2 and product-list decision quality.

### 6. Eval Sentinel
Runs golden and adversarial cases before promotion.

These are **skills/roles**, not necessarily six runtime LLM calls. A role becomes a separate agent only when independent reasoning/tools justify the latency and cost.

## Observability recommendation

### Now
Use existing Supabase event tables/logs and implement a stable event taxonomy. This is sufficient while the main LLM provider is not configured.

### Next
Use a product analytics layer (e.g. PostHog) when funnel/session analysis becomes necessary. Add agent tracing/evals (e.g. Langfuse or OpenTelemetry-compatible tracing) when primary LLM reasoning is active.

Do not install multiple overlapping observability stacks simultaneously.

## Free/open model policy

Do not optimize production architecture around whichever free inference endpoint is available this week. Use open/free models for:
- offline taxonomy labeling
- eval-case generation
- batch query rewriting experiments
- synthetic adversarial inputs

For user-facing product decisions, deterministic evidence gates remain mandatory and the production reasoning provider must have a reliable configured path.

## Promotion gate

Do not merge the V2 branch until:
- P0 UX changes are complete
- golden/adversarial eval cases are documented and executable where practical
- no explicit hard constraint is violated in smoke tests
- keyboard/mobile interaction is manually reviewed
- one production promotion is planned with a known rollback commit
