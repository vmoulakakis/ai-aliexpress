# AIgora — Production Status

Last release pass: 2026-08-17

## Production identity

- Brand: **AIgora**
- Positioning: AI demand intelligence + semantic shopping assistant for Greece / EU.
- Trust policy: EU warehouse evidence first, hard budget and identity gates, no irrelevant filler, explicit affiliate disclosure.

## Live architecture

### Frontend

- Production fallback host: `https://project25955.websitepublisher.ai`
- Hosting status: **published**
- WebsitePublisher project: `25955`
- Public pages include homepage, needs, premium, methodology, privacy, affiliate disclosure, buying brief and tracked redirect.
- Shared design system: Sora + Manrope, deep-indigo / EU-trust palette.

### Supabase / AI shopping backend

Project: `bgvgstpoypqbjnemqcqp`

- `nhma-search-v4` — canonical demand/search pipeline, EU evidence discovery, official product detail validation, hard budget + identity gates.
- `nhma-engagement-v4` — persistent research objects, first-party outbound tokens, engagement events and leads.
- `aliexpress-affiliate` — official AliExpress affiliate product search/detail/link generation.
- `nhma-intent` — intent and constraints fallback layer.
- `nhma-health` — safe capability status.

## Release gates passed

- TypeScript / production build gate passed before merge.
- 1000 / 1000 semantic simulation cases passed.
- EU warehouse proof gate passed.
- Official AliExpress affiliate bridge passed.
- Truthful activity policy passed: synthetic CI events are not exposed as social proof.
- Hard budget and whole-product identity rules passed.
- Recovery returns zero relevant results instead of filler when no product survives all gates.
- Browser acceptance / duplicated selector failures were corrected before merge.
- AIgora brand and EU-first hero were applied before release.
- Public WebsitePublisher homepage was fetched successfully by the hosting network after publish.

## GitHub source of truth

Repository: `vmoulakakis/ai-aliexpress`

The Next.js AIgora implementation remains the canonical application source in `main`.

The WebsitePublisher deployment is a static-hosting-compatible production fallback using the same Supabase / AliExpress backend while the Vercel deployment connector is unable to create a persistent project/deployment record in the connected Vercel account.

## Vercel status

- Connected Vercel team previously reported **0 projects**.
- Multiple production initialization attempts returned deployment IDs but immediately became non-resolvable / 404 before project creation.
- The failure reproduced with both commit-bootstrap and self-contained inline source, isolating the problem to the deployment connector/project-creation path rather than the AIgora build.
- No duplicate active Vercel production project was left behind.

## Buying brief / email state on fallback hosting

- Buying briefs are available through the public `brief.html?t=<research-token>` flow.
- Tracked outbound redirects use `go.html?t=<outbound-token>`.
- Lead capture remains active through `nhma-engagement-v4` and marketing consent stays separate.
- Automatic transactional email delivery is intentionally disabled from the WebsitePublisher fallback frontend because the existing Edge email template still emits the original path-style `/brief/<token>` URL. This prevents sending a broken link.

## Security / disclosure gate

- No API secrets are present in browser assets.
- Client code contains only public Supabase Edge Function URLs.
- No admin/customer database is exposed from WebsitePublisher.
- Remote product text is escaped before rendering.
- Lead email validation and rate limiting are server-side.
- Affiliate and privacy pages are live.
- Affiliate commission is not used as a relevance ranking factor.

## Next hosting action

When the Vercel connector/project-creation issue is resolved, deploy the canonical Next.js `main` once to Vercel and then retire or redirect the WebsitePublisher fallback. Do not create parallel duplicate production projects.
