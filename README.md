# Λύσεις ΕΕ — EU Solution Foundry

Greek-first B2C + B2B agentic sourcing system for problem-solving products fulfilled from EU warehouses.

## Product rule
We do not expose a generic AliExpress catalog. A solution reaches `CORE` only after EU availability, product quality, merchant quality and Greek-market gap checks.

## Two engines

### 🌙 NightShift
Heavy sourcing and evaluation happens offline: pain discovery → AliExpress sourcing → canonical products → merchant intelligence → EU gate → quality/red-team → Greek gap → CORE/LAB/WATCH.

### ☀️ Day Search
Fast Greek smart search with product dropdown. SQL retrieval first; DeepSeek only when deterministic retrieval is weak.

## AI cost policy
- No OpenAI provider in production routing.
- `deepseek-v4-flash`: extraction/classification/intent.
- `deepseek-v4-pro`: rare ambiguous or high-risk finalists only.
- SQL/code gates before any LLM call.
- Store model usage in `sf_model_usage`.

## Consumer UX
One search box accepts product queries or human problems. Results are limited to verified survivors and show EU warehouse, delivery evidence, merchant score and affiliate disclosure.

## B2B UX
`/emporoi` exposes opportunities scored by Greek demand, local gap, merchant strength and commercial margin signal.

## Stack
Next.js 16 + React 19 → Supabase PostgreSQL → AliExpress Affiliate API → DeepSeek V4. Deployment target: Vercel. Cloudflare Workers/OpenNext is the fallback option.

## Local setup
```bash
cp .env.example .env.local
npm install
npm run typecheck
npm run dev
```

## Database
Canonical migration: `supabase/migrations/20260818_foundry_reset.sql`.

## Roles
Operational agent contracts live in `docs/roles/`. Keep prompts small: load only the role needed for the current stage.
