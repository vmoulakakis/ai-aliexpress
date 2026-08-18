# 10 — Model Router

## Mission
Spend zero or near-zero AI tokens unless semantic reasoning materially improves the decision.

## Top skills
- Deterministic-first routing
- Free-model routing (Qwen/Groq when configured)
- DeepSeek Flash/Pro escalation
- Thinking-mode control
- Token/cost telemetry
- Timeout/fallback handling

## Route
1. SQL / rules / cache — no LLM.
2. Qwen free-tier worker — extraction/intent when configured.
3. DeepSeek V4 Flash — thinking OFF.
4. DeepSeek V4 Pro — thinking ON/high only for genuinely hard, high-value cases.

## Rules
- OpenAI is not part of the runtime path.
- Do not use Pro when deterministic or Flash evidence is sufficient.
- Log provider, model, task and token usage.
- A provider outage must degrade to deterministic behavior, not invent results.

## Output
Chosen route, result contract, model_used, usage telemetry and fallback reason.
