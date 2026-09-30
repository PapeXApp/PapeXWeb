# Deploying the papexweb-aed97 Firestore rules

The rules live in `firestore.rules` (header explains every allow). This is the
runbook for pushing them live and for rolling back. Everything here is
read-only except the one `firebase deploy` line.

## 0. Prerequisites

- `firebase login` as an owner of `papexweb-aed97` (the CLI on Noah's Mac is
  logged in as nthompson1415@gmail.com).
- A JDK for the emulator: `export JAVA_HOME=/opt/homebrew/opt/openjdk@27`.
- `firebase` and `@firebase/rules-unit-testing` resolvable from the repo. They
  are not site dependencies; the cheap way is a scratch install symlinked in:

```bash
mkdir -p /tmp/rulesharness && cd /tmp/rulesharness && npm init -y >/dev/null && npm i firebase @firebase/rules-unit-testing
```

then from the repo root `ln -sfn /tmp/rulesharness/node_modules node_modules`
(gitignored) if the repo has no `node_modules`, or install the two packages
into the existing one.

## 1. Test

```bash
npm run test:rules
```

Expect `# pass 14` / `# fail 0`. The suite runs serially on emulator port 8091
(set in `firebase.json`) so it does not collide with PapeXV2's 8080.

## 2. Record what is live (rollback target)

The Firebase CLI (15.x) has no command that prints the live ruleset, so use
the Rules REST API with any owner token
(`gcloud auth print-access-token`, or the firebase-tools refresh token):
`GET https://firebaserules.googleapis.com/v1/projects/papexweb-aed97/releases`
gives the ruleset id per release, and `GET .../rulesets/<id>` returns its
source. That is what produced these facts on 2026-09-29:

| Release | Ruleset | Released | Content |
|---|---|---|---|
| cloud.firestore | `2ffa6dff-ce18-4ac9-99ac-e65afec1a5ed` | 2025-06-21 | `match /{document=**} { allow read, write: if true; }` |

## 3. Deploy (the only mutating step)

```bash
firebase deploy --only firestore:rules --project papexweb-aed97
```

Never `--only firestore` (that would also push `firestore.indexes.json`, which
this repo does not have, and could delete console-managed indexes). Storage
rules are a separate `--only storage` deploy and are not part of this.

## 4. Verify

1. Re-read the release and confirm the new ruleset's source is byte-identical
   to `firestore.rules` (sha256 both).
2. Unauthenticated smoke checks, expecting `403 PERMISSION_DENIED` on the
   first and a normal result on the second:

```bash
curl -s -X POST 'https://firestore.googleapis.com/v1/projects/papexweb-aed97/databases/(default)/documents:runQuery' -H 'content-type: application/json' -d '{"structuredQuery":{"from":[{"collectionId":"waitlist"}],"limit":1}}'
```

```bash
curl -s -X POST 'https://firestore.googleapis.com/v1/projects/papexweb-aed97/databases/(default)/documents:runQuery' -H 'content-type: application/json' -d '{"structuredQuery":{"from":[{"collectionId":"blogs"}],"where":{"fieldFilter":{"field":{"fieldPath":"published"},"op":"EQUAL","value":{"booleanValue":true}}},"limit":1}}'
```

3. Open papex.app/blog (main) and confirm posts still list. Sign in to the CMS
   as a blog admin and save an edit to a draft.
4. Submit the live /business form once and confirm the doc lands (Admin SDK
   path if `PAPEXWEB_SERVICE_ACCOUNT` is set; browser fallback otherwise).

## 5. Rollback

Point the release back at the previous ruleset (no redeploy needed):

```bash
curl -s -X PATCH 'https://firebaserules.googleapis.com/v1/projects/papexweb-aed97/releases/cloud.firestore' -H "Authorization: Bearer $(gcloud auth print-access-token)" -H 'content-type: application/json' -d '{"release":{"name":"projects/papexweb-aed97/releases/cloud.firestore","rulesetName":"projects/papexweb-aed97/rulesets/2ffa6dff-ce18-4ac9-99ac-e65afec1a5ed"}}'
```

That reopens every collection to the world, so treat it as a minutes-long
stopgap while fixing the rule, not a resting state.

## Known follow-ups

- **Waitlist create → `if false`** a day after `/api/signup` is live with the
  service account. Then delete the DemoForm fallback and the two `accepts …
  payload` tests.
- **Admin uids are pinned** in `isBlogAdmin()` because none of the six existing
  CMS accounts has a verified email and self-signup is open. Adding a CMS
  "verify your email" button would let the uid list go away.
- **Storage rules** (`storage.rules`) allow any signed-in user to read/write
  `blog-images/`, and self-signup is open. Out of scope here; same fix shape.
- **Self-signup** on papexweb-aed97 could be disabled in the Firebase console
  (Authentication → Settings → User actions → "Enable create") once merchant
  accounts are admin-provisioned, which the PRD already says they are.
