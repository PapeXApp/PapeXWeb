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

## Do not hand-assemble this file — Play Console generates it

**Play Console → Grow users → Deep links → App configuration tab → Domains
table.** That table lists every domain declared in the app manifest with its
verification status. Click the failing row; the overlay has a **JSON generator**
that emits the complete `assetlinks.json`, with every fingerprint the app needs
already filled in. Paste or download it over this file.

Google’s docs state the generator is **additive** — it accounts for whatever is
already on the domain and highlights proposed changes, so taking its output
wholesale will not break other apps under the same account.

Two reasons this beats copying a hash by hand:

1. **There may be three keys, not one.** Under **quantum-ready hybrid signing**,
   Play signs with a classical RSA 4096 key, a post-quantum ML-DSA-65 key, and a
   separate classical key for pre-Android 17 devices. All three fingerprints
   must be listed. A single hand-copied SHA-256 silently under-covers this.
2. **The generator knows which keys actually sign your installs.** We would be
   guessing.

If you do want the raw values — **Protected with Play → Play Store distribution
→ Play app signing**, then the *App signing key* section. (Not “Setup → App
integrity”; that path is out of date.) The *Upload key certificate* on the same
page matters only for builds installed outside Play, e.g. a direct EAS artifact;
everything distributed through Play, internal testing included, carries the app
signing key.

**Never use `PapeXV2/android/app/debug.keystore`
(`EC:4D:74:A8:…:05:F9`).** `android/app/build.gradle` signs the *release*
buildType with it — stock Expo template text, never replaced. Publishing that
hash would make a locally built release APK verify while every Play install
fails: a false pass on the developer’s desk and a dead link for customers. Play
holds the real signing key and re-signs every release, so the debug key never
reaches a user.

## Verifying after deploy

```bash
# 1. the file is served, as JSON, with no redirect
curl -sI https://papex.app/.well-known/assetlinks.json | head -5

# 2. Google's own verifier agrees
curl -s 'https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://papex.app&relation=delegate_permission/common.handle_all_urls'

# 3. the device actually verified it (needs the app installed)
adb shell pm get-app-links com.app.papex
```

Step 3 should report `verified` for `papex.app` and `links.papex.app`. Reset
first with `adb shell pm set-app-links --package com.app.papex 0 all`, then
`pm verify-app-links --re-verify`, then wait a few minutes before reading.

**Propagation is slow, and this is the reason to deploy before shipping the
app.** Android 15+ re-verifies in the background but a change can take **up to
seven days** to reach all devices; Android 14 and lower never re-verifies on its
own and only reads the file at **install or update**. Play Console says the same
thing from the other side: fixing the domain does not retroactively fix existing
installs — that needs a new app release, or a Play Console **patch** (Deep links
page → Create patch), which is the only lever that reaches current installs.

Also note: on **Android 11 and lower** verification is all-or-nothing across
every `autoVerify` host in the manifest. The app declares both `papex.app` and
`links.papex.app`, so one unserved host would fail both. This single file covers
both hosts, which satisfies that — but never add an `autoVerify` host without
serving its association file.

## Note on the invite links

The app has shipped an `autoVerify` intent filter for `links.papex.app/invite`
for some time, against a host that 404s this file. So **invite links have
probably never worked as App Links on Android** — unrelated to RDH, fixed by
the same file. Worth testing once this deploys.

## Related

- `PapeXV2/docs/DEEP_LINKS_IOS_VS_ANDROID.md` — the full platform comparison
  and the app-side declarations.
- `PapeXV2/docs/ANDROID_1.6.8_CARRYOVER_HANDOFF.md` item 1 — where this was found.
