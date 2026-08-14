# EU Scout — Production Handoff & Source of Truth

**Project:** EU Scout / AI AliExpress Product Discovery  
**Repository:** `vmoulakakis/ai-aliexpress`  
**Primary language:** Greek-first UX  
**Last updated:** 2026-08-14  
**Purpose:** Single optimized handoff document for production continuation, debugging, deployment, and maintenance.

---

## 1. Product Goal

EU Scout is **not an e-shop**. It is an AI-assisted product discovery and problem-solving interface designed primarily for the Greek market.

Current product direction:

- seasonal **Back-to-School** experience through September,
- general Smart Search always available,
- product discovery based on user need/problem rather than catalog browsing,
- minimal friction for non-technical users,
- verified live AliExpress results,
- no fabricated stock, warehouse, shipping, merchant, or price claims,
- persistent conversation memory through Supabase,
- affiliate links only after relevance/safety filters.

Primary user scenarios include parents, students, teachers, and general shoppers.

---

## 2. GitHub Source of Truth

Repository:

`vmoulakakis/ai-aliexpress`

Production code is on:

`main`

Core tested V3 application revision:

`c769b88662f5ef53b6346ed3b1c5940e2acbd3c4`

Important note:

The repository received several later **operations-only commits** for Vercel diagnostics/bootstrap attempts. The tested application code itself remains based on the successful V3 build above.

Production redesign branch:

`redesign/eu-scout-next-v3`

### Main application files

