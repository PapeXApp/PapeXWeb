# Android App Links — `assetlinks.json`

**Written:** 2026-09-17 · **Status:** file staged with placeholder fingerprints — **do not merge yet**

> ## Do not merge this branch until the fingerprints are real
>
> `main` deploys to `papex.app` automatically (`.github/workflows/vercel-deploy-hook.yml`).
> Merging this as-is publishes a file with `REPLACE_WITH_…` strings where the
> signing-cert hashes belong. That does not *break* anything — verification
> already fails today, because the file 404s — but it looks like the work is
> done when it is not.

## Why this file exists

This site already serves `/.well-known/apple-app-site-association` for iOS.
It has never served the Android equivalent. Both hosts 404 for it:

```
https://papex.app/.well-known/assetlinks.json        → 404 (verified 2026-09-17)
https://links.papex.app/.well-known/assetlinks.json  → 404 (verified 2026-09-17)
```

`links.papex.app` and `papex.app` are the same Vercel project (see
`app/rdh/page.tsx`), so the one file at `public/.well-known/assetlinks.json`
covers both hosts.

## iOS and Android are not the same mechanism

They share the `/.well-known/` prefix and nothing else. Getting this wrong is
what left Android unserved for as long as it was.

| | iOS — AASA | Android — assetlinks.json |
|---|---|---|
| Filename | `apple-app-site-association` (no extension) | `assetlinks.json` |
| Names the app by | Team ID + bundle ID | package name + **SHA-256 of the signing cert** |
| Declares the **paths** | **yes** — the `paths` array here is authoritative | **no** — paths live in the app's intent filters |
| Effect of adding a path here | the app starts handling it | **none** |
| If it's missing or wrong | the link opens Safari | **Android 12+: the app is never offered.** No chooser |

The practical consequence: when the RDH paths `/r` and `/r/*` were added to the
AASA, iOS started working with no app change. Android needs a change *in the
app* — which is prepared on PapeXV2 branch `fix/android-applinks-rdh` — plus
this file. Neither half works alone.

## What is still needed: the fingerprint

The placeholder has two slots.

1. **App signing key** (required). PapeX is live on Play, so Google re-signs
   every release with a key you do not hold. Get its hash from
   **Play Console → your app → Setup → App integrity → App signing →
   "SHA-256 certificate fingerprint"**. Copy it with the colons, uppercase hex.
2. **Upload key** (optional). Only needed if a locally-signed or internal-track
   build must verify links too. Same page, "Upload key certificate". **If you
   don't need it, delete that line** rather than leaving the placeholder.

Do **not** use `PapeXV2/android/app/debug.keystore`. That file signs the
`release` buildType in `android/app/build.gradle` (stock Expo template, never
replaced), but real builds go through the EAS-managed keystore
(`eas credentials -p android`) and then Play re-signs them. The debug keystore's
fingerprint is not what ships.

## Verifying after deploy

```bash
# 1. the file is served, as JSON, with no redirect
curl -sI https://papex.app/.well-known/assetlinks.json | head -5

# 2. Google's own verifier agrees
curl -s 'https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://papex.app&relation=delegate_permission/common.handle_all_urls'

# 3. the device actually verified it (needs the app installed)
adb shell pm get-app-links com.app.papex
```

Step 3 should report `verified` for `papex.app` and `links.papex.app`.
Verification happens at install/update time, so an already-installed build may
need `adb shell pm verify-app-links --re-verify com.app.papex` or a reinstall.

## Note on the invite links

The app has shipped an `autoVerify` intent filter for `links.papex.app/invite`
for some time, against a host that 404s this file. So **invite links have
probably never worked as App Links on Android** — unrelated to RDH, fixed by
the same file. Worth testing once this deploys.

## Related

- `PapeXV2/docs/DEEP_LINKS_IOS_VS_ANDROID.md` — the full platform comparison
  and the app-side declarations.
- `PapeXV2/docs/ANDROID_1.6.8_CARRYOVER_HANDOFF.md` item 1 — where this was found.
