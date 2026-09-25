import {
  AppKitRoot,
  CouponsScreen,
  DEVICE,
  Fab,
  GlassIcon,
  Glyph,
  HeaderCircle,
  ReceiptDetail,
  ReceiptRow,
  ReceiptsScreen,
  Screen,
  SearchField,
  SelectCapsule,
  StatusBar,
  StoreTile,
  T,
  TabBar,
  TabTitleRow,
  TitleBubble,
  V,
  appTheme,
  headerContentTop,
  headerTop,
  type KitReceipt,
} from "@/components/app-kit";
import { describeCouponExpiry } from "@/components/app-kit/couponLogic";
import { pt, rn } from "@/components/app-kit/rnStyle";
import { DEMO_NOW } from "@/components/app-kit/sampleData";
import { rn as R } from "@/lib/app-kit/rnStyles";
import { tabBarMetrics } from "@/lib/app-kit/tokens";
import { cn } from "@/lib/utils";
import { featuresContent, type FeatureKey, type PersonaId } from "./content";
import {
  ADD_RECEIPTS,
  DEAL_COUPONS,
  DEAL_FAVORITE_STORES,
  DEAL_FAVORITES,
  DEAL_STORES,
  EXPORT_BY_PERSONA,
  FIND_BY_PERSONA,
  SHARE_RECEIPT,
  dealsTab,
} from "./featureData";
import { PhoneChrome } from "./WalkPhone";
import x from "./appui/appScreens.module.css";
import styles from "./quizFeatures.module.css";

/**
 * The five feature phones (section 05 Features, the quiz's outcome): Find, Export, Add,
 * Share, Deals.
 *
 * CROPPED PHONES (P3-C2, Nico 2026-09-25 — back from the whole phones of
 * 78d243a, to cut blank space and tighten the section). A crop is a REAL,
 * full-size phone that the cell cuts off — "if I cut the phone in half I can
 * only see the top half of the operating system" — NEVER a full-length screen
 * squeezed into a short frame. So the phone is sized from the CELL's height
 * (--wp-size: 132cqh in quizFeatures.module.css .shotPhone), which makes it
 * taller than the cell; the screen keeps the kit's 393 x 852pt layout, and the
 * cell's overflow:hidden does the cutting.
 *
 * `crop="bottom"` shows the TOP of the device, cut at the cell's bottom edge.
 * `crop="top"` shows the BOTTOM of the device, cut at the cell's top edge —
 * for shots whose point lives at the bottom of the screen (the open FAB, the
 * selection menu). Nothing is moved to meet the crop line
 * (app-reference.md §1.5).
 *
 * THE SCREENS ARE THE APP KIT (components/app-kit — web ports of PapeXV2's
 * own receipts.tsx / coupons.tsx / receiptDetail.tsx / stores.tsx, sized
 * from the generated StyleSheets), laid out at their real 393 x 852pt.
 *
 * DEMO DATA: featureData.ts, invented names only, and each shot carries the
 * "Demo data" caption. The quiz result (persona) picks the Find query, the
 * Export selection and the Deals tab; before the quiz, and on the server, it
 * is `casual`. Sizes are pure CSS (container units), so there is no layout
 * read and no hydration jump.
 */

const SCREEN_W = "var(--wp-w)";

export type Crop = "bottom" | "top";

/** Which edge each row's cell cuts, chosen so the part of the screen the row
 *  is about stays in view. */
export const FEATURE_CROP: Record<FeatureKey, Crop> = {
  find: "bottom",
  export: "top",
  add: "top",
  share: "bottom",
  deals: "bottom",
};

function Shot({ children, crop }: { children: React.ReactNode; crop: Crop }) {
  return (
    // "dark" = the pointer-glow variant for a card on the navy ground.
    <div className={cn(styles.shot, crop === "top" && styles.shotCropTop)} data-lit="dark" data-crop={crop}>
      {/* Decorative: the row's own text says what the phone shows. */}
      <div className={styles.shotPhone} aria-hidden="true">
        <PhoneChrome screenClassName={styles.shotScreen}>
          <AppKitRoot mode="dark" width={SCREEN_W} className={x.root}>
            {children}
          </AppKitRoot>
        </PhoneChrome>
      </div>
      <span className={styles.shotDemo}>{featuresContent.demoLabel}</span>
    </div>
  );
}

