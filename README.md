# EU Scout V3

Greek-first AI shopping decision assistant built with **Next.js 16 + React 19 + TypeScript**, backed by live Supabase Edge Functions and the official AliExpress affiliate integration.

## Product model

EU Scout is not a generic e-shop and not a chat-only interface. It has two independent but interoperable tools:

```text
Browser / Next.js
├── Smart Search Agent
│   └── /api/search → Supabase nhma-search → nhma-intent → AliExpress live
└── AI Shopping Advisor
    └── /api/chat → Supabase nhma-chat → persistent conversation memory
                         └── invokes Smart Search when live products are needed
```

The same browser session UUID is shared by both paths, so search and chat can preserve user context without becoming the same UI.

## Current campaign experience

From July through September the homepage uses a **Back-to-School campaign shell**:

- grade selection
- optional per-product budget
- value / balanced / faster-delivery preference
- demand families such as school carry, study setup, student tech, lunch/hydration and daily organization
- one-click sub-needs that build a semantic query automatically

Outside the campaign window the shell switches to general shopping demand families. Free-text Smart Search remains general-purpose at all times.

## Decision and trust rules

- explicit budget is a hard constraint, not a ranking hint
- whole-product requests reject accessories/parts unless explicitly requested
- zero relevant products is preferred over irrelevant filler
- stock, EU warehouse, delivery, shipping, ratings and discounts are shown only when the live source supports them
- external product links prefer the generated AliExpress affiliate promotion URL
- affiliate links use `rel="sponsored noopener noreferrer"`
- product images are relayed through a strict same-origin image proxy limited to approved AliExpress media hosts

## Supabase runtime

Primary project: `bgvgstpoypqbjnemqcqp`.

Active application functions used by this frontend:

- `nhma-search`
- `nhma-intent`
- `nhma-chat`
- `nhma-health`
- `aliexpress-affiliate`

Persistent NHMA tables include conversations, messages, chat runs, search events, comparison runs, affiliate links and product snapshots.

Provider credentials remain server-side in Supabase. The runtime health endpoint exposes only boolean configuration status; it never returns secret values.

## Local development

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

Optional environment override:

```bash
NHMA_FUNCTIONS_URL=https://<project>.supabase.co/functions/v1
```

When omitted, the app uses the production Supabase functions base configured in `lib/upstream.ts`.

## Release gate

`.github/workflows/eu-scout-v3.yml` runs on the V3 branch and must pass before deployment:

1. install
2. TypeScript check
3. Next.js production build
4. headless browser acceptance
5. live Supabase health relay
6. live general semantic search
7. Back-to-School demand-family search
8. independent two-turn chat continuity
9. vertical chat product-card layout
10. product-image proxy loading
11. 390px mobile overflow check

Visual screenshots and health evidence are uploaded as a CI artifact.

## Deployment

Deployment target: **Vercel**, after the release gate is green. The Vercel version should remain the exact implementation of this repository revision rather than a separately edited frontend.
