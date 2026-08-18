# EU Solution Foundry — Architecture V1

```text
                         ΕΛΛΗΝΙΚΗ ΑΓΟΡΑ
                 pains / gaps / user searches
                              │
                              ▼
                    🌙 NIGHTSHIFT FACTORY
                              │
      ┌───────────────────────┼────────────────────────┐
      ▼                       ▼                        ▼
 AliExpress Scout      EU Warehouse Verifier      Merchant Graph
 targeted queries      explicit shipFrom proof    seller history
      │                       │                        │
      └──────────────┬────────┴──────────────┬─────────┘
                     ▼                       ▼
               Product Enrich          Quality Red Team
                     │                       │
                     └───────────┬───────────┘
                                 ▼
                            LAB SOLUTIONS
                                 │
                                 ▼
                       Greek Competitor Gate
                   Skroutz / BestPrice evidence
                                 │
                ┌────────────────┼───────────────┐
                ▼                ▼               ▼
             CORE          stay LAB          ARCHIVE
         true/value gap     uncertain         commodity
                │
      ┌─────────┴───────────┐
      ▼                     ▼
 B2C Smart Search      B2B Opportunity Radar
      │                     │
      └──────────┬──────────┘
                 ▼
           Affiliate action
                 │
                 ▼
              Outcome
                 │
                 ▼
       Shared Institutional Memory
                 │
                 └──────────────► next NightShift
```

## Product UX
The user sees three concepts only:
1. Describe a problem or product.
2. Receive a tiny set of verified solutions.
3. Understand why a solution survived and open the offer.

Agents, model routing and pipeline states are backend concepts.

## Hard gates
- `ship_to=GR` is not EU warehouse proof.
- Relevance is evaluated before seller rating.
- LAB cannot be a consumer affiliate recommendation.
- CORE requires fresh EU evidence and high-confidence Greek gap/value evidence.
- Affiliate commission is evaluated only after product survival.

## Data moat
- Pain → solution decisions.
- Rejection history.
- Canonical product history.
- Merchant × category observations.
- EU warehouse stability.
- Local-market gap evidence.
- Outcomes and regret.
- Compact institutional lessons in shared memory.

## Model routing
SQL/rules first → Qwen/free worker when configured → DeepSeek V4 Flash (thinking OFF) → DeepSeek V4 Pro (thinking ON/high) only for hard cases. OpenAI is not part of the runtime path.

## Deployment
Primary: **Vercel + Supabase**. Fallback: **Cloudflare Workers + Supabase**. NightShift scheduling is owned by Supabase `pg_cron`, so frontend hosting can change without breaking sourcing.
