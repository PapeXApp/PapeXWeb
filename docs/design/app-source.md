# App source — drawing the PapeX app on the website from the app's own code

Every website visual of the PapeX app should come from **code**, not from a
screenshot and not from numbers retyped by hand. This is the pipeline that does
that, and the kit it feeds.

```
PapeXV2 (read-only)  ─┐                         lib/app-kit/tokens.ts      tokens as TS
Papex_AppClip (r/o)  ─┼─ npm run app:sync ──►   lib/app-kit/rnStyles.ts    StyleSheets + constants
                      │  (scripts/app-source)   lib/app-kit/glyphs.ts      AppIcon codepoints
                      │                         lib/app-kit/vendor/*.ts    pure helpers, verbatim
                      │                         components/app-kit/tokens.css   CSS custom properties
                      └─────────────────────►   public/app/kit/**          icons, fonts, logos + manifest.json
                                                        │
                              components/app-kit/**  ◄──┘  (web ports of the RN components)
```

## Re-syncing after an app change

```bash
npm run app:sync                     # reads ../PapeXV2 and ../Papex_AppClip
PAPEXV2_DIR=/path/to/PapeXV2 PAPEX_APPCLIP_DIR=/path/to/Papex_AppClip npm run app:sync
node scripts/app-source/sync.mjs --check   # exit 1 if anything generated is out of date
```

