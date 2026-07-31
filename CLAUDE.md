# CLAUDE.md — PapeXWeb

The papex.app website (Next.js 15 App Router, deployed on Vercel) — marketing landing page, Firebase-backed blog + hidden admin CMS, waitlist, and POS-vendor ROI calculator. It is ALSO the universal-link host for the whole iOS ecosystem: it serves the AASA file that lets the mobile app and App Clip intercept `papex.app` URLs. System map: `../CLAUDE.md`.

## Commands

```bash
npm run dev          # next dev --turbopack — port 3000 by default, but .claude/launch.json expects 3001: use `npm run dev -- -p 3001` for the preview
npm run dev:clean    # rm -rf .next && dev — clears stale build cache (unix-only)
npm run build        # next build — ESLint is SKIPPED during builds (ignoreDuringBuilds)
npm run lint         # the only lint gate; a green build proves nothing about lint
```

- `npm run migrate:images` / `migrate:images:dry` are **broken** — they invoke `tsx scripts/migrateBlogImages.ts` but `scripts/` doesn't exist.
- **Deploy = push to `main`.** The single GitHub Action just curls the Vercel deploy hook — no tests, no build check, no CI gate. Anything merged to main goes live.
- There are no tests anywhere. First build on a fresh machine needs network (Inter via `next/font/google`).

## Route map

- `/` — landing page: `app/page.tsx` → `components/framer/framer-landing-page.tsx` (section components + `anim/` toolkit + `constants.ts` marketing copy).
- `/blog` + `/blog/[slug]` — Firestore posts, BUT 4 legacy static slug directories shadow the dynamic route, and `[slug]` also embeds static fallback HTML for those same slugs. Edit the right layer.
- `/dashboard` — blog CMS. Its `LoginForm` accepts ANY non-empty credentials (cosmetic gate). The REAL admin login is the deliberately faint footer button (`AdminLogin` — commit b667fdd restored it on purpose; don't remove as dead UI) → Firebase auth + hardcoded email allowlist in `hooks/useAdmin.ts`.
- `/invite/[token]` — web fallback for mobile invite links → App Store id `6754945242` (same id as `APP_DOWNLOAD_URL` in `components/framer/constants.ts`).
- `/pos-calculator` — ROI model in `lib/posValuePropModel.ts` (pure TS). `/pos-value-prop` redirects to it.
- `/waitlist`, `/contact`, `/survey`, `/privacy`, `/terms`.
- `app/api/upload-image` — the ONLY server route (Vercel Blob; needs `BLOB_READ_WRITE_TOKEN`).

## Data, auth, env

- All Firebase is client-side, project `papexweb-aed97` — config is HARDCODED in `firebase/firebaseConfig.ts` (the `NEXT_PUBLIC_FIREBASE_*` lines in `.env.example` are commented out and never read). Collections: `blogs`, `waitlist`. Firestore security rules are NOT in this repo (console-managed).
- Only two real env vars: `NEXT_PUBLIC_IMGBB_API_KEY` (blog image uploads — without it the dashboard upload fails) and `BLOB_READ_WRITE_TOKEN`.
- Images go through `lib/storageConfig.ts` — `STORAGE_PROVIDER = 'imgbb'` is a hardcoded const (the doc comment claiming it's an env var is wrong; edit the file to switch). ImgBB replaced Firebase Storage because the Firebase project has no billing plan — see `IMGBB_SETUP.md`.
- Active blog service: `lib/blogServiceFree.ts`. `lib/blogService.ts` is dead code.

## Universal links / App Clip contract — DO NOT BREAK

- `public/.well-known/apple-app-site-association`: appID `U78Z2HWA5Q.com.app.papex` claims `/invite/*`, `/r`, `/r/*`; appclips lists `U78Z2HWA5Q.com.app.papex.Clip`. Matching entitlements live in PapeXV2 and Papex_AppClip.
- The special Content-Type/Cache-Control headers for AASA in `next.config.ts` are required. Breaking either the file or the headers breaks App Clip launches and universal links for the mobile repos.
- There is intentionally NO `/r` route — `https://papex.app/r?sid=<id>` is meant to be intercepted by iOS; desktop browsers 404. Don't "fix" the missing route.
- This repo never calls `api.papex.app` or any AWS endpoint, and has no connection to the firmware.

## Styling & animation

- `app/layout.tsx` imports `styles/framer-site.css` BEFORE `app/globals.css` — the order is load-bearing (per the comment). Most landing-page visual bugs live in the 1,700-line `framer-site.css`, not Tailwind.
- Stack: Tailwind 3.4 + shadcn/ui (full Radix kit in `components/ui`), motion 12 + GSAP + Lenis + Embla. Fonts: local Barlow + Kameron, Google Inter.

## Known dead/legacy files — don't trip on, don't wire in

`lib/blogService.ts`, `app/document.jsx`, `app/head.tsx` (pages-router remnants), `public/index.html`, `public/vercel.json` (root `vercel.json` is the real one), `storage.rules` (Firebase Storage abandoned), root-level stray assets (`Kameron-SemiBold.ttf`, `Navy-Carolina.png`, `trans2.png`), `FIREBASE_STORAGE_CHECKLIST.md` (historical). README.md is stale — trust the code.
