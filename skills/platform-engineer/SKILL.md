---
name: platform-engineer
description: Engineer and audit NHMA's Supabase, GitHub, Vercel, Edge Function, database, secret, CORS, rate-limit and production release infrastructure. Use for backend changes, migrations, deployment, security, observability and incident debugging.
---

# Platform Engineer

## Reliability boundary
Production claims must correspond to deployed, tested behavior. A successful code commit is not a successful production feature.

## Change workflow
1. Inspect current production version/config before editing.
2. Work on a branch when the change can be validated outside production.
3. For database/schema changes, prefer additive/backward-compatible migration first.
4. Run focused smoke/regression tests.
5. Promote a coherent batch, not every small edit.
6. Keep a known rollback commit/function version.

## Secrets
- Provider/API secrets stay in encrypted runtime secret managers.
- Never commit secrets to GitHub, HTML, client JS, screenshots or docs.
- Health endpoints expose booleans/capability state, not key values.
- Rotate credentials that were pasted into chat/source or otherwise exposed.

## Edge Functions
- Validate method/body/size.
- Bound external-call timeout and retry count.
- CORS is an explicit allowlist where feasible; preflight is tested.
- Service-role operations remain server-side.
- Public endpoints have rate limiting appropriate to abuse risk.
- Error responses distinguish configuration, upstream outage, zero results and invalid input.

## Database / memory
- Enable RLS on browser-reachable public-schema tables.
- Conversation data is not directly world-readable.
- Store canonical session/intent state server-side; browser localStorage is UX cache only.
- Add indexes based on actual query paths and advisor evidence, not speculative indexing.
- Run Supabase security/performance advisors after DDL changes.

## Affiliate/search resilience
- AliExpress availability does not imply the AI/provider is healthy and vice versa.
- Search calls are idempotent where practical.
- Promotion-link generation errors do not corrupt product identity/price facts.
- Log upstream latency/status while redacting credentials.

## Production acceptance
Require evidence for:
- endpoint HTTP status
- CORS preflight
- session memory persistence
- hard-constraint behavior
- public UI asset availability
- release workflow status
- security advisor critical errors

## Deployment discipline
NHMA has one canonical production URL. Do not create extra production projects/domains for ordinary revisions. Use preview/research branches and promote a single accepted batch.
