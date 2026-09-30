# Sign-up route: `POST /api/signup`

One server route for public sign-ups (Web 2.1, B3):

| kind   | Sent by                                    | Written to (Firebase project `papexweb-aed97`) |
|--------|--------------------------------------------|------------------------------------------------|
| `demo` | `/business` DemoForm (`components/paths/business/DemoForm.tsx`) | `waitlist/{auto-id}`, same document the form used to write itself |
| `blog` | footer box, `/blog`, blog posts (to be wired) | `blog_subscribers/{sha256(lower-cased email)}` |
| `support` | `/support` "Send us a message" (`app/support/SupportForm.tsx`) | `support_requests/{auto-id}` |

After a successful save it emails the team through AWS SES (plain text: kind,
submitted fields, timestamp). The **support** email is the one Nico answers
directly: its `Reply-To` is the sender's (validated) address, so hitting Reply
in Outlook writes back to them. Demo and blog emails have no Reply-To. The email runs after the response and can never
change it; with no SES config the save still happens and the log says
`email skipped (no SES config)`.

Code: `app/api/signup/route.ts` (Next adapter) → `lib/server/signup/handler.ts`
(the pipeline) → `lib/server/signup/store.ts` (Firestore) +
`lib/server/signup/email.ts` (SES) + `lib/server/signup/rateLimit.ts`.
Contract and validation: `lib/signup/schema.ts`. Browser helper:
`lib/signup/client.ts`. Tests: `npm run test:signup` (also in `npm test`).

## Contract

Request: `POST /api/signup`, `Content-Type: application/json`, body ≤ 4 KB
(≤ 16 KB for kind `support`, whose message alone can be 4,000 characters; the
route reads at most 16 KB and a demo/blog body over 4 KB is still a 413).

```jsonc
// demo request
{ "kind": "demo", "fullName": "…", "businessName": "…", "email": "…",
  "phone": "…"?, "posSystem": "…"?, "hp": ""? }
// blog sign-up
{ "kind": "blog", "email": "…", "source": "footer" | "blog-index" | "blog-post",
  "path": "/blog/some-post"?, "hp": ""? }
// support request
{ "kind": "support", "fullName": "…", "email": "…",
  "topic": "app" | "device" | "other", "message": "…", "path": "/support"?, "hp": ""? }
```

- Support topics (fixed; label = what the form shows and the email says):
  `app` "The PapeX app", `device` "My PapeX device (business)", `other`
  "Something else". Source of truth: `SUPPORT_TOPICS` in `lib/signup/schema.ts`.
- Support `message`: 10–4,000 characters after cleaning. Unlike every other
  field it keeps its line breaks (`cleanMultilineText`: CRLF/CR → LF, other
  control/invisible characters stripped, at most one blank line in a row).
