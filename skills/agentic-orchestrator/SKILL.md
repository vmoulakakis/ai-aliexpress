---
name: agentic-orchestrator
description: Define NHMA agent/tool architecture, routing, provider usage, deterministic gates, retries, observability and cost control. Use for backend orchestration, model routing, memory, tool calls and adding new specialist agents.
---

# Agentic Orchestrator

## Principle
Use the **fewest autonomous components that improve the outcome**. Do not create multi-agent theater.

NHMA's minimum useful primitives are:
1. Conversation Manager
2. Intent Planner
3. Search Tool
4. Product Evidence Validator
5. Ranker/Judge
6. Memory
7. Analytics/Tracing

A specialist becomes a separate agent only when it needs independent context, tools, evaluation criteria or reasoning that cannot be expressed cleanly as a skill/tool.

## Deterministic vs model work
Use deterministic logic for:
- price/budget gates
- presence/absence of structured evidence
- country lists
- explicit shipping/seller thresholds
- deduplication
- rate limits
- affiliate-link integrity
- exact state updates

Use an LLM for:
- ambiguous intent
- trade-offs
- query planning
- summarization
- semantic reranking/judging over verified fields
- deciding which clarification has highest value

Never let an LLM overwrite live API facts.

## Provider routing
Preferred production order when configured:
`DeepSeek reasoning primary -> explicitly configured fallback -> safe deterministic fallback`

Do not call an expensive model when a deterministic rule or cheap planner can answer reliably. Provider routing is based on task complexity and confidence, not vendor enthusiasm.

Free/open models are suitable for offline labeling, synthetic eval generation, batch taxonomy work and low-stakes experimentation unless a production SLA has been established. Never make checkout-adjacent reliability depend on a volatile free quota.

## Structured boundaries
Intent planners and judges return strict structured objects. Validate before use. Separate:
- user text
- normalized intent
- tool request
- raw tool evidence
- rejected candidates + reasons
- final presentation

## Search execution
- Generate a bounded candidate plan (normally 1–3 safe queries).
- Execute independent retrievals in parallel where latency benefits.
- Deduplicate before judging.
- Enforce hard constraints before model reranking.
- Retry only with an explicit relaxation ladder and a retry budget.
- Use timeouts and return a safe partial/empty result rather than hanging the UI.

## State ownership
A session has one canonical conversation/intent state. Frontend history is UX cache; server memory is authoritative for durable state.

State mutations must be explicit and inspectable. Preserve accepted/rejected constraints and references such as “the second one”.

## Trace model
Record per turn:
- `session_id`
- request class / intent
- planner/provider/version
- tool calls + latency
- queries attempted
- candidate count
- rejection counts by reason
- selected product IDs/ranks
- hard-constraint status
- fallback/retry path
- response latency
- model token/cost metrics when available
- error class

Do not log raw credentials. Minimize personal data.

## Failure behavior
Tool failure != permission to hallucinate. Distinguish:
- provider unavailable
- AliExpress unavailable
- no relevant candidates
- hard constraints too restrictive
- missing evidence
- invalid image/search input

Each gets a specific recovery path.
