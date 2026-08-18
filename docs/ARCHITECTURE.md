# Architecture

```text
Greek demand / pains                  AliExpress supply
        │                                    │
        └──────────────┐      ┌──────────────┘
                       ▼      ▼
                    NightShift
                       │
  Scout → Canonicalize → Merchant → EU Gate → Quality → Greek Gap
                       │
                 CORE / LAB / WATCH
                       │
              Supabase Solution Graph
                 ┌─────┴─────┐
                 ▼           ▼
             B2C Search    B2B Radar
                 │           │
                 └─────┬─────┘
                       ▼
                 Affiliate click
                       │
                       ▼
                    Outcome
                       │
                       └────► next NightShift
```

## Runtime principles
- NightShift is batch-first and idempotent.
- Day requests never launch full sourcing.
- Only live price/stock verification may run synchronously for finalists.
- Every expensive stage consumes a narrowed candidate set.
- No claim is displayed without stored evidence.

## Pools
- `CORE`: publishable verified solutions.
- `LAB`: promising but missing confidence/evidence.
- `WATCH`: emerging supply/merchant signals.
- `ARCHIVE`: lost EU stock, became commodity, or failed quality/outcome gates.

## Scoring separation
`Survivor Score` optimizes consumer value. `Commercial Score` is calculated only after survival and can choose between otherwise equivalent offers. Affiliate commission never rescues a weak product.

## Deployment
**Primary: Vercel + Supabase.** Native Next.js deployment and Git previews minimize operational burden.

**Fallback: Cloudflare Workers + Supabase.** Strong global runtime but Next.js requires OpenNext and production-runtime testing.
