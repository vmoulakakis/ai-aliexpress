# EU Solution Foundry — Solution-First 100-Profile Audit

Status: source correction audit only. No production deployment is part of this change.

## Goal

Keep CORE/LAB evidence gates strict while removing the user dead-end where `no verified product` was experienced as `no solution`.

The test asks one question only: **does a person with a real problem leave with a safe, concrete next action even when strict product matching is empty?**

## Profile matrix

100 deterministic profiles were exercised: 10 variants in each of 10 problem families.

1. weak/partial home Wi-Fi
2. hot room / no permanent A/C
3. pet hair on sofa/carpet/floor
4. laptop/home-office ergonomics
5. small/rented-space storage
6. CarPlay/Android Auto for older cars
7. humidity/condensation/mould
8. UPS / router / laptop power backup
9. stairs / elderly or mobility difficulty
10. vague/general problem where the user does not yet know what product they need

The wording set deliberately mixes Greek, English, Greeklish-like phrasing, accents, product names, outcome language and compound queries such as `UPS for router`, `humidity behind wardrobe`, and `weak signal home office`.

## First pass feedback

Initial deterministic intent matching classified **82/100** correctly.

Main failure patterns:

- product overlap caused wrong routing: `UPS for router` looked like Wi-Fi;
- context overlap caused wrong routing: `weak signal home office` looked ergonomic;
- accented Greek variants such as `σκάλες` were missed;
- humidity behind a wardrobe could be mistaken for storage;
- generic heat phrases such as `ζέστη στον ύπνο` were under-recognized.

These were treated as product defects, not as acceptable model uncertainty.

## Corrections applied

- precedence now routes power failure before Wi-Fi hardware;
- humidity/water-cause language is evaluated before storage language;
- mobility patterns support accented/unaccented Greek forms;
- Wi-Fi detection covers weak-signal and room-context wording;
- heat detection covers outcome wording, not only device terms;
- every recognized family includes a manual/diagnostic path before purchase;
- risk-sensitive categories include an explicit safety boundary;
- unknown/general input returns a clarification plan plus an immediate low-risk action instead of an empty catalogue.

Post-correction deterministic classification: **100/100 on this fixed suite**.

This does **not** claim universal natural-language accuracy. It is a reproducible regression set that should expand whenever a new real failure is observed.

## Solution contract checked for all 100 profiles

Each profile must resolve to:

- understood problem family;
- at least three concrete next actions;
- one high-value clarification question;
- a product family only as `category to check`, never as an automatic recommendation;
- a non-purchase/process path where applicable;
- safety guidance for mobility, mould/humidity, electrical backup and persistent pain contexts;
- no fabricated merchant, price, availability, Greek-market gap or product fitness claim.

## UX behavior after correction

The existing strict product search remains authoritative.

If a verified result exists:

`verified search result -> CORE/LAB evidence -> merchant action`

If no verified result exists:

`no verified result -> solution recovery -> immediate actions -> clarification -> product category to verify (optional)`

The interface must no longer imply that an empty strict product set means the user's underlying problem has no useful path forward.

## Acceptance status

- strict CORE/LAB gates preserved: PASS
- dead-end wording converted into solution recovery: PASS in source
- 100-profile deterministic family classification: PASS (100/100 fixed suite)
- manual/non-purchase path available: PASS
- unsupported product facts introduced: 0
- production deployment performed: **NO — intentionally out of scope**