/**
 * FIND — the Receipts tab after a search: the query sits in the field with
 * its clear button, the keyboard is down, and the list holds only receipts
 * that match (search FILTERS, app-reference.md §1.7), still grouped by date.
 * Each row's meta line carries its auto-assigned category.
 */
function FindShot({ persona }: { persona: PersonaId }) {
  const { query, rows } = FIND_BY_PERSONA[persona];
  return (
    <Shot crop={FEATURE_CROP.find}>
      <ReceiptsScreen receipts={rows} query={query} />
    </Shot>
  );
}

/**
 * EXPORT — the Receipts tab in SELECT MODE (app-reference.md §1.4, "Select
 * mode"; PapeXV2 app/(tabs)/receipts.tsx + components/ui/SelectionFAB.tsx):
 * the title row turns into [✕] [N Selected] [•••], every row shows its
 * checkbox (the ticked ones get the 2pt orange selection ring), and the scan
 * FAB is REPLACED — same 48pt orange circle, same spot — by the SelectionFAB:
 * a share glyph and a count badge. Its system menu is drawn open above it, in
 * the app's own order (receipts.tsx `selectionFabSections`): Share · Share to
 * Groups… · Categorize… · Check Off · Hide, then Delete in its own section.
 * "Share" is the one that builds the PDF (services/receiptExport.ts →
 * "PapeX receipts (N).pdf" in the iOS share sheet), so it wears the pressed
 * highlight. The cell crops from the TOP, so the menu, the FAB and the ticked
 * rows are what shows.
 */
const MENU_ITEMS: { label: string; glyph: "share" | "people" | "pricetag" | "check-circle" | "eye-off" }[] = [
  { label: "Share", glyph: "share" },
  { label: "Share to Groups…", glyph: "people" },
  { label: "Categorize…", glyph: "pricetag" },
  { label: "Check Off", glyph: "check-circle" },
  { label: "Hide", glyph: "eye-off" },
];

function SelectionMenu({ bottom }: { bottom: number }) {
  const { colors } = appTheme("dark");
  const sf = "-apple-system, 'SF Pro Text', system-ui, sans-serif";
  const row = (label: string, glyph: React.ComponentProps<typeof Glyph>["name"], color: string, pressed = false) => (
    <V
      key={label}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: pt(44),
        paddingLeft: pt(18),
        paddingRight: pt(16),
        marginLeft: pt(6),
        marginRight: pt(6),
        borderRadius: pt(14),
        backgroundColor: pressed ? "rgba(255, 255, 255, 0.12)" : undefined,
      }}
    >
      <span style={{ fontFamily: sf, fontSize: pt(17), color, letterSpacing: "-0.01em" }}>{label}</span>
      <Glyph name={glyph} size={21} color={color} />
    </V>
  );
  return (
    <V
      style={{
        position: "absolute",
        right: pt(16),
        bottom: pt(bottom),
        width: pt(250),
        paddingTop: pt(6),
        paddingBottom: pt(6),
        borderRadius: pt(26),
        // iOS 26 menu material: a heavy blur under a near-opaque dark fill, so
        // the rows behind never read through the labels.
        backgroundColor: "rgba(34, 40, 46, 0.97)",
        backdropFilter: "blur(24px) saturate(1.4)",
        WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        border: "0.5px solid rgba(255, 255, 255, 0.14)",
        boxShadow: "0 18px 48px rgba(0, 0, 0, 0.55)",
        zIndex: 40,
      }}
    >
      {MENU_ITEMS.map((m, i) => row(m.label, m.glyph, colors.text, i === 0))}
      <V style={{ height: pt(1), marginTop: pt(6), marginBottom: pt(6), marginLeft: pt(18), marginRight: pt(18), backgroundColor: "rgba(255, 255, 255, 0.14)" }} />
      {row("Delete", "delete", "#FF453A")}
    </V>
  );
}

