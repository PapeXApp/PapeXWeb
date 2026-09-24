# PapeX app reference — for drawing the app on the website

What the PapeXV2 iPhone app looks like, taken from its **code**, so a session
can draw it on `/customers` without screenshots. Every fact cites the
PapeXV2 file it comes from (paths are relative to `code/PapeXV2/`).

- **Source snapshot:** PapeXV2 branch `feat/stores-favorites-spacing` @
  `585e439a` (2026-09-23), working tree.
- **Units:** iPhone points on a 393 × 852 screen (iPhone 15/16). Safe-area
  insets on that phone: top 59, bottom 34. The web kit uses `--u` = 1pt
  (`components/paths/customer/appui/appui.module.css`).
- **Mode:** the app ships **dark** by default (`theme/ThemeContext` resolves to
  `'dark'`, per PapeXV2 `CLAUDE.md` "State management"). Mockups are dark
  unless a section is about light mode.
- **Captures** in `app-media/reference/` are older (pre-2026-09-22 header).
  They are reference only. **When they disagree with this doc, the doc wins.**

## 1. What can and can't be on screen together

1. **Tab bar.** It shows only on the five tab roots (Home, Receipts, Coupons,
   Stores, Settings). Every pushed screen covers it: receipt detail, inbox,
   store profile and the rest. `receiptDetail` is a root `Stack.Screen`
   (`app/_layout.tsx:522`).
2. **FAB.** It shows on **Home and Receipts only**
   (`FAB_TABS = new Set(['home','receipts'])`, `app/(tabs)/_layout.tsx:211`).
   It never appears on Coupons, Stores, Settings or any pushed screen. The FAB
   is rendered by the tab layout (`<FabGate />`, `_layout.tsx:531`), so a
   pushed screen covers it too.
3. **FAB position is fixed.** It sits bottom-right, 16pt from the right edge,
   6pt above the tab bar (see §3). It never moves, and it never sits
   mid-screen. It reserves no scroll space, so content scrolls under it
   (`components/ui/tabBarMetrics.ts:70-76`).
4. **Select mode.** In select mode the scan FAB is replaced by the
   **SelectionFAB**: the same 48pt orange circle in the same spot, with a
   share glyph and a count badge. There is never a second orange circle
   (`_layout.tsx:262-294`, `components/ui/SelectionFAB.tsx:18-43`).
5. **A cropped phone cuts the real layout.** Don't move the FAB, the tab bar
   or a bottom sheet up to "meet" a crop line. Draw the real layout and let
   the crop cut it.
6. **A blinking caret needs a keyboard.** A focused text field always has
   the keyboard up. To show a typed search with no keyboard, draw the settled
   state: the query in the field plus its ✕ clear button, and no caret. That
   is the state after a hard swipe dismisses the keyboard and suggestions
   (`app/(tabs)/receipts.tsx:1418-1421`, `3837-3839`).
7. **Search filters.** Under a query, the list only holds matching receipts.
   The "N unreviewed" count is taken over that filtered list
   (`receipts.tsx:3021-3025`).
8. **Sharing-state consistency.** The "Shared" tag on a receipt's store card
   renders only when `sharedWith` is non-empty (`receiptDetail.tsx:1609`). The
   same list feeds the Receipt Sharing card ("Shared with Name"). Never draw
   the tag next to a "Not shared" sharing card.
