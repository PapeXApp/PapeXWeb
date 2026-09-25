# Sign-up route: `POST /api/signup`

One server route for public sign-ups (Web 2.1, B3):

| kind   | Sent by                                    | Written to (Firebase project `papexweb-aed97`) |
|--------|--------------------------------------------|------------------------------------------------|
| `demo` | `/business` DemoForm (`components/paths/business/DemoForm.tsx`) | `waitlist/{auto-id}`, same document the form used to write itself |
| `blog` | footer box, `/blog`, blog posts (to be wired) | `blog_subscribers/{sha256(lower-cased email)}` |

After a successful save it emails the team through AWS SES (plain text: kind,
submitted fields, timestamp). The email runs after the response and can never
change it; with no SES config the save still happens and the log says
`email skipped (no SES config)`.

Code: `app/api/signup/route.ts` (Next adapter) → `lib/server/signup/handler.ts`
(the pipeline) → `lib/server/signup/store.ts` (Firestore) +
`lib/server/signup/email.ts` (SES) + `lib/server/signup/rateLimit.ts`.
Contract and validation: `lib/signup/schema.ts`. Browser helper:
`lib/signup/client.ts`. Tests: `npm run test:signup` (also in `npm test`).

## Contract

Request: `POST /api/signup`, `Content-Type: application/json`, body ≤ 4 KB.

```jsonc
// demo request
{ "kind": "demo", "fullName": "…", "businessName": "…", "email": "…",
  "phone": "…"?, "posSystem": "…"?, "hp": ""? }
// blog sign-up
{ "kind": "blog", "email": "…", "source": "footer" | "blog-index" | "blog-post",
  "path": "/blog/some-post"?, "hp": ""? }
```

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
| 413 | `{ "ok": false, "error": "too_large" }` | body over 4 KB |
| 415 | `{ "ok": false, "error": "unsupported_media_type" }` | not `application/json` |
| 429 | `{ "ok": false, "error": "rate_limited" }` + `Retry-After` | > 6 requests per IP per 10 min (per instance, see below) |
| 503 | prod: `{ "ok": false, "error": "unavailable" }`; dev: `{ …, "error": "not_configured", "message": "…set PAPEXWEB_SERVICE_ACCOUNT…" }` | Firestore credentials missing or unusable |
| 500 | `{ "ok": false, "error": "server_error" }` | the Firestore write failed (details only in the server log) |

Client helper (safe in `"use client"` code; never throws):

```ts
import { submitSignup, requestDemo, subscribeToBlog, type SignupResult } from "@/lib/signup/client"

subscribeToBlog({ email, source: "footer", path: location.pathname, hp }): Promise<SignupResult>
requestDemo({ fullName, businessName, email, phone, posSystem, hp }): Promise<SignupResult>
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

## Environment variables (Vercel, Production + Preview)

Names only. Never commit values; `.env.example` lists them commented out.

| Name | Required | Default | Purpose |
|------|----------|---------|---------|
| `PAPEXWEB_SERVICE_ACCOUNT` | **yes**, or the DemoForm fails | none | Service-account JSON (raw or base64) for Firebase project **`papexweb-aed97`**. Refused if its `project_id` is anything else. Needs Firestore write access (role "Cloud Datastore User" is enough). Not the same key as `PAPEXV2_SERVICE_ACCOUNT` (that one is `papexv2`, for the merchant dashboard). |
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

## Firestore rules (console-managed; not in this repo)

The route uses firebase-admin, which bypasses rules. Clients must never touch
`blog_subscribers`, so add:

```
match /blog_subscribers/{id} {
  allow read, write: if false;   // server (Admin SDK) only
}
```

`waitlist`: the browser no longer writes it once this ships. After the new
build has been live for a day (so no cached old page is still submitting),
the client `create` permission on `waitlist` can be removed too
(`allow read, write: if false;`). Nothing else in the workspace writes it
(checked PapeXV2 and the RDH backend). Keep whatever read access the team's
viewing tool needs.

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

Order matters: the DemoForm now depends on `PAPEXWEB_SERVICE_ACCOUNT`.
Deploying the code without it turns every demo request into an error message.
Deploying without the SES keys is invisible to users (just no email).

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
4. **Firestore rules**: add the `blog_subscribers` deny-all block above.
5. Merge the branch; Vercel builds the Preview. On the Preview, submit the
   /business demo form once: check a new `waitlist` doc with
   `type: "business-demo-request"` and the email arriving. Delete the test doc.
6. Promote/merge to `main` (= production deploy).
7. A day later: remove client write access to `waitlist` in the rules.
