// lib/cards/url.ts
//
// The URL rule for every link a card can carry (cta.url, emailCapture.privacyUrl).
//
// The resolver only ever emits URLs from merchant config, never from receipt
// facts, and its publish lint already requires https on an allowlisted host.
// Clients re-check anyway, because the renderer is the last thing between a
// string and an <a href>, and a `javascript:` URL in an href is script
// execution. The check is an ALLOWLIST of one shape, not a denylist of bad
// schemes:
//
//   - `https://` exactly (lowercase), then an ASCII dotted host whose labels
//     neither start nor end with a hyphen (IDNs arrive as punycode), no
//     userinfo (`user@`), no port;
//   - path/query/fragment limited to RFC 3986 characters: no whitespace, no
//     quotes, no angle brackets, no backslashes;
//   - at most 2048 characters;
//   - and the WHATWG URL parser must agree it is https with that host.
//
// Anything else: null, and the card that carried it is dropped.

const HOST_LABEL = "[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?";
const HTTPS_URL_RE = new RegExp(
  `^https://${HOST_LABEL}(\\.${HOST_LABEL})+([/?#][A-Za-z0-9\\-._~:/?#\\[\\]@!$&'()*+,;=%]*)?$`,
);

export function safeHttpsUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || !HTTPS_URL_RE.test(value)) return null;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" || parsed.username !== "" || parsed.password !== "" || parsed.port !== "") {
    return null;
  }
  return value;
}