9. **Dropdowns.** Every dropdown is Apple's system pull-down menu
   (`NativeMenu`), never a hand-drawn panel (PapeXV2 `CLAUDE.md` "UI
   components").

## 2. Bottom tab bar

- **The component.** It is the **system** `UITabBar` via expo-router
  `NativeTabs` (`app/(tabs)/_layout.tsx:371-525`). On iOS 26 it is Apple's
  Liquid Glass **floating capsule**, inset from the screen edges. No
  appearance props are set, precisely to keep it a capsule
  (`_layout.tsx:340-370`). `minimizeBehavior="never"` (`:397`), so it never
  collapses.
- **Tab order:** Home · Receipts · Coupons · Stores · Settings
  (`_layout.tsx:413, 432, 451, 489, 508`).
- **Icons.** These are the 25pt 3D glass PNGs, `renderingMode="original"`. The
  selected tab shows `<name>.png`; unselected tabs show `<name>-inactive.png`,
  which is desaturated grey (`_layout.tsx:74-112`, `158-209`).
  - The five icon files are house, receipt, coupon (a **bag**), cart
    (**Stores**) and gear. Coupons and Stores must never swap.
  - Light mode uses `-light` / `-inactive-light` variants.
  - Web copies of the dark set are in `public/app/icons/tabbar/`.
- **Labels.** Labels are always visible, set explicitly (`_layout.tsx:399-411`).
  They use the **system font**, because no `labelStyle` is set. The selected
  label is `tintColor = colors.orange` #EB7100 (`:372`).
- **Geometry is system-owned.** There is no height or spacing prop. The nominal
  metrics are a 49pt bar plus the safe-area inset (34pt)
  (`components/ui/tabBarMetrics.ts:32`, `:56`). Measured off
  `app-media/reference/app-receipts-list.png`, the visible capsule is about
  **21pt** in from each side and from the bottom, and about **59pt** tall.
  The selected tab sits on a lighter system lens.
- **Scroll clearance.** The last content ends 12pt above the bar
  (`TAB_BAR_CONTENT_GAP`, `tabBarMetrics.ts:45`).

## 3. FAB (`components/ui/FloatingFAB.tsx`)

| | Value | Source |
|---|---|---|
| Size | 48pt circle | `FAB_SIZE`, `:26` |
| Right | 16pt from screen edge | `:361` |
| Bottom | `insets.bottom + 49 + 6` = **89pt** on a 34pt-inset phone | `:247-249`, `FAB_TO_NAV_GAP` `:38` |
| Fill | `colors.accent` #EB7100, 2pt hairline `rgba(255,255,255,.12)` on the fill, `shadows.lg` | `:367-374` |
| Glyph | `add`, 28pt, `colors.background` = **navy #00121D** (not white) | `:389` |
| Open | 3 × 44pt orange chips slide out to its LEFT: Capture, Library, Manual | `:227-245`, `:316-352` |

On Home, the last element ("See All") is centred on the FAB's centre at full
scroll (`app/(tabs)/home.tsx:1643-1670`).

## 4. Header system (tab roots and pushed screens)

- **Title bubbles.** Headers are pinned **Liquid Glass bubbles** that float over
  the scrolling content. They use `GlassBubble glassStyle="clear"`; on iOS 26
  this is the system `GlassView`, with no painted frost or rim
  (`components/ui/GlassBubble.tsx:239-275`).
- **Top line.** It is `headerBubbleTop(insetTop)`, which gives
  `insetTop − 2` on notched phones (**57pt** on a 59pt inset), otherwise
  `insetTop + 4` (`GlassBubble.tsx:171-201`).
- **Bubble height.** `HEADER_BUBBLE_HEIGHT` = **44** (`:96`). The title is
  22pt Barlow-Medium (`:99-102`). The bubble has 16pt horizontal and 8pt
  vertical padding (`:320-331`). A two-line bubble is at least 68 (`:154`).
- **Header circles.** 44 × 44, with a 24pt glyph (`headerCircle`,
  `HEADER_CIRCLE_ICON`, `components/ui/GlassScreenHeader.tsx:140-163`).
  They're used for back, •••, organize/filter, heart, bell and ✕.
- **Pushed-screen header.** `GlassScreenHeader` lays out three slots:
  - left: the back circle, a `chevron-back` glyph;
  - centre: an optional title bubble;
  - right: an optional slot.

  The row has 16pt side padding and a 10pt gap (`GlassScreenHeader.tsx:284-374`).
  Content starts at `glassHeaderContentTop` = top + 44 + 12, which is
  **113** (`:195-197`).
- **Search fields.** 44pt `GlassBubble clear` capsules with 12pt side padding,
  an 18pt search glyph and 15pt Barlow-Regular text
  (`app/(tabs)/receipts.tsx:187-190`, `4200-4218`).
- **Select capsule.** Top-left on Receipts, Coupons and Stores (since
  2026-09-22). It is a 44pt glass capsule with "Select" in 17pt
  Barlow-Medium (`receipts.tsx:499-517`, `4105-4108`).

## 5. Screens, top to bottom

### Home (`app/(tabs)/home.tsx`)

Everything scrolls, 16pt side padding (`:3684`), from `headerBubbleTop`
(`:2919`, `:2395`).

1. **PapeX logo.** 80 × 32, centred, not a bubble (`:169-170`, `:2984-2994`).
2. **Greeting row.** A "Good morning," kicker (14pt), the name in 26pt
   Barlow-Bold, and an avatar on the right (`:3003-3033`, `:3709-3714`).
3. **Summary strip.** The month's total and receipt count
   (`HomeSummaryStrip`, `:3073`).
4. **SyncBanner.** Only while receipts are processing (`:3142`).
5. **"Quick actions" eyebrow.** IBM Plex Mono caps (`:3162`,
   `theme/tokens.ts` `typography.eyebrow`).
6. **Three pills in a row:** **Inbox** (with a pending badge), **Stats**,
   **Groups** (`:3218-3252`, `:3715`).
7. **Section title.** "Recent", or "Stores you shop at"
   (`components/home/HomeBrowseSwitcher.tsx:118-120`).
8. **Segmented bar.** **Receipts | Coupons | Stores** (`HomeBrowseSwitcher.tsx:101-103`).
   It pins under the header once scrolled.
9. **List body.** Up to 10 receipt rows, coupons, or a 2-column store grid of
   10 tiles (`home.tsx:151`, `HomeBrowsePanel.tsx:114`,
   `StoreTile.tsx:134`).
10. **"See All".** Orange label, resting on the FAB centre.
11. **FAB** and the **tab bar** (Home selected).

### Receipts (`app/(tabs)/receipts.tsx`)

1. **Pinned title row** at y=57, 16pt sides (`:3635-3700`, `:4079-4093`):
   - **left:** the Select capsule;
   - **centre:** the "Receipts" bubble, plus a second line "N unreviewed"
     in 12pt orange at 60% (count in Medium, word in Regular)
     (`:3673-3690`, `:4146-4147`). The count line shows only when check-off
     is on and the count is above 0 (`:3025`);
   - **right:** the **organize/filter circle** (`filter` glyph)
     (`:3442-3472`).

   The two side slots are `flex:1` and centre on the bubble.
2. **Pinned search field.** Full width, starting 12pt below the title row
   (8pt + 4pt), placeholder `"Search receipts..."` (`:3395-3405`, `:4183-4192`).
   The suggestions dropdown opens 5pt below it and pushes the list down.
3. **List.** It starts 16pt below the search field (`HEADER_CONTENT_GAP_BOTTOM`,
   `:252`), which is y≈**186** with a two-line title and 173 with a
   one-line title.
   - **Date section headers:** "Today", "Yesterday", or "September 22, 2026"
     (`:706-716`), set in 13pt Barlow-Medium `textSecondary` with 16 / 8
     padding (`:4256`).
   - **Rows:** see §7.
4. **FAB** and the **tab bar** (Receipts selected).

**Select mode** changes the title row to `[✕] [N Selected] [•••]` and swaps
in the SelectionFAB (`:3637-3640`).

### Coupons (`app/(tabs)/coupons.tsx`)

1. **Title row:** Select capsule on the left, "Coupons" bubble in the centre,
   glass **heart** and **bell** on the right (`:977-1090`).
2. **Controls row, which scrolls:** a search field (placeholder `"Search"`)
   and a filter circle (`:1500-1517`, `:3211-3220`).
3. **PromoCarousel.** It shrinks into a pinned strip on scroll (`:170-200`).
4. **The shopper's own coupon rows.** These are only coupons that were
   earned or scanned.
5. **Tab bar.** **No FAB.**

### Stores (`app/(tabs)/stores.tsx`)

1. **Pinned title row:** Select capsule, "Stores" bubble, glass heart
   (`:85-104`).
2. **Pinned search field** (placeholder `"Search"`, `:272-277`).
3. **Store tile grid,** 2 columns (`StoreTile.tsx:134`).
4. **Tab bar.** **No FAB.**

### Settings (`app/(tabs)/settings.tsx`)

1. **"Settings" bubble,** centred, with no side controls (`:149-160`).
2. **Profile card:** avatar, name, email, and "Edit Profile →" in orange
   (`:174-201`).
3. **Grouped cards.** Each has an uppercase 13pt label (`:283-289`):
   - **Account:** Payment Methods, Account Stats, Shared Groups;
   - **App Management:** Categories, Deleted Receipts, Hidden Items;
   - **More:** Advanced Settings, Submit Feedback;
   - **Sign Out**, in its own card (`:205-241`).
4. **Tab bar.** **No FAB,** and no Select.

## 6. Receipt detail (`app/receiptDetail.tsx`)

A root-stack push, so there's **no tab bar and no FAB**.

1. **Header.** `<GlassScreenHeader right={kebab} />` with **no title**: a back
   circle on the left and a ••• circle on the right, both 44pt at y=57
   (`:3134`). Content starts at 113 (`:3278`).
2. **Optional "Shared with you" card.** Blue rim, with Decline / Accept pills
   (`:3291-3330`).
3. **Optional "Original Receipt Image".** Present when an image exists
   (`:3340-3380`).
4. **Store card.** `GlassCard padding="lg" emphasis="standard"` (blue rim) in a
   20pt-padded section (`:3399`, `:4208`). Top to bottom:
   - a 48pt logo on a **white** canvas with a **2pt orange** ring, and the
     name in 24pt Barlow-Medium, centred (`:4210-4219`);
   - an inset divider (`:4220-4226`);
   - the address, 14pt centred;
   - the date and time, 12pt Barlow-Light, **orange**;
   - `"📷 Scanned Receipt"` at 10pt, plus the blue **Shared** tag when shared
     out (`:3440-3476`, `:4236-4242`).
5. **Section headings.** 20pt Barlow-Medium, 16pt below (`:4261`).
   "Category" and "Items Purchased" are **orange**; the others are white.
   Sections are 20pt from the screen edge (`:4335`).
6. **Category card.** Radius 16; **no rim** until a category is set, then an
   orange rim (`:3515-3518`).
   - Row: a tag glyph, "No category" (muted), and a right chevron
     (`:2933-2940`).
   - The row opens a **system menu**.
7. **Shared Group card.** Radius 16; no rim until the receipt is in a group,
   then a blue rim (`:3617-3620`).
   - Row: a people glyph, "Not shared", and a chevron (`:2948-2990`).
   - The row opens a system menu.
8. **Receipt Sharing card** (renamed from "People" on 2026-09-22). Always a
   **blue rim**, radius 16 (`:3685-3700`).
   - **Empty:** the card is a text field, with a person-add glyph, a
     "Not shared" placeholder and an **Add** pill (`:3063-3105`).
   - **Shared:** the row reads "**Shared with** Name" (or "Name +N"), with a
     filled person glyph in orange and a chevron (`:3023-3045`).
9. **Items Purchased card.** Blue rim, padding 24 (`:3880`). Each row has
   12pt vertical padding and a divider:
   - name, 16pt Medium;
   - "×1", 12pt muted;
   - price, 16pt white (`:4262-4279`).
10. **Totals card.** **Orange** rim (`emphasis="important"`).
    - Subtotal: the value is orange.
    - Total: a 2pt orange rule above, "Total" in 20pt orange, and the amount
      in 24pt white.
    - Payment: a payment chip (`:3945-4000`, `:4281-4286`).
11. **Further down:** Details, OCR Metadata, Receipt Information and Barcode.

**Share and menu surfaces.**

- **The ••• menu** is a system menu with Export, Categorize, Share and Edit,
  plus Delete or Recover in its own section (`:124-131`, `:1139-1199`).
- **Export** builds a **PDF** and opens the **iOS share sheet**
  (`Sharing.shareAsync`, falling back to text `Share.share`) (`:1418-1446`).
  A share sheet over this screen is therefore real. Nothing on the screen
  behind it is focused.
- **Receipt row origin ring.** On the Receipts list, the row's origin ring is
  itself a system menu for sending the receipt to a shared group.

## 7. Receipt row (`components/ui/ReceiptRow.tsx`)

- **Card.**
  - `GlassCard padding="md"` (16), radius 24, `rim="topLeft"`, `frost={1}`,
    over an **opaque bed** `colors.receiptCardBed` (`:1835-1872`).
  - 16pt side margin and 12pt gap below (`:133`, `:141`, `:2469`).
  - Height is about **91pt** (`:153-167`).
- **Rim.** The **top-left arc only**, in both states. It is white (neutral) on
  a reviewed receipt and **orange** (important) on an unreviewed one; only
  the colour changes (`:1849-1850`, comment `:1826-1834`). A selected row
  adds a 2pt orange ring (`:2502-2511`).
- **Logo.**
  - 40pt circle with a **1.5pt orange ring in both modes**, 12pt to the text
    (`:2516-2528`).
  - While unreviewed, the logo fades to 0.65 and a **10pt orange dot** with a
    1.5pt white ring sits at the bottom-right (`:1930-1950`, `:2529-2535`).
  - A checked-off receipt instead shows a 14pt blue dot with a check
    (`:2554-2558`).
- **Text column.**
  - Merchant: 16pt Barlow-Medium.
  - Meta line: `"Sep 22 • Dining"`, 13pt `textSecondary`.
  - Provenance: 12pt Medium `textMuted`, e.g. "Tapped by you" (RDH),
    "Scanned by you • The Core Four", "Email by you", or "**Shared by**
    Name in Group", with "Shared by" in #7FC4EC (`:1968-2025`,
    `services/receiptOrigin.ts:52-67`, `:175-180`).
