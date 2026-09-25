// lib/signup/schema.ts
//
// The request/response contract for POST /api/signup (app/api/signup/route.ts)
// and its server-side validation. Pure TypeScript, no server imports, so the
// browser helper (lib/signup/client.ts) can share the types.
//
// Two kinds of submission share the route:
//   - "demo": the /business DemoForm. Saved to the existing `waitlist`
//     collection with exactly the fields the form used to write itself.
//   - "blog": a blog sign-up from the footer box, /blog or a post. Saved to
//     `blog_subscribers`, one document per email address.
//
// The validator is strict: unknown keys are rejected, every value must be a
// string, control/invisible characters are stripped, lengths are capped.
// Error messages are fixed strings; nothing from the input is echoed back.

export const SIGNUP_KINDS = ["demo", "blog"] as const;
export type SignupKind = (typeof SIGNUP_KINDS)[number];

export const BLOG_SOURCES = ["footer", "blog-index", "blog-post"] as const;
export type BlogSource = (typeof BLOG_SOURCES)[number];

/**
 * Honeypot key. Real forms render it as an off-screen, unlabelled input that
 * people never see or fill; a naive bot fills every field. Deliberately not
 * `website`/`url`/`company`, which browser autofill can populate for a real
 * person and silently drop their request.
 */
export const HONEYPOT_FIELD = "hp";

export const SIGNUP_LIMITS = {
  fullName: 120,
  businessName: 160,
  email: 254,
  emailLocalPart: 64,
  phone: 40,
  posSystem: 120,
  path: 300,
  honeypot: 500,
} as const;

// ---- request payloads -------------------------------------------------------

export interface DemoRequestPayload {
  kind: "demo";
  fullName: string;
  businessName: string;
  email: string;
  phone?: string;
  posSystem?: string;
  hp?: string;
}

export interface BlogSignupPayload {
  kind: "blog";
  email: string;
  source: BlogSource;
  /** Site path the sign-up came from, e.g. "/blog/some-post". */
  path?: string;
  hp?: string;
}

export type SignupPayload = DemoRequestPayload | BlogSignupPayload;

// ---- normalised values (what the server stores) -----------------------------

export interface DemoRequest {
  kind: "demo";
  fullName: string;
  businessName: string;
  /** Trimmed, case preserved (the DemoForm never lower-cased it). */
  email: string;
  /** "" when not given, exactly like the old client write. */
  phone: string;
  /** "" when not given, exactly like the old client write. */
  posSystem: string;
}

export interface BlogSignup {
  kind: "blog";
  /** Lower-cased, so the same address maps to the same subscriber doc. */
  email: string;
  source: BlogSource;
  path?: string;
}

export type SignupInput = DemoRequest | BlogSignup;

// ---- response ---------------------------------------------------------------

export type SignupErrorCode =
  | "invalid_json"
  | "invalid_request"
  | "invalid_fields"
  | "too_large"
  | "unsupported_media_type"
  | "rate_limited"
  | "not_configured"
  | "unavailable"
  | "server_error";

export type SignupFieldErrors = Partial<Record<"fullName" | "businessName" | "email" | "phone" | "posSystem" | "source" | "path", string>>;

export type SignupResponse =
  | { ok: true }
  | { ok: false; error: SignupErrorCode; message?: string; fields?: SignupFieldErrors };

// ---- validation -------------------------------------------------------------

// Same patterns as the DemoForm's client-side check, so anything the form
// accepts, the server accepts too.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s()+-]{7,}$/;
// A site-relative path: no scheme, no host, no query or fragment.
const PATH_RE = /^\/(?!\/)[A-Za-z0-9\-._~/%]*$/;

const ALLOWED_KEYS: Record<SignupKind, ReadonlySet<string>> = {
  demo: new Set(["kind", "fullName", "businessName", "email", "phone", "posSystem", HONEYPOT_FIELD]),
  blog: new Set(["kind", "email", "source", "path", HONEYPOT_FIELD]),
};

