# NHMA AI Scout

General-purpose Greek-first shopping and product-discovery assistant backed by live Supabase NHMA services.

## Production UI

https://nhma-ai-scout.vercel.app/

The canonical production URL above remains on the current `main` release. V2 research and redesign work is isolated on `research/agentic-commerce-v2` until its release gates pass and one tested batch is promoted.

## Architecture

The conversational assistant and product search are intentionally independent:

```text
Browser
├── Smart Search → nhma-search → nhma-intent → AliExpress live
└── NHMA Chat    → nhma-chat → persistent memory → Smart Search when needed
```

- `nhma-search` — retrieval, constraints, product-identity validation and ranking
- `nhma-intent` — Greek/Greeklish product intent and structured constraints
- `nhma-chat` — independent multi-turn conversational assistant
- `nhma-health` — safe availability status
- stable session UUID persisted in the browser
- durable server-side conversation state in Supabase
- camera/photo input supported; direct AliExpress image search activates only when its server credential exists

No mock products are used. Product cards render only backend results. Missing stock, delivery, warehouse, shipping, warranty, discounts or ratings are never invented.

## Agent skills

Project-specific operating guidance lives in `AGENTS.md` and `skills/*/SKILL.md`. Skills cover commerce UX, conversational shopping, product evidence, affiliate growth, demand marketing, agentic orchestration, model routing, platform engineering, evals, performance and accessibility.

## Quality gates

The V2 branch includes `evals/shopping-regressions.json` and `scripts/validate-v2.mjs`. GitHub Actions validates frontend JavaScript syntax, key decision-UX features, DOM ID integrity and regression-suite structure before promotion.

## Publishing discipline

`index.html` is the source-of-truth frontend. Production publishing remains tied to `main`; research-branch edits do **not** create production deployments. Promote one accepted batch instead of deploying every edit.

## Model routing

The backend is prepared for:

```text
DeepSeek V4-Pro + thinking → explicitly configured fallback → safe deterministic fallback
```

Provider secrets must remain server-side. The current runtime automatically uses a configured provider when one exists; otherwise it stays in safe fallback mode rather than pretending an LLM call occurred.
