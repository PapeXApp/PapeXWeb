// What `npm run app:sync` reads. Paths are relative to the PapeXV2 checkout
// (PAPEXV2_DIR) or the Papex_AppClip checkout (PAPEX_APPCLIP_DIR).
//
// To mirror a new component: add its file here, run `npm run app:sync`, then
// read `rn.<key>` from lib/app-kit/rnStyles.ts in the web port.

/** Modules that are imported FOR REAL (see lib/pureImport.mjs). */
export const PURE_MODULES = {
  theme: 'theme/tokens.ts',
  motion: 'theme/motion/tokens.ts',
  pills: 'components/ui/pills/pillTokens.ts',
  tabBarMetrics: 'components/ui/tabBarMetrics.ts',
  glyphs: 'components/icons/materialGlyphMap.ts',
};

/**
 * Component files whose `StyleSheet.create` block + SCREAMING_CASE constants
 * are extracted by AST (see lib/astEval.mjs). `consts` lists names that MUST
 * resolve (the sync reports them if they stop resolving).
 */
export const COMPONENTS = {
  glassCard: { file: 'components/ui/GlassCard.tsx' },
  glassBubble: { file: 'components/ui/GlassBubble.tsx', consts: ['HEADER_BUBBLE_HEIGHT', 'headerBubbleTitle'] },
  glassScreenHeader: { file: 'components/ui/GlassScreenHeader.tsx', consts: ['headerCircle'] },
  floatingFab: { file: 'components/ui/FloatingFAB.tsx', consts: ['FAB_SIZE'] },
  segmented: { file: 'components/ui/NativeSegmentedControl.tsx', styleSheets: ['boxStyles', 'faceStyles'] },
  tag: { file: 'components/ui/pills/Tag.tsx' },
  pillButton: { file: 'components/ui/pills/PillButton.tsx' },
  receiptRow: { file: 'components/ui/ReceiptRow.tsx', consts: ['DEFAULT_ROW_GAP', 'RECEIPT_ROW_CARD_HEIGHT'] },
  couponRow: { file: 'components/coupons/CouponRow.tsx' },
  couponArtwork: { file: 'components/coupons/CouponArtwork.tsx', consts: ['LIT_MIX', 'SHADE_MIX'] },
  brandGlassSurface: { file: 'components/coupons/BrandGlassSurface.tsx', styleSheets: [] },
  couponStoreThumb: { file: 'components/coupons/CouponStoreThumb.tsx' },
  storeTile: { file: 'components/coupons/StoreTile.tsx' },
  storeHero: { file: 'components/coupons/StoreHero.tsx' },
  storeAppIcon: { file: 'components/coupons/StoreAppIcon.tsx' },
  storeBanners: { file: 'components/coupons/storeBanners.tsx', styleSheets: [] },
  button: { file: 'components/ui/Button.tsx' },
  merchantLogoImage: { file: 'components/ui/MerchantLogoImage.tsx' },
  glassIcon: { file: 'components/icons/GlassIcon.tsx', consts: ['GLASS_ALIASES'], styleSheets: [] },
  storeCouponsEmpty: { file: 'components/coupons/StoreCouponsEmpty.tsx' },
  storePointsProgress: { file: 'components/coupons/StorePointsProgress.tsx' },
  storeLoyaltyJoinCard: { file: 'components/coupons/StoreLoyaltyJoinCard.tsx' },
  storeAboutRow: { file: 'components/coupons/StoreAboutRow.tsx' },
  receiptsScreen: { file: 'app/(tabs)/receipts.tsx' },
  couponsScreen: { file: 'app/(tabs)/coupons.tsx' },
  couponDetail: { file: 'app/couponDetail.tsx' },
  storeProfile: { file: 'app/store/[id].tsx' },
  receiptDetail: { file: 'app/receiptDetail.tsx' },
  tabLayout: { file: 'app/(tabs)/_layout.tsx', consts: ['TAB_ICONS', 'FAB_TABS'], styleSheets: [] },
};

/** The tab bar is read from this file: <NativeTabs.Trigger name> order + labels. */
export const TAB_LAYOUT = 'app/(tabs)/_layout.tsx';

/** App Clip. */
export const CLIP_THEME = 'Sources/AppClip/PapeXTheme.swift';

/**
 * Assets copied into public/app/kit/. `from` is a directory (all matching
 * files) or a file; `match` filters directory entries. Only @2x rasters are
 * taken: the kit renders a 393pt screen at ≤ ~0.8 CSS px/pt, so @2x already
 * over-samples a 2x display.
 */
export const ASSETS = [
  { repo: 'papexv2', from: 'assets/icons/glass/tabbar', to: 'icons/tabbar', match: /@2x\.png$/ },
  { repo: 'papexv2', from: 'assets/icons/glass', to: 'icons/glass', match: /^[^/]+@2x\.png$/ },
  { repo: 'papexv2', from: 'assets/fonts', to: 'fonts', match: /^(Barlow-|IBMPlexMono-|MaterialSymbolsRounded200).*\.ttf$/ },
  { repo: 'papexv2', from: 'assets/logos/main_logo.png', to: 'brand/main_logo.png' },
  { repo: 'papexv2', from: 'assets/logos/Main_blue_transparent_outline.png', to: 'brand/Main_blue_transparent_outline.png' },
  { repo: 'papexv2', from: 'assets/logos/new_logo_trans.png', to: 'brand/new_logo_trans.png' },
  { repo: 'papexv2', from: 'assets/logos/papex_app_icon.png', to: 'brand/papex_app_icon.png' },
  { repo: 'papexv2', from: 'assets/images/screen-glow.png', to: 'images/screen-glow.png' },
  { repo: 'papexv2', from: 'assets/images/screen-glow-light.png', to: 'images/screen-glow-light.png' },
  { repo: 'appclip', from: 'Resources/papex-logo.png', to: 'clip/papex-logo.png' },
];

/**
 * Pure helper modules copied VERBATIM into lib/app-kit/vendor/ so the web kit
 * runs the app's own logic (colour contrast, banner pick, store theme, receipt
 * provenance) instead of a re-implementation. Allowed imports: type-only
 * (replaced by `any` aliases) and relative imports of another vendored file.
 * Anything else fails the sync. `out` is the vendored file name.
 */
export const VENDOR = [
  { file: 'components/coupons/brandContrast.ts', out: 'brandContrast.ts' },
  { file: 'components/coupons/papexBannerPick.ts', out: 'papexBannerPick.ts' },
  { file: 'components/coupons/storeTheme.ts', out: 'storeTheme.ts' },
  { file: 'services/receiptOrigin.ts', out: 'receiptOrigin.ts' },
];