// C0/C1 controls (incl. CR/LF/TAB), zero-width and bidi-override characters.
const STRIP_RE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/** NFC, control/invisible characters to spaces, whitespace collapsed, trimmed. */
export function cleanText(value: string): string {
  return value.normalize("NFC").replace(STRIP_RE, " ").replace(/\s+/g, " ").trim();
}

export type ValidationResult =
  | { ok: true; value: SignupInput }
  | { ok: false; error: "invalid_request" | "invalid_fields"; fields?: SignupFieldErrors };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;
}

/** True when the honeypot is filled in: the caller should fake success and drop it. */
export function isHoneypotTripped(raw: unknown): boolean {
  if (!isPlainObject(raw)) return false;
  const hp = raw[HONEYPOT_FIELD];
  return typeof hp === "string" ? hp.trim().length > 0 : hp !== undefined && hp !== null && hp !== false;
}

function checkEmail(raw: string): { value: string } | { error: string } {
  const email = cleanText(raw);
  if (!email) return { error: "Email is required." };
  if (email.length > SIGNUP_LIMITS.email || email.split("@")[0].length > SIGNUP_LIMITS.emailLocalPart) {
    return { error: "That email address is too long." };
  }
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  return { value: email };
}

export function validateSignupInput(raw: unknown): ValidationResult {
  if (!isPlainObject(raw)) return { ok: false, error: "invalid_request" };
  const kind = raw.kind;
  if (kind !== "demo" && kind !== "blog") return { ok: false, error: "invalid_request" };

  const allowed = ALLOWED_KEYS[kind];
  for (const key of Object.keys(raw)) {
    if (!allowed.has(key)) return { ok: false, error: "invalid_request" };
    const v = raw[key];
    // Every field is a string (optional ones may be omitted or null).
    if (v !== undefined && v !== null && typeof v !== "string") return { ok: false, error: "invalid_request" };
  }
  const str = (key: string): string => (typeof raw[key] === "string" ? (raw[key] as string) : "");
  if (str(HONEYPOT_FIELD).length > SIGNUP_LIMITS.honeypot) return { ok: false, error: "invalid_request" };

  const fields: SignupFieldErrors = {};
  const email = checkEmail(str("email"));
  if ("error" in email) fields.email = email.error;

  if (kind === "demo") {
    const fullName = cleanText(str("fullName"));
    const businessName = cleanText(str("businessName"));
    const phone = cleanText(str("phone"));
    const posSystem = cleanText(str("posSystem"));

    if (!fullName) fields.fullName = "Your name is required.";
    else if (fullName.length > SIGNUP_LIMITS.fullName) fields.fullName = "That name is too long.";
    if (!businessName) fields.businessName = "Business name is required.";
    else if (businessName.length > SIGNUP_LIMITS.businessName) fields.businessName = "That business name is too long.";
    if (phone && (phone.length > SIGNUP_LIMITS.phone || !PHONE_RE.test(phone))) fields.phone = "Enter a valid phone number.";
    if (posSystem.length > SIGNUP_LIMITS.posSystem) fields.posSystem = "That POS name is too long.";

    if (Object.keys(fields).length > 0 || "error" in email) return { ok: false, error: "invalid_fields", fields };
    return { ok: true, value: { kind: "demo", fullName, businessName, email: email.value, phone, posSystem } };
  }

  const source = str("source");
  if (!(BLOG_SOURCES as readonly string[]).includes(source)) fields.source = "Unknown sign-up source.";
  const rawPath = str("path");
  let path: string | undefined;
  if (rawPath) {
    if (rawPath.length > SIGNUP_LIMITS.path || !PATH_RE.test(rawPath)) fields.path = "Invalid page path.";
    else path = rawPath;
  }
  if (Object.keys(fields).length > 0 || "error" in email) return { ok: false, error: "invalid_fields", fields };
  const value: BlogSignup = { kind: "blog", email: email.value.toLowerCase(), source: source as BlogSource };
  if (path) value.path = path;
  return { ok: true, value };
}
