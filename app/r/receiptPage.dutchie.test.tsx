// app/r/receiptPage.dutchie.test.tsx
//
// /r?sid= for a Dutchie text receipt. Standalone tsx script:
//   npm run test:rDutchie
//
// The page fetches the raw bytes and /parsed together. For a text receipt it
// used to render the LOCAL parse only, which reads Dutchie's layout badly
// (items named "@ 6.00 ea", discounts as products, "Total Grams: 4.20" as the
// total). It now renders the indexer's row when, and only when, that row was
// written by the Dutchie extractor (extractorEngine "rdh-dutchie-escpos").
// Rows indexed earlier keep their old engine and must render exactly as
// before, which the last two tests pin.

import assert from "node:assert/strict";
import { finish, test, RDH, bytes, json, status } from "./testPageHarness";
import { runScenario } from "./testRunScenario";
import type { Scenario } from "./testParityScenarios";
import { DUTCHIE_BUNDLE_BYTES_B64, DUTCHIE_PARSED_BUNDLE } from "@/lib/__fixtures__/dutchieParsed";

const SID = "d0c0ffee00000001";
const BIN = Uint8Array.from(Buffer.from(DUTCHIE_BUNDLE_BYTES_B64, "base64"));

function scenario(name: string, parsed: ReturnType<typeof json>): Scenario {
  return {
    name,
    route: "/r",
    params: { sid: SID },
    upstreams: { [`${RDH}/receipt/${SID}`]: bytes(BIN), [`${RDH}/receipt/${SID}/parsed`]: parsed },
    cardsSid: SID,
    receiptRenders: true,
  };
}

// React separates adjacent text nodes with <!-- -->; drop those first so
// "$<!-- -->40.00" reads "$40.00".
const text = (html: string) =>
  html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

const withEngine = (engine: string | null) => {
  const p = structuredClone(DUTCHIE_PARSED_BUNDLE) as { receipt: Record<string, unknown> };
  p.receipt.extractorEngine = engine;
  return p;
};

async function main() {
  await test("a Dutchie-engine row renders from /parsed, not the local parser", async () => {
    const { html } = await runScenario(scenario("dutchie", json(200, DUTCHIE_PARSED_BUNDLE)));
    const t = text(html);
    for (const s of [
      "Union Cannabis Club",
      "SUNSET CONNECT - 1G - HYBRID - FULTON 5ER",
      "ST IDES - TEA - HIGH PUNCH",
      "$36.02",
      "-$4.00",
      "$40.00",
      "Customer:: [redacted]",
      "Due Customer: $10.00",
    ]) assert.ok(t.includes(s), `missing ${JSON.stringify(s)}`);
    assert.ok(!t.includes("@ 6.00 ea $12.00"), "no item named after its qty line");
    assert.ok(!t.includes("$4.20"), "Total Grams is never the total");
    assert.ok(!/Customer:: 0{8}/.test(t), "customer id never on the page");
  });

  const local = await runScenario(scenario("dutchie-no-parsed", status(404)));

  await test("control: the local parse is what the Dutchie path replaces", () => {
    // Keeps the negative assertions above honest: the same text() sees the
    // local parse's defects, so their absence above is not a parsing artefact.
    const t = text(local.html);
    assert.ok(t.includes("$4.20"), "local parse reads Total Grams as the total");
    assert.ok(t.includes("@ 6.00 ea"), "local parse names items after the qty line");
  });

  await test("the local parse of a Dutchie receipt redacts the customer id too", () => {
    // Old-engine rows and /parsed misses render locally from the raw bytes,
    // which still carry `Customer:: <id>` (zeros in this scrubbed fixture).
    const t = text(local.html);
    assert.ok(t.includes("Customer:: [redacted]"));
    assert.ok(!/Customer:: 0{8}/.test(t));
    assert.ok(t.includes("Due Customer:"), "the change line is untouched");
  });

  await test("an old-engine row renders exactly the local parse, as before", async () => {
    for (const engine of ["rdh-escpos", null]) {
      const { html } = await runScenario(scenario(`dutchie-${engine}`, json(200, withEngine(engine))));
      assert.equal(html, local.html, `engine ${engine}`);
    }
  });

  await test("/parsed pending, failed or erroring renders the local parse", async () => {
    for (const parsed of [
      json(200, { sid: SID, parseStatus: "pending", hasImage: false, uploadedAt: null, receipt: null }),
      json(200, { ...DUTCHIE_PARSED_BUNDLE, parseStatus: "failed" }),
      status(502),
    ]) {
      const { html } = await runScenario(scenario("dutchie-fallback", parsed));
      assert.equal(html, local.html);
    }
  });

  finish();
}

void main();
