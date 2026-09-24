// components/DecodedText.test.tsx
//
// Standalone test script (no test framework in this repo — see package.json).
// Run with:
//   npm run test:decoded
//
// The contract worth pinning down is narrow but load-bearing: U+FFFD is what
// the RDH glyph decoder writes for a character it refused to guess at, and it
// has to keep meaning that everywhere it is STORED. This component may only
// change how it is DRAWN. So the assertions below are mostly about what the
// component must not do — not drop the character silently, not shift the
// columns of a monospace transcript, not invent a letter in its place.

import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { DecodedText, UNREADABLE } from "./DecodedText";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`  ok - ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL - ${name}`);
    console.error(err instanceof Error ? err.message : err);
  }
}

const render = (text: string) => renderToStaticMarkup(<DecodedText text={text} />);

// ---- Clean text -------------------------------------------------------------

test("text with no unreadable characters passes through unchanged", () => {
  assert.equal(render("Revelry | Mint Sorbet | Sungrown Flower | 1g"), "Revelry | Mint Sorbet | Sungrown Flower | 1g");
});

test("an empty string renders as nothing", () => {
  assert.equal(render(""), "");
});

test("a missing string renders as nothing rather than throwing", () => {
  // The old code was `{detail.rawText}`, which renders nothing when the field
  // is absent. A receipt page should not crash where it used to degrade.
  assert.equal(render(undefined as unknown as string), "");
  assert.equal(render(null as unknown as string), "");
});

test("markup in the receipt text is escaped, not interpreted", () => {
  assert.equal(render("<b>Kanha</b> & Co"), "&lt;b&gt;Kanha&lt;/b&gt; &amp; Co");
});

// ---- Unreadable characters --------------------------------------------------

test("an unreadable character becomes a placeholder, never a literal U+FFFD", () => {
  const html = render(`Fl${UNREADABLE}${UNREADABLE}er`);
  assert.ok(!html.includes(UNREADABLE), "U+FFFD must not survive into the markup");
  assert.ok(html.startsWith("Fl"), "the readable prefix is kept verbatim");
  assert.ok(html.endsWith("er"), "the readable suffix is kept verbatim");
  assert.ok(html.includes("<span"), "the unreadable run is drawn as an element");
});

test("a run is one placeholder as wide as the characters it stands in for", () => {
  // Column alignment is the whole reason widths are in `ch`: the merchant
  // dashboard renders the decoded transcript in a monospace block, and a
  // placeholder that is not exactly N character cells wide would drag the
  // printed amounts out of their columns.
  assert.ok(render(`a${UNREADABLE}b`).includes("width:1ch"));
  assert.ok(render(`a${UNREADABLE}${UNREADABLE}b`).includes("width:2ch"));
  assert.ok(render(`a${UNREADABLE.repeat(3)}b`).includes("width:3ch"));
});

test("separate runs get separate placeholders", () => {
  const html = render(`Pre${UNREADABLE}${UNREADABLE}oll ${UNREADABLE}g`);
  assert.equal(html.match(/<span/g)?.length, 2);
  assert.ok(html.includes("width:2ch"));
  assert.ok(html.includes("width:1ch"));
});

test("the placeholder says what it is, for a screen reader and on hover", () => {
  const one = render(`Li${UNREADABLE}uid`);
  assert.ok(one.includes('aria-label="one character could not be read"'));
  assert.ok(one.includes("title="));
  const many = render(`Fl${UNREADABLE}${UNREADABLE}er`);
  assert.ok(many.includes('aria-label="2 characters could not be read"'));
});

test("a whole-string run still renders (nothing readable around it)", () => {
  const html = render(UNREADABLE.repeat(2));
  assert.ok(html.includes("<span"));
  assert.ok(!html.includes(UNREADABLE));
});

test("the placeholder inherits its ink, so it works on dark cards and light ones", () => {
  // Passing no colour down is deliberate — /r renders on a dark glass card and
  // the merchant dashboard on its own shell, and neither should have to know.
  assert.ok(render(`a${UNREADABLE}b`).includes("background:currentColor"));
});

// ---- Summary ----------------------------------------------------------------

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
