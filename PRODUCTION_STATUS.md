# AIgora — Production Status

Last release pass: 2026-08-17

## Production identity

- Brand: **AIgora**
- Positioning: AI demand intelligence + decision assistant for Greece / EU.
- Trust policy: EU warehouse evidence first, hard budget + whole-product identity gates, no irrelevant filler, explicit affiliate disclosure.
- Live UX signature: **AI Decision Room** — conversational research + visible verification state, not a cosmetic search box.

## Live frontend

- Production fallback host: `https://project25955.websitepublisher.ai`
- Hosting status: **published**
- WebsitePublisher project: `25955`
- Public pages include homepage, needs, premium, methodology, privacy, affiliate disclosure, buying brief and tracked redirect.
- Current design direction: warm bone background, ink typography, cobalt decision color, coral accent.
- Typography: Instrument Serif + Manrope.
- Homepage is pain-first: user can describe a problem in Greek, Greeklish or product terms and the Decision Room routes it into verified research.

## Supabase / AI shopping backend

Project: `bgvgstpoypqbjnemqcqp`

### Current public agent path

1. `aigora-agent-v2` — conversational / pain router used by the live Decision Room.
2. `nhma-intent` — deterministic/LLM-ready intent + structured constraints parser.
3. `aigora-search-v5` — strict whole-product verification wrapper.
4. `nhma-search-v4` — canonical EU discovery + official product detail / affiliate validation engine.
5. `nhma-eu-web-discover` — explicit AliExpress `shipFromCountry` evidence and retail title/image hints.
6. `aliexpress-affiliate` — official AliExpress product detail and affiliate link generation.
7. `nhma-engagement-v4` — research tokens, first-party outbound links, saves/events/leads/buying briefs.

### V5 identity rules

`aigora-search-v5` adds stricter product-family gates for robot vacuums, cordless vacuums, office chairs, projectors, power stations, standing desks, tower fans and CarPlay screens.

Example: a `robot vacuum` request rejects pet-grooming vacuums, hair dryers, handheld/cordless vacuums, pool/window cleaners, accessories and implausibly cheap whole-product candidates.

### Partial-evidence fallback

When AliExpress EU retail discovery verifies a whole product and EU warehouse but the official Affiliate Product Detail endpoint returns null, V5 may return a **partial-evidence** product only if:

- EU `shipFromCountry` proof exists,
- the retail title passes the strict whole-product identity gate,
- an official AliExpress affiliate destination can be generated.

For these products the UI does **not** fabricate commercial fields. It shows `Τιμή στο AliExpress` and explicitly marks price, feedback, sales, shipping and exact delivery as unknown until the final AliExpress page.

## Agent/provider truth

The recent advisor audit showed that the active intent/chat path is currently mostly `safe-deterministic / model:none`; a live DeepSeek/OpenAI planner credential was not observed in recent runs.

Therefore the production UI does **not** claim an LLM is reasoning when no LLM is configured. It labels the flow as an agentic router / V5 verification pipeline. The system remains genuinely functional through deterministic semantic routing, pain maps, context follow-ups and live AliExpress/EU verification.

## Acceptance checks after agent redesign

Real internal tests were executed through Supabase network calls:

- Greek: `Θέλω ρομποτική σκούπα για τρίχες σκύλου μέχρι 350 ευρώ` → strict robot-vacuum result; grooming/cordless contamination removed.
- Pain-first: `Θέλω κάτι για να μην πονάει η μέση μου όταν δουλεύω 8 ώρες στο γραφείο` → `ergonomic office chair`, not generic `office`; returns verified EU whole-product options using partial evidence when Product Detail is unavailable.
- Greeklish: `kanei poly zesti sto ypnodomatio kai den thelo egkatastasi` → `quiet tower fan / bladeless fan bedroom`, strict family result.
- Product-first: projector request to €500 → verified projector results.
- Follow-up context: `μέχρι 250 ευρώ` with established robot-vacuum context retains the product family and enforces the new budget.

Additional release behavior:

- Hard EU warehouse proof remains mandatory.
- Hard budget remains mandatory when detected.
- Wrong product family is rejected before ranking.
- No-results recovery is preferred over filler.
- Affiliate commission is not a relevance factor.
- Remote product text is escaped before browser rendering.
- Public homepage fetch succeeds from the WebsitePublisher hosting network.

## GitHub source of truth

Repository: `vmoulakakis/ai-aliexpress`.

The Next.js implementation in `main` remains the canonical application source. The current WebsitePublisher frontend is the live fallback presentation layer while the connected Vercel deployment connector cannot create a persistent project/deployment record.

The Supabase Agent V2 / Search V5 functions are currently deployed live and should be mirrored into the canonical repository before the next Vercel production migration.

## Vercel status

- Connected Vercel team previously reported 0 projects.
- Production initialization attempts became non-resolvable / 404 before project creation, including both commit-bootstrap and self-contained inline-source attempts.
- No duplicate active Vercel production project was left behind.

## Buying brief / email state on fallback hosting

- Buying briefs use `brief.html?t=<research-token>`.
- Tracked outbound redirects use `go.html?t=<outbound-token>`.
- Lead capture remains active and marketing consent remains separate.
- Automatic transactional email remains intentionally disabled from the fallback frontend because the older Edge email template emits `/brief/<token>`; this avoids sending a broken link.

## Security / disclosure gate

- No API secrets are present in browser assets.
- Client code contains only public Supabase Edge Function URLs.
- No admin/customer database is exposed from WebsitePublisher.
- Remote product titles/reasons are HTML-escaped before rendering.
- Lead email validation and rate limiting are server-side.
- Privacy and affiliate-disclosure pages are live.
- Synthetic activity is not presented as purchases or reviews.

## Next engineering action

Mirror `aigora-agent-v2` and `aigora-search-v5` into the canonical repository, then deploy the canonical Next.js `main` once when the Vercel project-creation connector is fixed. Retire or redirect the fallback rather than running duplicate production sites.
