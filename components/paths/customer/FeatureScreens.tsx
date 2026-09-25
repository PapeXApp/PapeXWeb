import {
  AppKitRoot,
  CouponsScreen,
  DEVICE,
  GlassIcon,
  Glyph,
  HeaderCircle,
  ReceiptDetail,
  ReceiptsScreen,
  Screen,
  SearchField,
  SelectCapsule,
  StatusBar,
  StoreTile,
  TabBar,
  TabTitleRow,
  TitleBubble,
  V,
  appTheme,
  headerContentTop,
} from "@/components/app-kit";
import { describeCouponExpiry } from "@/components/app-kit/couponLogic";
import { pt, rn } from "@/components/app-kit/rnStyle";
import { DEMO_NOW } from "@/components/app-kit/sampleData";
import { rn as R } from "@/lib/app-kit/rnStyles";
import { tabBarMetrics } from "@/lib/app-kit/tokens";
import { featuresContent, type FeatureKey, type PersonaId } from "./content";
import {
  ADD_RECEIPTS,
  DEAL_COUPONS,
  DEAL_FAVORITE_STORES,
  DEAL_FAVORITES,
  DEAL_STORES,
  FIND_BY_PERSONA,
  SHARE_RECEIPT,
  dealsTab,
} from "./featureData";
import { PhoneChrome } from "./WalkPhone";
import x from "./appui/appScreens.module.css";
import styles from "./customer.module.css";

/**
 * The four Features phones (05): Find, Add, Share, Deals.
 *
 * WHOLE PHONES (Web 2.1 W3, Nico 2026-09-24: "I want to see a full phone. If
 * it gets cut off it makes the screen we're displaying weird."). Each shot is
 * the page's one iPhone (PhoneChrome, iphone.module.css) shown in full, never
 * cropped, sized from the viewport in CSS (customer.module.css .featPhone),
 * so there is no layout read and no hydration jump.
 *
 * THE SCREENS ARE THE APP KIT (components/app-kit — web ports of PapeXV2's
 * own receipts.tsx / coupons.tsx / receiptDetail.tsx / stores.tsx, sized
 * from the generated StyleSheets). The kit lays each screen out at its real
 * 393 x 852pt, which is exactly the phone's screen, so a whole phone shows
 * the whole screen: FAB 89pt above the bottom edge, tab bar flush to it.
 *
 * DEMO DATA: featureData.ts, invented names only, and each shot carries the
 * "Demo data" caption. The quiz result (persona) picks the Find query and the
 * Deals tab; before the quiz, and on the server, it is `casual`.
 */

const SCREEN_W = "var(--wp-w)";

function Shot({ children }: { children: React.ReactNode }) {
  return (
    // "dark" = the pointer-glow variant for a card on the navy ground.
    <div className={styles.featStage} data-lit="dark">
      {/* Decorative: the row's own text says what the phone shows. */}
      <div className={styles.featPhone} aria-hidden="true">
        <PhoneChrome>
          <AppKitRoot mode="dark" width={SCREEN_W} className={x.root}>
            {children}
          </AppKitRoot>
        </PhoneChrome>
      </div>
      <span className={styles.featDemo}>{featuresContent.demoLabel}</span>
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
    <Shot>
      <ReceiptsScreen receipts={rows} query={query} />
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
    <Shot>
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
    <Shot>
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
    <Shot>
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
    case "add":
      return <AddShot />;
    case "share":
      return <ShareShot />;
    case "deals":
      return <DealsShot persona={persona} />;
  }
}
