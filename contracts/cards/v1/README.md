# Receipt cards, format v1

The contract between the cards resolver (P1, server) and every renderer: the web receipt (`app/r/cards/`, P0) and the native App Clip (P3). Frozen 2026-09-22.

| File | What it is |
|---|---|
| `resolved-cards.schema.json` | JSON Schema (draft-07). Canonical. What `GET /receipt/{sid}/cards` may return. |
| `fixtures/valid/*.json` | Schema-valid responses. Together they cover every card type, every redemption type, every status. A client must render every card in them. |
| `fixtures/demo/*.json` | The demo value layer as cards (Hartwell's, Ellsworth, Sunset Leaf), projected at a fixed clock of 2026-10-05T17:00:00Z. Schema-valid golden output. |
| `fixtures/client/*.json` | Client-behaviour cases, mostly NOT schema-valid: `{description, requestSid, response, expect: {cardIds}}`. Feed `response` to the client decoder for `requestSid`; exactly `expect.cardIds` must survive, in order. |

TS mirror: `lib/cards/types.ts`. Web decoder: `lib/cards/normalize.ts`. Tests that hold all of this together: `lib/cards/cards.test.ts` (schema, decoder, fixtures, barcodes, demo goldens) and `app/r/cards/cards.test.tsx` (rendering).

## Vendoring (App Clip, RDH resolver)

Vendor this directory verbatim from PapeXWeb `main`:

```
PapeXWeb/contracts/cards/v1/  ->  PapeXV2/ios/PapeXClip/Tests/Fixtures/cards/v1/
                              ->  Papex_RDH_Backend/lambdas/cards/contract/v1/
```

Record the PapeXWeb commit and `shasum -a 256` of every file in a `VENDORED.txt` beside the copy (the pattern `lib/__fixtures__/demoBlobs.ts` uses), and fail the suite on a mismatch. The Swift decoder test decodes every `valid/` and `demo/` file with zero drops, and every `client/` file to exactly `expect.cardIds`. Everything here is plain JSON: no comments, no TS-only constructs. The fixtures contain only invented merchants; real merchant config and consent text never go in this public repo.

## Format rules

- **Resolved.** Every string is finished display text: rules evaluated, templates rendered, money formatted. Clients never evaluate, template or format money.
- **Plain text.** Never HTML, never Markdown. Web renders text nodes only (React escapes). Swift uses `Text(verbatim:)`, never `LocalizedStringKey` or `AttributedString(markdown:)`.
- **Text fields** have at least one non-whitespace character (ECMAScript `\s`), contain no C0/C1 controls, no U+2028/U+2029, and no bidi embeddings, overrides or isolates (U+202A-202E, U+2066-2069). ZWJ is allowed (emoji).
- **Lengths count Unicode code points** (Swift: `unicodeScalars.count`, not `String.count`).
- **URLs** (`cta.url`, `emailCapture.privacyUrl`): `https://`, a dotted ASCII host whose labels don't start or end with `-`, no userinfo, no port, RFC 3986 characters only, at most 2048 characters. Clients re-check before rendering a link.
- **Money and dates** arrive formatted. The one exception is the countdown chip (below).
- **Barcodes** (`code128` subset B, max 24 characters; `ean13`; `upca`) are drawn by the client from `value`. Clients verify EAN/UPC check digits, and reject an `expiresAt` that is not a real calendar instant (the schema's pattern admits `2026-02-30`); these are the only two checks stricter than the schema. The web encoder matches Apple's `CICode128BarcodeGenerator` module for module.
- **Versioning.** `schemaVersion` is 1. Adding an optional field, a card type, an action type or an enum value is additive and stays v1: old clients ignore or skip it (below). Removing or renaming anything, or changing a meaning, is v2.

## Client rules

1. **Unknown is skipped.** A card whose `type` is not a v1 type is skipped silently, as is an action whose `type` is not a v1 action, and any list entry that is not an object or has no string `type`.
2. **Fail closed, envelope.** Render **no cards** when the response is not an object, `schemaVersion` is not 1, `sid` is not the requested sid, `status` is not a known value, `merchant` is missing or its `partner`/`ageRestricted` are not booleans, or `cards` is not an array. `none` and `degraded` render no cards. `ok` and `pending` render their cards. The receipt never depends on cards.
3. **Fail closed, card.** A card of a known type with any invalid field (a missing or malformed required field, a malformed optional field, a string over its limit or with a forbidden character, an unknown enum value, a bad URL, a bad check digit, an unparseable `expiresAt`) is **dropped whole**: never repaired and never partly drawn. If a card throws while rendering, only that card is lost.
4. **Nulls and extras.** An optional field sent as `null` counts as absent. A required field sent as `null` is invalid. Unknown properties anywhere are ignored.
5. **Ids.** A card repeating the id of an earlier accepted card is dropped.
6. **Limits.** At most 8 cards render, counted after rules 1-5. At most 2 actions render per card, counted after unknown actions are skipped.
7. **Partner-only email capture.** An `emailCapture` card is dropped unless `merchant.partner === true`. For `merchant.ageRestricted === true` it is also dropped without `ageAffirmationLabel`. A `live` capture card needs `input`. The schema encodes the same rules, so the resolver cannot emit a valid response that breaks them.
8. **Inert writes (P0).** Until the P2 endpoint and the legal review exist, `save` actions and `emailCapture` render inert whatever `mode` says: no form, no submit, no storage. The consent checkbox is never pre-checked, because the format has no field that could check it.

## Countdown chip

`offer.validity.expiresAt` is the last second of the final valid day, in the merchant's timezone, sent as UTC `YYYY-MM-DDTHH:MM:SSZ` (no fractional seconds). With `countdown: true`:

```
now      = floor(clock / 1s)
if now > expiresAt: no chip        (never "Expired")
days     = floor((expiresAt - now) / 86400)
0 -> "Last day", 1 -> "1 day left", n -> "n days left"
```

Because `expiresAt` sits on the merchant's day boundary, this counts the merchant's calendar days without the client knowing the timezone. Across a DST change the flip can move by an hour.