- **Right column.**
  - Amount: 16pt Medium, or "—" if unknown.
  - Then, 10pt lower, the **28pt origin ring** (1pt, 14pt glyph) and an
    undrawn 28pt box holding an 18pt chevron that **points LEFT** at rest
    (`:2032-2220`, `:2565-2586`).
  - **Ring glyph** (`getReceiptSourceIconName`, `receiptOrigin.ts:86-110`):
    shared-in → people, shared-out → share, email → mail, manual → edit,
    clover → card, RDH or scan → scan.
  - **Ring colour:** blue #7FC4EC only when **you** shared the receipt;
    otherwise a `colors.border` ring and a white glyph (`:1671-1692`).

## 8. Tokens (`theme/tokens.ts`)

| Role | Dark | Light |
|---|---|---|
| background | #00121D | #FFFFFF |
| text / secondary / muted | white .90 / .64 / .45 | navy .90 / .64 / .60 |
| accent / primary | #EB7100 | #EB7100 |
| border / divider | white .09 / .10 | navy .115 / .093 |
| receiptCardBed | #00121D | #EDEEEF |
| chosen | #0088EA | #00121D |
| blue, standardOutline | #0088EA, #7FC4EC | same |

Sources: `colorsDark` `:153-315` and `colorsLight` `:316-474`.