function ExportShot({ persona }: { persona: PersonaId }) {
  const { colors } = appTheme("dark");
  const { rows, selected } = EXPORT_BY_PERSONA[persona];
  const RS = R.receiptsScreen;
  const S = RS.styles.styles;
  const bubbleH = R.glassBubble.consts.HEADER_BUBBLE_HEIGHT;
  const searchTop = headerTop() + bubbleH + S.header.paddingBottom + S.searchRow.paddingTop;
  const listTop = searchTop + RS.consts.SEARCH_BAR_HEIGHT + RS.consts.HEADER_CONTENT_GAP_BOTTOM;
  const fabBottom = DEVICE.insetBottom + tabBarMetrics.TAB_BAR_HEIGHT + R.floatingFab.consts.FAB_TO_NAV_GAP;
  const sections: [string, KitReceipt[]][] = [];
  for (const r of rows) {
    const last = sections[sections.length - 1];
    if (last && last[0] === r.section) last[1].push(r);
    else sections.push([r.section, [r]]);
  }
  return (
    <Shot crop={FEATURE_CROP.export}>
      <Screen mode="dark">
        <V style={{ position: "absolute", left: 0, right: 0, top: pt(listTop) }}>
          {sections.map(([title, list]) => (
            <V key={title}>
              <T style={rn(S.sectionHeader, { color: colors.textSecondary })}>{title}</T>
              {list.map((r) => (
                <ReceiptRow key={r.id} receipt={r} mode="dark" selectMode selected={selected.includes(r.id)} />
              ))}
            </V>
          ))}
        </V>
        <TabTitleRow
          mode="dark"
          left={<HeaderCircle glyph="close" mode="dark" />}
          title={<TitleBubble mode="dark" title={`${selected.length} Selected`} />}
          right={<HeaderCircle glyph="more-horizontal" mode="dark" />}
        />
        <V style={{ ...rn(S.searchRow, { flexDirection: "row" }), position: "absolute", left: 0, right: 0, top: pt(searchTop - S.searchRow.paddingTop), zIndex: 10 }}>
          <SearchField mode="dark" placeholder="Search receipts..." style={{ flex: "1 1 0%" }} />
        </V>
        <Fab mode="dark" glyph="share" badge={selected.length} />
        <SelectionMenu bottom={fabBottom + R.floatingFab.consts.FAB_SIZE + 10} />
        <TabBar active="receipts" mode="dark" />
        <StatusBar />
      </Screen>
    </Shot>
  );
}

/**
 * ADD — the Receipts tab with the FAB OPEN (PapeXV2 components/ui/
 * FloatingFAB.tsx). The kit's ReceiptsScreen draws the closed FAB at the
 * app's own spot (bottom = safe area 34 + tab bar 49 + FAB_TO_NAV_GAP 6,
 * right 16); the open FAB is drawn OVER it at the identical box, from the same
 * constants, so it can never drift from the list again: the + glyph rotated
 * -135deg (the app's x), and the three ACTION_SIZE chips to its LEFT
 * (right = 16 + FAB_SIZE + FAB_TO_CLUSTER_GAP, centred on the FAB's middle,
 * ACTION_GAP apart): Capture (camera, filled), Library (images, filled),
 * Manual (edit). No backdrop — the app draws none.
 */
function OpenFab() {
  const { colors, shadows } = appTheme("dark");
  const FF = R.floatingFab;
  const C = FF.consts;
  const S = FF.styles.styles;
  const bottom = DEVICE.insetBottom + tabBarMetrics.TAB_BAR_HEIGHT + C.FAB_TO_NAV_GAP;
  const chips: { glyph: "camera" | "images" | "edit"; filled: boolean }[] = [
    { glyph: "camera", filled: true },
    { glyph: "images", filled: true },
    { glyph: "edit", filled: false },
  ];
  return (
    <>
      <V
        style={{
          ...rn(S.actionsRow),
          bottom: pt(bottom + (C.FAB_SIZE - C.ACTION_SIZE) / 2),
          right: pt(16 + C.FAB_SIZE + C.FAB_TO_CLUSTER_GAP),
          flexDirection: "row",
          gap: pt(C.ACTION_GAP),
          // Above the kit's own FAB layer (fabFloat zIndex 30).
          zIndex: 31,
        }}
      >
        {chips.map((c) => (
          <V key={c.glyph} style={rn(S.actionCircle, { backgroundColor: colors.accent }, shadows.md)}>
            <Glyph name={c.glyph} size={22} color={colors.background} filled={c.filled} />
          </V>
        ))}
      </V>
      <V style={{ ...rn(S.fabFloat), bottom: pt(bottom), right: pt(16), zIndex: 32 }}>
        <V style={rn(S.fab, { backgroundColor: colors.accent, borderColor: "rgba(255, 255, 255, 0.12)" }, shadows.lg)}>
          <Glyph name="add" size={28} color={colors.background} filled style={{ transform: "rotate(-135deg)" }} />
        </V>
      </V>
    </>
  );
}

