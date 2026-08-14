---
name: model-routing-cost
description: Select and route NHMA LLM workloads across paid, open and local inference paths with reliability, latency and cost controls. Use for DeepSeek/OpenAI fallbacks, free/open LLM experiments, LiteLLM, vLLM, llama.cpp and provider-budget decisions.
---

# Model Routing & Cost

## Objective
Spend model tokens only where model reasoning creates measurable value.

## Routing tiers
### Tier 0 — deterministic
Use no LLM for exact gates, numeric constraints, country lists, deduplication, rate limits, link integrity and known structured transformations.

### Tier 1 — cheap/fast reasoning
Use for query rewriting, typo normalization, intent extraction and simple clarification selection when deterministic confidence is insufficient.

### Tier 2 — primary reasoning
Use the configured production reasoning provider for ambiguous multi-constraint planning, trade-offs, semantic product judging and high-value conversation turns.

### Tier 3 — expensive fallback
Use only when the primary path fails or a measured quality threshold requires escalation. Set a request/cost ceiling.

## Open/local inference
Open models are not automatically “free”: hardware, cold starts, operations and latency still cost money.

Recommended infrastructure roles:
- **llama.cpp** — local/edge experimentation, quantized GGUF models, CPU/consumer GPU environments and offline eval work.
- **vLLM** — high-throughput self-hosted GPU serving with OpenAI-compatible APIs when NHMA has sustained volume that justifies GPU operations.
- **LiteLLM** — optional gateway when the project truly needs many providers, centralized budgets/load balancing and cost accounting. Do not add it merely because two providers exist.

## Production policy
- Never route a user-facing shopping decision to a volatile free public endpoint without an SLA/failure path.
- Keep a safe deterministic fallback for every critical route.
- Provider failure must not bypass product evidence gates.
- Record actual provider/model used, latency, retries and estimated cost.
- Never expose provider keys to browser code.
- Do not hard-code model names in many files; centralize provider configuration.

## Model evaluation before routing change
Compare candidate providers on NHMA's own eval set, not generic benchmark rank alone:
- Greek/Greeklish intent accuracy
- constraint retention
- JSON/schema validity
- product-identity judging
- multi-turn reference resolution
- latency p50/p95
- cost per successful decision

A cheaper model that causes more bad searches can be more expensive at the product level.

## Caching
Cache only safe, non-user-sensitive and sufficiently stable transformations. Do not cache live product prices/availability beyond their evidence freshness policy.

## Current NHMA stance
DeepSeek remains the intended primary reasoning path when a valid runtime credential is configured. Until then, deterministic planning/validation is the honest fallback. Do not claim an LLM is active when health checks say otherwise.