- **Rim tiers** (GlassEdgeRing, lit at the top-left and bottom-right corners):
  - `neutral`: white;
  - `standard`: #7FC4EC in dark, navy in light;
  - `important`: orange.

  `GlassCard` defaults to `emphasis='none'`, which means **no rim**
  (`components/ui/GlassCard.tsx:483-484`).
- **Frost.** `glassFace.frost` is a 128° white gradient,
  .062 → .026 → .062 (`tokens.ts:1893`).
- **Radii:** 8 / 12 / **18** (strip) / **24** (cards) / 28 / pill
  (`:508-515`).
- **Spacing:** 4 / 8 / 16 / 24 / 32 / 48 (`:497-504`).
- **Fonts.** Barlow (Light, Regular, Medium, SemiBold, Bold); IBM Plex Mono
  for eyebrows and stats; the system font for the tab bar (`:475-495`). The
  UI's default weight is **Medium (500)**.
- **Light mode rule:** where dark mode is white, light mode is navy; where
  dark mode is grey, light mode is steel blue.

## 9. How the web kit maps to this

`components/paths/customer/appui/`:

- **`Screens.tsx`:** `ReceiptsScreen` (§5 Receipts), `ReceiptDetailScreen`
  (§6) and `ReceiptRow` (§7).
- **`Chrome.tsx`:** `TabBar` (§2), `Fab` (§3) and `StatusBar`.
- **`data.ts`:** rows whose fields map onto §7.
- **`appui.module.css`:** the numbers, keyed to the sections above.
- **Glass.** The web draws the glass with `backdrop-filter` and a masked
  135° ring. The **positions and the rules in §1 are not negotiable**.

## 10. How to refresh this doc

Re-read these PapeXV2 files. Line numbers drift, so search for the named
symbol.

- `app/(tabs)/_layout.tsx`: tab order, `FAB_TABS`, NativeTabs props.
- `components/ui/FloatingFAB.tsx`, `SelectionFAB.tsx` and `tabBarMetrics.ts`.
- `components/ui/GlassBubble.tsx`: `headerBubbleTop`, `HEADER_BUBBLE_*`.
- `components/ui/GlassScreenHeader.tsx`: `headerCircle`,
  `glassHeaderContentTop`.
- `app/(tabs)/receipts.tsx`: the header JSX near "THE HEADER, iOS 26" and the
  `styles`.
- `app/(tabs)/home.tsx`, `coupons.tsx`, `stores.tsx`, `settings.tsx`: the
  render order.
- `app/receiptDetail.tsx`: section order, `RECEIPT_MENU_SYMBOLS`,
  `handleShare`.
- `components/ui/ReceiptRow.tsx`: the `styles` block at the end, and the
  GlassCard props.
- `theme/tokens.ts`: `colorsDark`, `colorsLight`, `radii`, `typography`.

Then update this doc first, then `appui.module.css` and `Screens.tsx`, and
bump the snapshot line at the top.
