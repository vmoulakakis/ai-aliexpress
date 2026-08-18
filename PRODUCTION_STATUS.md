# EU Solution Foundry — Production Status

Status date: 2026-08-19 (Europe/Athens)

## Canonical source
- Repository: `vmoulakakis/ai-aliexpress`
- Branch: `main`
- V1 merged via PR #2.
- NightShift job-auth hardening merged via PR #3.
- CI passed typecheck + Next production build.
- Next.js `16.2.11`, React / React DOM `19.2.4`.

## Product surfaces
- Greek B2C homepage: pain/product smart search, human-problem cards, CORE-only offers, EU proof messaging, smart notification panel.
- Greek B2B `/emporoi`: LAB/CORE Opportunity Radar + Merchant Intelligence.
- Aggregate `/admin` status dashboard in canonical Next app.
- Temporary public mirror uses WebsitePublisher project 25955 while Vercel MCP deployment is unreliable.
  - `https://project25955.websitepublisher.ai/`
  - `/emporoi.html`
  - `/status.html`

## Backend
Supabase project: `bgvgstpoypqbjnemqcqp` (`eu-west-1`).

Live Edge workers:
1. `foundry-nightshift`
2. `foundry-eu-verify`
3. `foundry-enrich`
4. `foundry-curate`
5. `foundry-greek-gap`
6. `foundry-memory`
7. public `foundry-search`

Internal NightShift workers require a server-generated `x-foundry-token`. The token is stored in an RLS-protected internal table and is inserted into requests only by Supabase cron. Public calls without the token return 401. `foundry-search` remains public and rate-limited.

## Nightly schedule
UTC schedule (summer Athens ≈ +3h):
- 00:30 sourcing
- 00:35 explicit EU proof
- 00:40 Affiliate Product Detail enrichment
- 00:45 relevance / quality / merchant curation
- 00:50 Greek market gap gate
- 01:00 memory curator

## Model policy
1. SQL / TypeScript / cache first.
2. Qwen through a free provider when `GROQ_API_KEY` is configured.
3. DeepSeek V4 Flash with thinking OFF when configured.
4. DeepSeek V4 Pro with thinking ON/high only for difficult cases.
5. OpenAI is not a runtime dependency.

Provider secrets are intentionally not committed to GitHub. A DeepSeek key pasted into chat must be rotated before production use and installed through a proper secret-management interface.

## First controlled smoke run
Run: `84326589-6cb1-477c-addf-fd941b9772c2`
- 6 Greek pain families
- 12 targeted English sourcing queries
- 290 Affiliate API candidates
- 0 sourcing API errors
- 33 EU retail proof requests (ES/PL/FR)
- 3 explicit EU-verified candidates
- 3 products enriched in 1 batched Product Detail call
- 2 valid LAB solutions remain after the CarPlay no-radio rule was tightened
- Greek gap check promoted 0 because evidence was insufficient; uncertain solutions correctly remain LAB
- Current public status: CORE 0, LAB 2, products 3, active merchants 2, EU offers 3
- AI tokens/cost for the run: 0

## Hard gates
- `ship_to=GR` is never treated as EU warehouse proof.
- EU warehouse evidence uses an explicit AliExpress `shipFromCountry` retail result intersected with the exact Affiliate candidate IDs for the same pain/query.
- Relevance is checked before seller score.
- LAB is never a consumer affiliate recommendation.
- CORE requires a high-confidence Greek true-gap or material value-gap decision.
- Affiliate commission is never part of the survival eligibility score.
- Unknown/blocked competitor evidence stays LAB instead of being promoted.

## Deployment
Preferred target remains Vercel + Supabase. The connected Vercel MCP repeatedly creates deployment IDs that immediately disappear (404 and zero listed projects), so no Vercel URL is claimed as live. WebsitePublisher is the temporary frontend mirror; GitHub/Next remains canonical.
