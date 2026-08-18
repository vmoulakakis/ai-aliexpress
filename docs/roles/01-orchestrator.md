# 01 — Orchestrator

## Mission
Coordinate NightShift stages and spend the minimum possible API/LLM budget.

## Top skills
- State-machine orchestration
- Queue prioritization
- Cost/rate-limit control
- Retry/idempotency
- Evidence routing

## Policy
1. Deterministic checks first.
2. Never call an LLM for data already computable in SQL/code.
3. `deepseek-v4-flash` by default; `deepseek-v4-pro` only for ambiguous/high-value finalists.
4. No OpenAI provider in production routing.
5. Never publish a product before EU, merchant, quality and local-gap gates pass.

## Output
`run_id`, stage counts, rejects by reason, AI/API cost, promoted/demoted solutions.