- Support `email` must also be header-safe (no `<>,;"()[]\`), because it
  becomes the notification's Reply-To.

- Any other key → 400 `invalid_request`. Every value must be a string.
- Values are NFC-normalised, control/zero-width/bidi characters stripped,
  whitespace collapsed, trimmed, and length-capped (name 120, business 160,
  email 254 / local part 64, phone 40, POS 120, path 300).
- `path` must be site-relative (`/…`, no `//`, no query/fragment).
- `hp` is the honeypot. If it's non-empty the route answers 200 `{ok:true}`
  and saves/sends nothing.

Responses (always JSON, always `Cache-Control: no-store`):

| Status | Body | When |
|--------|------|------|
| 200 | `{ "ok": true }` | saved (or honeypot, or blog email already subscribed: same answer, so addresses can't be enumerated) |
| 400 | `{ "ok": false, "error": "invalid_json" \| "invalid_request" }` | unparseable body, unknown field, non-string value, unknown `kind` |
| 400 | `{ "ok": false, "error": "invalid_fields", "fields": { "email": "Enter a valid email address.", … } }` | field validation (messages match the DemoForm's own) |
| 405 | (Next default) | any method other than POST |
| 413 | `{ "ok": false, "error": "too_large" }` | body over 4 KB (16 KB for `support`) |
| 415 | `{ "ok": false, "error": "unsupported_media_type" }` | not `application/json` |
| 429 | `{ "ok": false, "error": "rate_limited" }` + `Retry-After` | > 6 requests per IP per 10 min (per instance, see below) |
| 503 | prod: `{ "ok": false, "error": "unavailable" }`; dev: `{ …, "error": "not_configured", "message": "…set PAPEXWEB_SERVICE_ACCOUNT…" }` | Firestore credentials missing or unusable |
| 500 | `{ "ok": false, "error": "server_error" }` | the Firestore write failed (details only in the server log) |

Client helper (safe in `"use client"` code; never throws):

```ts
import { submitSignup, requestDemo, type SignupResult } from "@/lib/signup/client"

// (The blog email sign-up and its subscribeToBlog helper were removed; the
// route still accepts kind "blog", but the site no longer posts it.)
requestDemo({ fullName, businessName, email, phone, posSystem, hp }): Promise<SignupResult>
requestSupport({ fullName, email, topic, message, path, hp }): Promise<SignupResult>
// SignupResult = { ok: true } | { ok: false, error: SignupErrorCode | "network", fields?, retryAfterSeconds? }
```

A form that wants the honeypot renders an off-screen input named `hp`
(see `HONEYPOT_FIELD` and the DemoForm) and passes its value as `hp`.

### Stored documents

`waitlist` (FROZEN shape, identical to what DemoForm wrote with the client SDK
before this route; `buildWaitlistDoc` in `store.ts` is the only place it lives,
and a test pins the key list):

```
fullName: string, businessName: string, email: string (trimmed, case kept),
phone: string ("" if blank), posSystem: string ("" if blank),
type: "business-demo-request", createdAt: server timestamp
```

`blog_subscribers/{sha256hex(lower(email))}`:

```
email: string (lower-cased), source: "footer"|"blog-index"|"blog-post",
path?: string, createdAt: server timestamp
```

Written with `create()`, so the first sign-up wins; repeats write nothing and
send no email.

`support_requests/{auto-id}`:

```
fullName: string, email: string (trimmed, case kept), topic: "app"|"device"|"other",
message: string (line breaks kept), type: "support-request",
createdAt: server timestamp, path?: string
```

### The support email

- To: `SIGNUP_NOTIFY_TO` (default `nico@papex.app`), From: `SIGNUP_NOTIFY_FROM`.
- **Reply-To: the sender's address** (SES v2 `ReplyToAddresses`), set only when
  it passes the bare-address check (`ADDRESS_RE` in `email.ts`); otherwise
  omitted. Demo/blog never set it.
- Subject: `PapeX support: <topic label> — <name>`, run through `cleanText`
  (no CR/LF or other control characters) and capped at 200 characters.
- Plain-text body: name, email, topic, page path, received-at timestamp, then
  the message.

## Support form fallback: open the visitor's email app

While the route answers 503 (no `PAPEXWEB_SERVICE_ACCOUNT`), or on a network
failure, 500 or 429, `/support`'s form keeps what was typed and shows "We
couldn't send that from here. Email it to us instead:" with an **Open email**
button: a `mailto:nico@papex.app` link, subject and body percent-encoded
(RFC 6068, CRLF line breaks), carrying the visitor's message and details
(`buildSupportMailto` / `shouldOfferEmailFallback` in
`lib/signup/supportMailto.ts`, tested). There is deliberately **no**
client-side Firestore write for support requests. Nothing to remove later:
once the credential is live the route answers 200 and the fallback simply
never shows.

## Temporary go-live fallback (DemoForm only)

So that demo requests keep working if the code ships before
`PAPEXWEB_SERVICE_ACCOUNT` is set, the DemoForm falls back to its previous
client-side write (`addDoc` to `waitlist`, exact old payload, client SDK)
when the route answers 503 (`unavailable` / `not_configured`) or can't be
reached (`network`), and then shows success as before. It never falls back
on 400/413/415/429/500, and never when the honeypot is filled. The decision
is `shouldFallBackToClientWrite` in `lib/signup/fallback.ts` (tested). A
fallback write sends no email (the team only gets email via the route).
Blog sign-ups have no fallback.

**Remove it** (delete `lib/signup/fallback.ts`, the fallback block and the
`firebase/firestore` + `@/firebase/firebaseConfig` imports in
`DemoForm.tsx`, and its tests) once BOTH are true: the credential is live
on Vercel, and browser writes to `waitlist` are locked in the Firestore
rules (after which the fallback could only fail anyway).

## Environment variables (Vercel, Production + Preview)

Names only. Never commit values; `.env.example` lists them commented out.

| Name | Required | Default | Purpose |
|------|----------|---------|---------|
| `PAPEXWEB_SERVICE_ACCOUNT` | **yes** (until set, demo requests use the client-side fallback and send no email; blog sign-ups fail) | none | Service-account JSON (raw or base64) for Firebase project **`papexweb-aed97`**. Refused if its `project_id` is anything else. Needs Firestore write access (role "Cloud Datastore User" is enough). Not the same key as `PAPEXV2_SERVICE_ACCOUNT` (that one is `papexv2`, for the merchant dashboard). |
| `AWS_SES_ACCESS_KEY_ID` | for email | none | IAM access key allowed `ses:SendEmail` from the papexmail.com identity. |
| `AWS_SES_SECRET_ACCESS_KEY` | for email | none | Its secret. Both keys must be set or email is skipped. |
| `AWS_SES_REGION` | no | `us-east-1` | Region where papexmail.com is verified (DKIM went green in us-east-1 on 2026-09-15). |
| `SIGNUP_NOTIFY_FROM` | no | `notifications@papexmail.com` | Sender; must be on the verified domain. Plain address only. |
| `SIGNUP_NOTIFY_TO` | no | `nico@papex.app` | Recipient(s), comma-separated. If SES is still in the sandbox, each must be a verified identity. |

Suggested least-privilege IAM policy for the SES key:

```json
{ "Version": "2012-10-17", "Statement": [{
  "Effect": "Allow", "Action": "ses:SendEmail",
  "Resource": "arn:aws:ses:us-east-1:<account-id>:identity/papexmail.com",
  "Condition": { "StringEquals": { "ses:FromAddress": "notifications@papexmail.com" } } }] }
```

## Firestore rules (`firestore.rules`, in this repo since 2026-09-29)

The route uses firebase-admin, which bypasses rules. Clients must never touch
`blog_subscribers` or `support_requests` (the latter holds people's names,
emails and messages), so `firestore.rules` denies both to every client, along
with reads of `waitlist`. Deploy with
`firebase deploy --only firestore:rules --project papexweb-aed97`; test with
`npm run test:rules` (needs `firebase` + `@firebase/rules-unit-testing`
resolvable and a JDK).

Until 2026-09-29 the live ruleset was `allow read, write: if true` on every
document, so the 72 waitlist leads were world-readable and the blog was
world-writable. The rules file's header lists every client path that still
needs access and why.

`waitlist`: the browser may still `create` in exactly two shapes (main's
waitlist form and the temporary DemoForm fallback, both with a
serverTimestamp `createdAt`); nothing else. Once `PAPEXWEB_SERVICE_ACCOUNT`
has been live for a day (so no cached old page is still submitting), flip
that `allow create` to `if false`, remove the DemoForm fallback, and update
the tests. Nothing else in the workspace writes it (checked PapeXV2 and the
RDH backend).

## Rate limiting: what it is and isn't

In-memory, per function instance, fixed window (6 / IP / 10 min, IP from
Vercel's `x-forwarded-for`). Vercel runs many short-lived instances, so this
only slows one noisy client on a warm instance; it is not a hard cap. If spam
shows up, add a Vercel WAF rate-limit rule on `/api/signup` or move the
counter to a shared store (Upstash/Vercel KV).

## How to test

- Unit: `npm run test:signup` (validation, honeypot, rate limit, SES skipped,
  SES failure, waitlist shape parity, 413/415/400/503/500, client helper).
  Firestore and SES are fakes; nothing leaves the machine.
- Local server with no env (expected: valid → 503, malformed → 400):

  ```bash
  npm run build && npx next start -p 3126
  curl -si -X POST localhost:3126/api/signup -H 'content-type: application/json' \
    -d '{"kind":"blog","email":"a@b.co","source":"footer","path":"/blog"}'
  curl -si -X POST localhost:3126/api/signup -H 'content-type: application/json' -d '{"kind":"blog","email":"nope"}'
  ```

- End-to-end against real Firebase/SES: only on a Vercel **Preview** deploy
  with the env set, one test submission each, then delete the test docs in the
  console. Do not point a local machine at production credentials.

## Deploy steps (Nico / Noah)

Order matters less thanks to the fallback: deploying without
`PAPEXWEB_SERVICE_ACCOUNT` keeps demo requests working through the old
client-side write (no email), but blog sign-ups return an error until it is
set. Deploying without the SES keys is invisible to users (just no email).
Do NOT lock browser writes to `waitlist` (step 7) before step 2 is live, or
demo requests fail both ways.

1. **Firebase console, project `papexweb-aed97`** → Project settings →
   Service accounts → Generate new private key. (Or a dedicated service
   account with only "Cloud Datastore User".) Don't commit or paste it anywhere
   but Vercel.
2. **Vercel → PapeXWeb → Settings → Environment Variables**: add
   `PAPEXWEB_SERVICE_ACCOUNT` (the whole JSON, or base64 of it) for Production
   and Preview.
3. **AWS (account that owns papexmail.com in SES, us-east-1)**: create an IAM
   user/key with the policy above; add `AWS_SES_ACCESS_KEY_ID`,
   `AWS_SES_SECRET_ACCESS_KEY` (and `AWS_SES_REGION` only if not us-east-1)
   to Vercel. Confirm `nico@papex.app` is a verified identity if the SES
   account is still in the sandbox.
4. **Firestore rules**: deploy `firestore.rules` (see above) after
   `npm run test:rules` passes.
5. Merge the branch; Vercel builds the Preview. On the Preview, submit the
   /business demo form once: check a new `waitlist` doc with
   `type: "business-demo-request"` and the email arriving. Then send the
   /support form once: check a `support_requests` doc and that hitting Reply
   on the email addresses the sender. Delete the test docs.
6. Promote/merge to `main` (= production deploy).
7. A day later (only after step 2 is live): set `waitlist` `allow create` to
   `if false` in `firestore.rules`, redeploy, then remove the DemoForm
   fallback (see "Temporary go-live fallback").