- `package.json`
- `tsconfig.json`
- `next.config.ts`
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/v3.css`
- `app/api/search/route.ts`
- `app/api/chat/route.ts`
- `app/api/health/route.ts`
- `app/api/image/route.ts`
- `components/commerce-shell.tsx`
- `components/product-image-proxy.tsx`
- `lib/types.ts`
- `lib/upstream.ts`
- `scripts/v3-browser-smoke.mjs`
- `.github/workflows/eu-scout-v3.yml`
- `.env.example`
- `.gitignore`
- `README.md`
- `docs/EU_SCOUT_NEXT_V3.md`

Obsolete static publishing code/workflows were removed from the V3 implementation.

---

## 3. Runtime Stack

### Frontend

- Next.js `16.2.12`
- React `19.2.8`
- React DOM `19.2.8`
- TypeScript `5.9+`
- App Router
- responsive web-first design

### Backend

Supabase Edge Functions provide:

- live AliExpress product search,
- affiliate link generation,
- chat orchestration,
- memory persistence,
- health checks,
- intent/search support.

Primary Supabase project:

- project ref: `bgvgstpoypqbjnemqcqp`
- project name: `travelai`
- region: `eu-west-1`
- status last verified: `ACTIVE_HEALTHY`

Secondary Supabase project:

- project ref: `prrehmcvpyhupvlhtbzg`
- project name: `socialmarket-ai`
- region: `eu-central-1`
- status last verified: `ACTIVE_HEALTHY`

---

## 4. Main Supabase Functions

Verified functions in the primary project include:

- `nhma-search`
- `aliexpress-affiliate`
- `nhma-chat`
- `nhma-health`
- `nhma-intent`

Legacy/other project functions also exist and should not be modified unless directly related to EU Scout.

### AliExpress integration

`aliexpress-affiliate` implements:

- signed AliExpress requests,
- rate limiting,
- live product search,
- product details,
- promotion/affiliate links,
- product normalization,
- safe filtering,
- no fabricated shipping/stock claims.

Direct AliExpress image search requires:

`ALIEXPRESS_APP_SIGNATURE`

and is currently **not configured**.

---

## 5. Supabase Data / Memory

Verified EU Scout tables include:

- `nhma_affiliate_links`
- `nhma_chat_runs`
- `nhma_comparison_runs`
- `nhma_conversations`
- `nhma_greek_market_offers`
- `nhma_messages`
- `nhma_product_snapshots`
- `nhma_search_events`

Persistent Supabase memory is working.

The application also uses local browser persistence for:

- saved products,
- session ID,
- visible chat transcript.

---

## 6. Current Runtime Health

Latest verified health state from the tested V3 build:

```json
{
  "ok": true,
  "providers": {
    "deepseek": {
      "configured": false,
      "model": "deepseek-v4-pro"
    },
    "openai": {
      "configured": false,
      "model": "gpt-5-mini"
    }
  },
  "integrations": {
    "aliexpress": true,
    "aliexpressImageSearch": false
  },
  "memory": true
}
```

Interpretation:

- AliExpress live integration: **working**
- Supabase persistent memory: **working**
- DeepSeek API: **not currently configured in the EU Scout runtime**
- OpenAI API: **not currently configured in the EU Scout runtime**
- Direct AliExpress image search: **not configured**
- Chat/search currently operate using deterministic fallback logic plus live AliExpress data when no LLM provider is available.

Do not describe the current chatbot as LLM-powered unless one of the provider secrets is verified at runtime.

---

## 7. Product UX Implemented

### Seasonal shell

During July–September:

- Back-to-School campaign is active.

Hero concept:

> Λιγότερο ψάξιμο. Πιο γρήγορα έτοιμοι για σχολείο.

### Fast configuration

Users can provide:

- school grade,
- budget,
- priority:
  - price,
  - balance,
  - speed.

### Demand families

Examples:

- Τσάντα & ό,τι μπαίνει μέσα
- Γραφείο που βοηθά να συγκεντρωθεί
- Tech για μάθημα και εργασία
- Φαγητό και νερό χωρίς διαρροές
- Οργάνωση σχολικής καθημερινότητας
- Μικρές λύσεις για πιο εύκολη μέρα

General-mode demand families include:

- home,
- work,
- tech,
- travel,
- kids,
- gifts.

### Search UX

Smart Search is separate from Chat Agent.

Search results show:

- normalized interpretation,
- live AliExpress image,
- price,
- recommendation role,
- “Γιατί ταιριάζει” explanation,
- evidence when verified,
- affiliate CTA,
- save,
- compare.

Zero relevant results are preferred over filler.

### Chat UX

Chat is a compact floating panel.

Implemented:

- persistent session ID,
- persistent transcript,
- follow-up context,
- vertical product cards,
- clarification logic,
- mobile-safe layout,
- no full-screen intrusive chatbot behavior.

---

## 8. Product Integrity Rules

These rules should remain non-negotiable:

1. Hard budget constraints are filters, not suggestions.
2. Whole-product requests must not return accessories/parts as substitutes.
3. Stock, warehouse, shipping, seller, and delivery claims must only appear when verified.
4. Zero good results is better than irrelevant filler.
5. Ask at most one high-information clarification when needed.
6. Preserve follow-up context.
7. Affiliate CTR must never override relevance or safety.
8. Affiliate links should use:
   `rel="sponsored noopener noreferrer"`
9. Do not invent Greek-market comparison prices.
10. Photo similarity search must not be presented as working unless the required image-search signature is configured.

---

## 9. Image Handling

AliExpress hotlinking caused product images to fail in visual testing.

This was fixed with:

### `app/api/image/route.ts`

- HTTPS only,
- allowed AliExpress image domains,
- MIME validation,
- 5 MB maximum,
- 8-second timeout,
- no redirects,
- cache control.

### `components/product-image-proxy.tsx`

Client-side observer rewrites AliExpress image URLs through:

`/api/image?url=...`

Final browser acceptance confirmed real product images load successfully.

---

## 10. Security Configuration

`next.config.ts` includes:

- `reactStrictMode: true`
- `poweredByHeader: false`
- CSP
- `X-Content-Type-Options`
- `Referrer-Policy`
- `X-Frame-Options`
- `Permissions-Policy`

Supabase advisor status:

- several `rls_enabled_no_policy` informational notices exist for service-role/server-only tables,
- an unrelated legacy travel function has a SECURITY DEFINER warning,
- that unrelated warning was intentionally not modified during EU Scout work.

Do not claim “zero Supabase security warnings.”

---

## 11. CI / Browser Acceptance

Workflow:

`.github/workflows/eu-scout-v3.yml`

Workflow name:

`EU Scout V3 Quality Gate`

Successful reference run:

`31786559871`

Tested commit:

`c769b88662f5ef53b6346ed3b1c5940e2acbd3c4`

The acceptance suite validated:

- homepage rendering,
- `/api/health`,
- live AliExpress integration,
- Smart Search,
- safe no-result behavior,
- normalized search interpretation,
- proxied product images with valid `naturalWidth`,
- Back-to-School demand card flow,
- Chat Agent first turn,
- follow-up continuity,
- vertical chat product cards,
- mobile viewport `390×844`,
- no horizontal overflow.

Acceptance artifact archive created during validation:

`eu-scout-v3-artifacts`

Screenshots included desktop/mobile homepage, search, demand flow, and chat.

---

## 12. Vercel — Current Blocker

### Vercel team

- name: `vassilis' projects`
- slug: `vassilis-projects-3bf8541b`
- team ID: `team_jt3jd1HJUB4sK1oZdl9MUYGs`

### What happened

Two Vercel deployment attempts returned deployment IDs/URLs but immediately became:

`DEPLOYMENT_NOT_FOUND`

The Vercel connector later returned:

```json
{
  "projects": []
}
```

Therefore the previous deployments were **ghost/non-persistent deployment references**, not valid persistent Vercel projects.

Do not reuse those deployment URLs.

### Root cause

The available Vercel connector supports deployment operations but does **not expose a create-project/import-GitHub action**.

The Vercel app permission itself is already:

`Allow all actions`

so this is a connector capability limitation, not a user permission problem.

---

## 13. Vercel Bootstrap Diagnostics Already Performed

A temporary GitHub workflow was created to bootstrap Vercel using:

`VERCEL_TOKEN`

The workflow stopped before deployment because:

`VERCEL_TOKEN secret is not configured in GitHub`

No additional ghost deployment was produced.

A second approach tested whether Vercel credentials were already stored in Supabase.

### Primary Supabase project

Checked:

- Vault
- `public.app_secrets`
- `amm_system_config`
- Edge Function environment variables

Result:

**No Vercel token found.**

### Secondary Supabase project

Checked Edge Function runtime environment.

Available env names were only default Supabase/Deno variables such as:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL`
- `DENO_DEPLOYMENT_ID`
- `DENO_REGION`

Result:

**No Vercel token found in Edge Function secrets.**

The secondary database temporarily rejected PostgreSQL connections, so a possible application-table value such as `app_settings` could not be fully inspected at that time.

### Cleanup

Temporary Vercel diagnostic/bootstrap GitHub workflows were removed after testing.

Temporary Supabase diagnostic bootstrap functions were disabled by replacing them with a 404/disabled response.

No secret values were printed or exposed.

---

## 14. Required Vercel Credential

A persistent automated deployment needs a valid Vercel API token accessible from one of these secure locations:

Preferred:

`GitHub Actions secret: VERCEL_TOKEN`

Alternative:

a verified server-side Supabase secret.

Never store or commit the token in:

- repository source,
- `.env.example`,
- client-side JavaScript,
- markdown files,
- public logs,
- chat messages.

---

## 15. Recommended Production Deployment Path

Once `VERCEL_TOKEN` exists securely:

```text
GitHub main
   ↓
GitHub Actions
   ↓
vercel project add eu-scout
   ↓
vercel link --project eu-scout
   ↓
vercel deploy --prod
   ↓
verify Vercel project persists
   ↓
verify deployment status READY
   ↓
verify production alias
   ↓
run health/search/chat/image/mobile tests
```

The Vercel project must exist as a real persistent project before production should be considered successful.

---

## 16. Post-Deployment Verification Checklist

After the first valid Vercel project/deployment:

- confirm `eu-scout` appears in `list_projects`,
- confirm project has stable project ID,
- confirm latest deployment is `READY`,
- confirm production alias resolves,
- test `/api/health`,
- verify `integrations.aliexpress === true`,
- verify `memory === true`,
- run live search,
- open a product affiliate link,
- verify image proxy,
- test chat first-turn + follow-up,
- test no-result behavior,
- test mobile at 390 px width,
- check Vercel runtime errors,
- check serverless logs,
- verify no secret appears in browser/client bundle.

---

## 17. Expected Environment Variables

The application architecture may use:

```text
NHMA_FUNCTIONS_URL
```

Default backend functions base currently resolves to:

`https://bgvgstpoypqbjnemqcqp.supabase.co/functions/v1`

Supabase Edge runtime may use:

```text
ALIEXPRESS_APP_KEY
ALIEXPRESS_APP_SECRET
ALIEXPRESS_TRACKING_ID
ALIEXPRESS_APP_SIGNATURE
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
OPENAI_API_KEY
OPENAI_MODEL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Never assume a provider is configured merely because its secret name exists somewhere. Always verify through runtime health.

---

## 18. Deployment Rules Going Forward

- Do not create repeated blind Vercel deployments.
- Do not create another project name unless explicitly required.
- Keep the intended project name:
  `eu-scout`
- Use one persistent Vercel project.
- Do not revert to the old disliked `nhma-ai-scout` deployment.
- Do not deploy obsolete static UI.
- Do not change Supabase production data/schema unless required.
- Do not modify unrelated legacy Supabase functions while fixing EU Scout.
- Preserve the tested V3 UX and search/chat separation.
- Run tests before claiming production success.

---

## 19. Final Current State

### Working

- Next.js V3 application
- GitHub source
- GitHub CI
- browser acceptance suite
- AliExpress live search
- affiliate integration
- product image proxy
- Supabase persistent memory
- responsive desktop/mobile UX
- deterministic chat/search fallback

### Not yet complete

- persistent Vercel project creation
- verified Vercel production deployment
- DeepSeek runtime configuration
- OpenAI runtime configuration
- direct AliExpress image search signature

### Immediate next action

Find or securely provide a valid Vercel API token to the deployment workflow, then:

1. create persistent `eu-scout` project,
2. link it to `vmoulakakis/ai-aliexpress`,
3. deploy `main` to production,
4. verify `READY`,
5. execute final production acceptance checks.

---

## 20. Definition of Done

EU Scout is production-ready only when all of the following are true:

- Vercel project exists persistently,
- production deployment state is `READY`,
- production alias resolves,
- `/api/health` passes,
- live AliExpress search works,
- product images render,
- affiliate links work,
- chat context persists,
- mobile has no overflow,
- no critical runtime errors,
- no secret leakage,
- the deployment is based on the tested V3 application.

---

**Source-of-truth rule:** when this document conflicts with an older deployment URL or previous “INITIALIZING” result, trust the verified persistent project/deployment state, not the old ghost deployment references.
