# EU Scout Next V3 — Interaction Architecture

## Two independent AI surfaces

### Smart Search Agent
- Primary product-finding surface.
- Accepts natural Greek/Greeklish/free-text or a demand-family shortcut.
- Natural text is sent to the semantic intent/search pipeline; the normalized live query is shown back as **Έψαξα ως**.
- Search remains general-purpose even while the homepage is running the Back-to-School campaign.
- Search results must be homogeneous to the requested product identity; parts/accessories cannot replace the main product.

### AI Shopping Advisor
- Separate conversational endpoint and UI.
- Used for comparison, trade-offs, follow-up reasoning and persistent criteria.
- May invoke live search when needed, but is not the Smart Search UI.
- Product recommendations inside chat are **vertical stacked cards**, never a horizontal carousel.

## Demand families

The homepage does not present a flat category directory. It presents families of related jobs/needs. During Back-to-School these include:

1. Τσάντα & ό,τι μπαίνει μέσα
2. Μελέτη στο σπίτι
3. Tech για μάθημα και εργασία
4. Lunch & hydration
5. Οργάνωση σχολικής καθημερινότητας
6. Άνεση / μικρά απρόοπτα

Each family has a thematic visual placeholder plus several homogeneous sub-needs. Clicking one sub-need creates a composed query using class, budget and price/speed priority.

## Seasonal shell

- July–September: Back-to-School visual/copy/demand configuration.
- From October: general Smart Shopping visual/copy/demand configuration.
- The underlying product-search architecture does **not** change with the campaign.
- Thematic placeholders are deliberate temporary visual slots and can later be replaced with campaign illustrations/assets without changing the information architecture.

## Parent psychology for Back-to-School

Default job:

`finish the list quickly + stay within budget + avoid the wrong product + understand delivery trade-offs`

Therefore:
- no prompt-engineering language,
- no “tell me your problem” hero,
- class/budget/priority entered once,
- one-click need searches,
- small relevant consideration set,
- normalized query shown for transparency,
- compare/save only after results,
- chat stays secondary and dismissible.
