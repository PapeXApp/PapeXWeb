// app/r/ItemName.test.tsx
//
// Tap-to-expand item names. Standalone tsx script:
//   npm run test:itemName
//
// There is no DOM in this repo's test runner, so the stateful half (measure,
// toggle) is covered through its pure pieces and the presentational half is
// rendered in each state. The parity goldens (test:rParity) pin the other
// promise: the server render is unchanged.

import "./cards/testCssModules"; // must stay first: registers the .css loader before any component loads
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ItemName, ItemNameView, isCut, isToggleKey } from "./ItemName";
import { ItemsCard } from "./ui";

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

const NAME = "SUNSET CONNECT - 1G - SATIVA - FULTON 5ER";
const ORIGINAL =
  '<span class="font-barlow min-w-0 flex-1 truncate text-base font-medium" style="color:#fff">' + NAME + "</span>";

test("server render is exactly the span ItemsCard rendered before", () => {
  assert.equal(renderToStaticMarkup(<ItemName name={NAME} style={{ color: "#fff" }} />), ORIGINAL);
});

test("the full name is always in the DOM; only CSS cuts it", () => {
  const html = renderToStaticMarkup(
    <ItemsCard summary={{ addressLines: [], items: [{ label: NAME, name: NAME, qty: 1, amount: 6 }], bodyLines: [] }} />,
  );
  assert.ok(html.includes(NAME));
});

test("a name that fits is never interactive (no tap target, nothing moves)", () => {
  const html = renderToStaticMarkup(<ItemNameView name={NAME} cut={false} expanded={false} />);
  assert.doesNotMatch(html, /role=|tabindex|aria-expanded|cursor-pointer/);
});

test("a cut name is a collapsed toggle: role=button, focusable, aria-expanded=false", () => {
  const html = renderToStaticMarkup(<ItemNameView name={NAME} cut expanded={false} />);
  assert.match(html, /role="button"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-label="SUNSET CONNECT - 1G - SATIVA - FULTON 5ER, show full name"/);
  assert.match(html, /class="[^"]*\btruncate\b[^"]*cursor-pointer/);
});

test("expanded: wraps instead of truncating, aria-expanded=true", () => {
  const html = renderToStaticMarkup(<ItemNameView name={NAME} cut expanded />);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /whitespace-normal break-words/);
  assert.doesNotMatch(html, /\btruncate\b/);
  assert.doesNotMatch(html, /aria-label=/);
});

test("isCut: only when the text is wider than the box (1px tolerance)", () => {
  assert.equal(isCut({ scrollWidth: 300, clientWidth: 200 }), true);
  assert.equal(isCut({ scrollWidth: 200, clientWidth: 200 }), false);
  assert.equal(isCut({ scrollWidth: 201, clientWidth: 200 }), false);
});

test("Enter and Space toggle, as on a native button; other keys do not", () => {
  assert.equal(isToggleKey("Enter"), true);
  assert.equal(isToggleKey(" "), true);
  assert.equal(isToggleKey("Tab"), false);
  assert.equal(isToggleKey("a"), false);
});

test("the toggle calls back on click and on Enter/Space", () => {
  let n = 0;
  const el = ItemNameView({ name: NAME, cut: true, expanded: false, onToggle: () => (n += 1) }) as React.ReactElement<{
    onClick: () => void;
    onKeyDown: (e: { key: string; preventDefault: () => void }) => void;
  }>;
  el.props.onClick();
  el.props.onKeyDown({ key: "Enter", preventDefault: () => {} });
  el.props.onKeyDown({ key: " ", preventDefault: () => {} });
  el.props.onKeyDown({ key: "x", preventDefault: () => {} });
  assert.equal(n, 3);
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
