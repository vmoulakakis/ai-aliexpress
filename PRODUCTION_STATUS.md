# NHMA AI Scout — Production Status

Last acceptance pass: 2026-08-14

## Live architecture

- `nhma-chat` — independent conversation endpoint with persistent server-side memory.
- `nhma-intent` — product intent and constraints layer.
- `nhma-search` — live retrieval, hard constraints, product-identity validation and ranking.
- `aliexpress-affiliate` — live AliExpress affiliate retrieval.
- `nhma-health` — safe capability status.
- `index.html` — browser UI source of truth.
- `.github/workflows/publish-nhma.yml` — automatic UI artifact publishing after frontend changes.

## Acceptance checks passed

- Independent chat and Smart Search use separate endpoints.
- Stable session ID persists across search and chat.
- Server-side conversation memory survives multiple turns.
- Greek / Greeklish product intent works in safe fallback mode.
- Budget is enforced as a hard local constraint even when upstream results violate it.
- Office-chair search rejects footrests, cushions, pads, parts, implausible low-price variants and unrelated stools/saddles.
- Robot-vacuum search rejects parts, hooks, pool/window cleaners and sub-€20 accessory contamination when a whole appliance was requested.
- If no relevant whole-product result survives, the API returns an empty product list rather than irrelevant filler.
- Camera/photo UI exists and sends image data to the search endpoint.
- Product UI renders only fields returned by the backend and does not fabricate stock, shipping, delivery, EU warehouse, warranty or review facts.
- GitHub publish workflow completed successfully after setup.
- Temporary diagnostic Edge Functions were locked behind JWT / deprecated after testing.

## Current provider state

The application is wired for:

`DeepSeek V4-Pro + thinking -> optional OpenAI fallback -> safe deterministic fallback`

At the time of this acceptance pass, no live DeepSeek/OpenAI/Kimi provider credential was available in either inspected Supabase runtime. The application therefore correctly remains in safe deterministic fallback mode rather than claiming an LLM call occurred.

No provider secret is committed to this repository.

## Current image-search state

The AliExpress live integration is configured. Direct AliExpress image-search activation still depends on the required server-side image-search credential/signature. Until present, photo flow degrades safely and asks for minimal textual identification instead of generating fake matches.

## Production UI

`https://nhma-ai-scout-vassilis-projects-3bf8541b.vercel.app`
