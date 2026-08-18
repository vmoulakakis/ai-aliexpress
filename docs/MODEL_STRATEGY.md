# Model & Memory Strategy

## Objective
Minimize paid-token consumption while preserving strong reasoning only where it changes a sourcing decision.

## Runtime ladder
| Tier | Runtime | Thinking | Primary work |
|---|---|---|---|
| 0 | SQL / TypeScript / cache | n/a | filters, scores, EU gates, history |
| 1 | Qwen via free Groq tier when configured | off | intent, extraction, lightweight tool routing |
| 1-local | Qwen 3 8B / FunctionGemma / Gemma 3 | off | future local workers / vision / routing |
| 2 | DeepSeek V4 Flash | off | ambiguous semantic interpretation |
| 3 | DeepSeek V4 Pro | on, high | hard compatibility, red-team, high-value uncertainty |

OpenAI is not a runtime dependency.

## Thinking policy
- Thinking is OFF by default.
- Pro reasoning is allowed only after deterministic/free/Flash paths fail or a decision is explicitly high-risk/high-value.
- NightShift bulk work is deterministic-first.

## Shared memory
Supabase is authoritative memory. Models are replaceable workers.

- `sf_agent_events`: raw decisions and evidence.
- `sf_memory_items`: compact facts/lessons/policies; optional `vector(384)` embedding.
- `sf_merchant_observations`: seller history.
- `sf_offer_snapshots`: price/EU availability history.
- `sf_outcomes`: whether a recommendation solved the original pain.

Retrieval order: structured filters → keyword/full text → vector similarity → LLM only if still ambiguous.

## Free/open model candidates
- Qwen family: agent/tool workers.
- FunctionGemma: future tiny function router after task-specific tuning.
- Gemma 3: future local visual product QA / canonicalization.
- Supabase-native `gte-small`: embeddings without a paid external embedding API.

Free-provider limits are treated as opportunistic capacity, not a reliability dependency. If a free tier disappears, deterministic behavior still works and DeepSeek remains the controlled paid escalation.