- **No network, idempotent.** A second run rewrites nothing ("no changes").
- **Provenance** is in every generated file's header and in `SOURCE` / the
  asset `manifest.json`: PapeXV2 commit + branch, Papex_AppClip commit, and the
  list of files that had **uncommitted** edits when they were read (the commit
  alone doesn't reproduce those).
- **Nothing in PapeXV2 runs** except the token leaves listed in
  `PURE_MODULES` (`scripts/app-source/config.mjs`). Everything else is only
  parsed. Those leaves import no packages; the few `react-native` calls they
  make at module scope (Platform, PixelRatio, Easing) hit a stub that answers
  as an iPhone 15/16 on iOS (393×852pt, @3x). That is `SOURCE.evalDevice`.
- After a sync, run `npx tsc --noEmit`. The generated files are `as const`, so a
  renamed or removed token becomes a type error at the port that used it. That
  is the point: the break shows up where the port reads the value, not on the page.

## What the sync extracts, and how

| Output | How | From |
|---|---|---|
| `tokens.ts` `theme` | real import, data-only exports | `theme/tokens.ts` (colours light+dark, glass, frost, rims, radii, spacing, typography, shadows… 520 values) |
| `tokens.ts` `motion`, `pills`, `tabBarMetrics` | real import | `theme/motion/tokens.ts`, `components/ui/pills/pillTokens.ts`, `components/ui/tabBarMetrics.ts` |
| `tokens.ts` `samples` | the app's own functions, called | `glassFrostAt(1)`, `glassTintAt(1)` (each mode), `pillTokensFor('dark' \| 'light')` |
| `tokens.ts` `clip` | strict line parser | `Papex_AppClip/Sources/AppClip/PapeXTheme.swift` (PXColor, PXFont weights, PXSpacing, PXRadius, GlassCardModifier rim stops, PapeXBackground glows) |
| `rnStyles.ts` `rn.<key>` | TypeScript AST evaluator | each file in `COMPONENTS`: its `StyleSheet.create` block(s) and SCREAMING_CASE constants, with identifiers resolved through imports, re-exports and barrels. Values chosen at runtime are left out and listed in `unresolved` (3 today). |
| `rnStyles.ts` `navigation` | AST + JSX scan | `app/(tabs)/_layout.tsx`: tab order, labels, icon PNGs per mode, `FAB_TABS`, tint |
| `glyphs.ts` | real import | `components/icons/materialGlyphMap.ts` (AppIcon's Material Symbols codepoints) |
| `vendor/*.ts` | copied verbatim; type imports become `any` aliases | `brandContrast.ts`, `papexBannerPick.ts`, `storeTheme.ts`, `receiptOrigin.ts` |
| `tokens.css` | from the above | `[data-app-kit]` (dark), `[data-app-kit][data-mode='light']`, `[data-app-kit-clip]`, `@font-face` for the synced fonts |
| `public/app/kit/**` | file copy + manifest (sha256, bytes, source path) | tab-bar icons (both modes), 3D glass icons @2x (both modes), Barlow ×5, IBM Plex Mono ×2, Material Symbols Rounded 200 (+Fill), PapeX logos and app icon, screen glow, the clip's `papex-logo.png` |

To mirror another component: add it to `COMPONENTS` (or a pure helper to
`VENDOR`), run the sync, then read `rn.<key>` in the port.

## The kit: `components/app-kit/`

Everything sits inside `<AppKitRoot mode width>`, which turns on the generated
variables and sets `--pt` (1 app point = `width / 393` px). Every size is written
as `calc(n * var(--pt))`, so a screen scales to any phone frame. The
components are plain functions, with no hooks and no context: they work in
server and client components alike. `mode` is passed down as a prop.

`rnStyle.ts` `rn(...)` is the bridge. It takes a generated RN style object and
returns CSS with Yoga's semantics (`flex: 1`, `paddingHorizontal`, Barlow face →
weight, the shadow model). `appKit.module.css` `.v` / `.t` reproduce RN's layout
defaults.

| Kit component | Mirrors (PapeXV2 unless noted) |
|---|---|
| `AppKitRoot`, `Screen`, `Glyph` | ScreenGlow.tsx, icons/AppIcon.tsx |
| `GlassCard`, `GlassEdgeRing`, `glassFrostAt` | ui/GlassCard.tsx (frost branch), ui/GlassEdgeRing.tsx (the same 8 pieces, `buildFade` ported line for line) |
| `LiquidBubble`, `HeaderCircle`, `TitleBubble`, `SelectCapsule`, `TabTitleRow`, `ScreenHeader`, `headerTop()` | ui/GlassBubble.tsx, ui/GlassScreenHeader.tsx, (tabs)/receipts.tsx header styles |
| `SearchField` | (tabs)/receipts.tsx searchBar/searchContent/searchInput |
| `TabBar` | (tabs)/_layout.tsx NativeTabs (via `navigation`) |
| `Fab` | ui/FloatingFAB.tsx |
| `SegmentedControl` | ui/NativeSegmentedControl.tsx (look only) |
| `Button`, `Tag`, `PillButton` | ui/Button.tsx, ui/pills/Tag.tsx, ui/pills/PillButton.tsx |
| `GlassIcon`, `FavoriteHeartGlyph` | icons/GlassIcon.tsx (+ `GLASS_ALIASES`), coupons/FavoriteHeartGlyph.tsx |
| `ReceiptRow`, `MerchantLogo` | ui/ReceiptRow.tsx (collapsed), ui/MerchantLogoImage.tsx |
| `CouponRow`, `CouponStoreThumb`, `CouponTicketSeam` | coupons/CouponRow.tsx, coupons/CouponStoreThumb.tsx, coupons/CouponArtwork.tsx (`resolveCouponField`, `storeInitials`, `deriveDealFigure`) |
| `StoreBanner`, `StorePlate`, `StoreAppIcon`, `StoreTile`, `StoreHero` | coupons/storeBanners.tsx (brand pattern + all six PapeX banners), coupons/StoreAppIcon.tsx, coupons/StoreTile.tsx, coupons/StoreHero.tsx |
| `ReceiptsScreen` | app/(tabs)/receipts.tsx |
| `CouponsScreen` | app/(tabs)/coupons.tsx (the promo carousel is empty in production, so it draws nothing) |
| `CouponDetail` | app/couponDetail.tsx (BrandGlassSurface card, Code 128 from the app's own pattern table, Use now, Remove coupon) |
| `StoreProfile` `variant="basic"` / `"partner"` | app/store/[id].tsx + StoreLoyaltyJoinCard, StorePointsProgress, StoreCouponsEmpty (partner gate = services/coupons/partners.ts) |
| `ReceiptDetail` | app/receiptDetail.tsx (store card, Category, Shared Group, Receipt Sharing, Items, Totals) |
| `ClipReceipt` | **Papex_AppClip** Sources/AppClip/ReceiptView.swift (+ docs/design/screens/ReceiptView.dc.html) |

Sample data (`sampleData.ts`) is invented and labelled demo: Tidewick Cafe,
Copperpeg Hardware, Mossbrook Pharmacy and Quillbrook Market, with invented
monogram logos. Field names follow the app's own `Store` / `Coupon` /
`DisplayReceipt` types, so the vendored helpers read it unchanged. Every coupon
is one the shopper earned on tap at a partner or scanned. None is seeded onto a
profile.

**Gallery:** `/app-kit-gallery` (`?mode=light`), **dev-only**. It calls
`notFound()` whenever `NODE_ENV` or `VERCEL_ENV` is `production`, so it never
ships and only renders under `next dev`.

## What cannot come from code

- **iOS system chrome:** the status bar, the lock screen, the App Clip card, the
  share sheet, system menus and keyboards. None of it is app code.
  `StatusBar` is a minimal drawing. Everything else uses the frames in
  `app-media/reference/`, which are reference only.
- **Liquid Glass.** GlassBubble `clear`, the tab bar capsule and the segmented
  control are the iOS 26 system material. The web draws a backdrop-blur
  approximation (`.liquid`).
- **Tab-bar capsule geometry.** UITabBar has no size props, so the capsule inset
  and height (21 / 59pt) are measured from the reference capture
  (`app-reference.md` §2), not synced.
- **App Clip layout literals.** Only the clip's tokens live in
  `PapeXTheme.swift`. Its view-body numbers (62/56 monogram, 22 padding, 52pt
  CTA, 74/132 chrome insets) are ported by hand in `ClipReceipt.tsx`, with each
  one cited. SF Symbols are drawn as SVG paths.
- **Runtime-only values.** These are measured widths, hook-derived colours and
  `useWindowDimensions`. They show up in `rn.<key>.unresolved`, and the port
  supplies them from `theme`.
- **Logic inside component files** can't be vendored whole. Examples are
  `describeCouponExpiry`, `resolveIconField`, `getReceiptSourceEmoji` and the
  banner paints. It is ported line for line, and each function's header names
  its source.

## Could the real React Native components render instead? (react-native-web)

Spike run 2026-09-24 against PapeXV2@585e439a. Everything was built in a scratch
directory: nothing was added to PapeXWeb, and nothing was run inside PapeXV2.

- **Bundling works.** esbuild with `react-native` aliased to
  `react-native-web` 0.21 (already in PapeXV2's node_modules) bundles
  `GlassCard` and `ReceiptRow` with zero shims. `renderToString` renders both on
  Node:
  - GlassCard's full 8-piece rim comes out as DOM;
  - ReceiptRow prints "Tidewick Cafe / Sep 22 • Dining / $12.40".
- **What breaks:**
  1. **The frost is dropped.** RN's `experimental_backgroundImage` is emitted as
     an invalid `experimental_background-image` CSS property, so every card
     loses its frost.
  2. **The browser bundle crashes at load.** It throws
     `TypeError: Cannot read properties of undefined (reading 'bezier')`: in
     `theme/motion/primitives/Spin.tsx`, `Easing` from Reanimated is still
     undefined because of a module-init cycle (motion ↔ components/ui barrel).
  3. **The import graph is huge.** The bundle pulls in ~1,100 modules (157 app
     files, 42 packages), about 3 MB minified for one row.
  4. **Glass and native menus degrade.** `expo-glass-effect`/`expo-blur` fall
     back to plain views, so there's no Liquid Glass, and the SwiftUI
     `NativeMenu` can't render.
- **Why it can't ship.** Vercel builds PapeXWeb **without a PapeXV2 checkout**,
  so live imports are impossible. It would take a vendored prebuilt bundle,
  plus a second React (the app is on 19.2, the site on 19.0) and
  Turbopack/webpack aliasing for code outside the repo root.
- **Verdict: not clean, so not added.** The sync-plus-ports approach gets the
  same numbers with none of the runtime cost.

## When the app changes

1. `npm run app:sync`, then `npx tsc --noEmit`. Fix any port that reads a
   renamed token.
2. If a screen's **structure** changed (a new section, a new order), update
   its port in `components/app-kit/` and `docs/design/app-reference.md`.
3. Look at `/app-kit-gallery` in both modes under `npm run dev`.
4. Commit the generated files together with the port changes.
