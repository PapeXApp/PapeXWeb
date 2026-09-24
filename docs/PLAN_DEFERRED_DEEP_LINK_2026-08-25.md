# Plan — carrying the sid through an install (deferred deep linking)

Written 2026-08-24 from the pilot floor. Scheduled for 2026-08-25.
Follow-up to `af5bb36` (`/rdh` now offers the App Store instead of bouncing
back to the receipt).

## The gap

`app/rdh/page.tsx` renders only when the PapeX app is NOT installed — iOS
intercepts the universal link otherwise. It now sends the visitor to the App
Store. But **the sid does not survive the install**: they come back to a fresh
app with no idea which receipt they were trying to save, and have to tap the
device again.

## Do this first — the framing may be wrong

Before building anything, settle which journey actually matters. Per
`rdh-appclip-fallback-contract`, on iOS:

- **App NOT installed** → the tap presents the **App Clip Card**, and the clip
  opens. Safari is not involved.
- **App installed** → the parent claims only `applinks:links.papex.app`, never
  `papex.app`, so Safari opens `papex.app/r`. The web page is the
  *app-installed* path.

If that holds, then the web "Save to PapeX → no app" case is an EDGE path
(someone who opened the link from a message, a QR, or after dismissing the clip
card), not the main no-app journey. The main no-app journey goes through the
App Clip — **and Apple has a native handoff for exactly that**:

- The App Clip recommends the full app via `SKOverlay` / `AppClip` app-store
  overlay.
- The clip writes the sid into a **shared App Group container**; the full app
  reads it on first launch after install. This is Apple's supported mechanism
  and needs no third-party SDK.

`Papex_AppClip` already exists and already fetches by sid, so most of this is
plumbing, not new architecture.

**Task 0 (30 min, do it before anything else):** verify on a device with the app
uninstalled what a tap actually presents — clip card or Safari. That single
observation decides whether the rest of this plan is worth doing at all. If the
clip is the real path, build the App Group handoff and leave the web edge case
with the App Store button it now has.

## If the web path does need to carry the sid

Options, cheapest first:

1. **Do nothing more.** The App Store button already gets them the app; they tap
   the device again and it works. One extra tap, zero moving parts, no SDK, no
   privacy surface. For a pilot this is a defensible answer — say so out loud
   rather than defaulting to a vendor.
2. **Pasteboard handoff.** Web page copies the sid; the app reads the clipboard
   on first launch. Cheap, but iOS 16+ shows a paste prompt, which reads as
   creepy in exactly the moment you are asking for trust. Not recommended.
3. **Fingerprint match (self-hosted).** Web records a coarse fingerprint (IP +
   UA + timestamp) against the sid; the app asks the backend on first launch
   "was there a recent /rdh visit that looks like me?" Probabilistic, and it
   means logging visitor IPs against receipts — a real privacy cost for a
   convenience feature. Needs a deliberate decision, not a default.
4. **Third-party (Branch, AppsFlyer).** Solves it properly and quickly, at the
   cost of an SDK in the app, a vendor in the receipt path, and their own data
   collection. Hardest to justify on a receipt product whose pitch is that your
   receipts stay yours.

Recommendation: **1 or 3**, and only after Task 0 shows the web path matters.

## Acceptance

- A device with no app installed, tapping the RDH, ends up in the app looking at
  THAT receipt — with the number of manual steps documented honestly.
- Whatever is stored to bridge the install is enumerated: what field, what TTL,
  what deletes it. If it is an IP, that goes in the privacy policy.
- No regression to the app-installed path, which works today and is the common
  case.

## Related

- `af5bb36` — the `/rdh` App Store interstitial this follows up.
- `app/r/SaveToPapex.tsx` — the CTA that starts the journey.
- `public/.well-known/apple-app-site-association` — `/rdh` is claimed by the
  FULL app, not the clip. Do not change that without re-reading the fallback
  contract; the entitlement asymmetry is load-bearing.
