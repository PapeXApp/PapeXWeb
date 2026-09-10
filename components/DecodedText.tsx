// =============================================================================
// Render text that came out of the RDH glyph decoder.
//
// Blaze prints its receipts as 1bpp bitmaps, so every character on them is read
// back by matching pixels against a table of known shapes. When a shape is not
// in that table — a rare capital, a pair of letters the renderer set touching —
// the decoder deliberately refuses to guess and emits U+FFFD instead. That
// refusal is the whole safety property: lib/glyphDecode.js in Papex_RDH will
// throw out a decode entirely rather than let an unread character sit inside a
// price, so anything that survives to here is a letter in a brand or strain
// name and nothing more.
//
// The information is right; U+FFFD is just a bad way to show it. Most fonts
// draw it as a black diamond with a question mark in it, which reads to a
// customer as "this receipt is broken" rather than "one letter of this product
// name didn't come through". So the character stays U+FFFD everywhere it is
// stored, compared, or tested, and only the rendering changes: a dimmed slug
// the width of the character it stands in for.
//
// Widths are in `ch` so the slug occupies exactly one character cell. That
// keeps the monospace transcript on the merchant dashboard in column.
// =============================================================================

import type { CSSProperties } from "react";

/** What the decoder writes for a glyph it would not guess at. */
export const UNREADABLE = "\uFFFD";

/** One or more of them in a row, as a capturing split. */
const RUNS = new RegExp(`(${UNREADABLE}+)`);

const SLUG: CSSProperties = {
  display: "inline-block",
  height: "0.62em",
  borderRadius: "0.1em",
  // currentColor keeps the slug in whatever ink its surrounding text is set in,
  // so it works on the dark receipt cards and the light dashboard alike without
  // either one passing a colour down.
  background: "currentColor",
  opacity: 0.22,
  verticalAlign: "baseline",
};

/**
 * `text` with each run of unreadable characters drawn as a placeholder.
 *
 * Returns a plain string unchanged, so it is free to use on every label rather
 * than only where a decode is expected to have holes.
 */
export function DecodedText({ text }: { text: string }) {
  // The merchant API types `rawText` as a string, but this renders whatever the
  // backend actually sent. `{detail.rawText}` used to render nothing when that
  // was missing; throwing instead would be a worse trade for a receipt page.
  if (!text) return null;
  if (!text.includes(UNREADABLE)) return <>{text}</>;

  // Split keeps the delimiters, so runs of U+FFFD land on odd indices. Built
  // from the constant rather than written as a literal, so the two cannot drift
  // apart into a component that silently stops matching anything.
  const parts = text.split(RUNS);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith(UNREADABLE) ? (
          <span
            key={i}
            role="img"
            aria-label={
              part.length === 1
                ? "one character could not be read"
                : `${part.length} characters could not be read`
            }
            title="This part of the receipt could not be read"
            style={{ ...SLUG, width: `${part.length}ch` }}
          />
        ) : (
          part
        ),
      )}
    </>
  );
}