function AddShot() {
  return (
    <Shot crop={FEATURE_CROP.add}>
      <ReceiptsScreen receipts={ADD_RECEIPTS} />
      <OpenFab />
    </Shot>
  );
}

/**
 * SHARE — a receipt's DETAIL screen (receiptDetail.tsx, a root-stack push:
 * no tab bar, no FAB) shared BOTH ways: the Shared Group card reads the group
 * and the Receipt Sharing card reads "Shared with <name>". The store card's
 * "Shared" tag is there because that list is not empty.
 */
function ShareShot() {
  return (
    <Shot crop={FEATURE_CROP.share}>
      <ReceiptDetail receipt={SHARE_RECEIPT} />
    </Shot>
  );
}

/**
 * DEALS, Stores tab (app/(tabs)/stores.tsx, app-reference.md "Stores"): the
 * pinned title row [Select] [Stores] [glass heart], the pinned "Search" field
 * 12pt under the bubble (HEADER_CONTENT_GAP), then the 2-column StoreTile
 * grid 16pt under the field (16pt edges, STORE_TILE_GAP gutter). Each tile
 * counts the shopper's own coupons for that store. No FAB on this tab.
 */
function StoresScreen() {
  const searchTop = headerContentTop();
  const gridTop = searchTop + 44 + 16;
  const ST = R.storeTile.consts;
  return (
    <Screen mode="dark">
      <V
        style={{
          position: "absolute",
          left: pt(ST.STORE_TILE_EDGE_INSET),
          right: pt(ST.STORE_TILE_EDGE_INSET),
          top: pt(gridTop),
          flexDirection: "row",
          flexWrap: "wrap",
          gap: pt(ST.STORE_TILE_GAP),
        }}
      >
        {DEAL_STORES.map((store) => {
          const held = DEAL_COUPONS.filter((c) => c.storeId === store.id);
          const lead = held[0];
          const expiry = lead ? describeCouponExpiry(lead.expiresAt, DEMO_NOW) : null;
          return (
            <StoreTile
              key={store.id}
              store={store}
              mode="dark"
              couponCount={held.length}
              lead={lead ? { title: lead.title, expiry: expiry?.text } : undefined}
              isFavorite={DEAL_FAVORITE_STORES.includes(store.id)}
            />
          );
        })}
      </V>
      <TabTitleRow
        mode="dark"
        left={<SelectCapsule mode="dark" />}
        title={<TitleBubble mode="dark" title="Stores" />}
        right={
          <HeaderCircle mode="dark">
            <GlassIcon name="heart" size={R.couponsScreen.consts.HEADER_GLASS_ICON} mode="dark" />
          </HeaderCircle>
        }
      />
      <V style={{ position: "absolute", left: pt(16), right: pt(16), top: pt(searchTop), zIndex: 10, flexDirection: "row" }}>
        <SearchField mode="dark" placeholder="Search" style={{ flex: "1 1 0%" }} />
      </V>
      <TabBar active="stores" mode="dark" />
      <StatusBar />
    </Screen>
  );
}

/** DEALS, Coupons tab: the coupon list, the partner-tap Tidewick coupon on top. */
function DealsShot({ persona }: { persona: PersonaId }) {
  return (
    <Shot crop={FEATURE_CROP.deals}>
      {dealsTab[persona] === "stores" ? (
        <StoresScreen />
      ) : (
        <CouponsScreen coupons={DEAL_COUPONS} favorites={DEAL_FAVORITES} />
      )}
    </Shot>
  );
}

/** The app shot for each Features row. */
export function FeatureShot({ feature, persona }: { feature: FeatureKey; persona: PersonaId }) {
  switch (feature) {
    case "find":
      return <FindShot persona={persona} />;
    case "export":
      return <ExportShot persona={persona} />;
    case "add":
      return <AddShot />;
    case "share":
      return <ShareShot />;
    case "deals":
      return <DealsShot persona={persona} />;
  }
}
