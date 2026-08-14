# NHMA AI Scout

General-purpose Greek-first shopping and product-discovery assistant backed by live Supabase NHMA services.

## Production UI

https://nhma-ai-scout-vassilis-projects-3bf8541b.vercel.app

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

## Publishing

`index.html` is the source-of-truth frontend. Pushes to `main` automatically run `.github/workflows/publish-nhma.yml`, which republishes the current UI artifact consumed by the production loader.

## Model routing

The backend is prepared for:

```text
DeepSeek V4-Pro + thinking → optional OpenAI fallback → safe deterministic fallback
```

Provider secrets must remain server-side. The current runtime automatically uses a configured provider when one exists; otherwise it stays in safe fallback mode rather than pretending an LLM call occurred.
