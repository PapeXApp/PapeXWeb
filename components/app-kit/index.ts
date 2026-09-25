// app-kit — PapeX app screens for the website, built from the app's own code.
// See docs/design/app-source.md. Every component must sit inside <AppKitRoot>.
export { AppKitRoot, Glyph, Screen, StatusBar, T, V } from './primitives';
export { GlassCard, GlassEdgeRing, LiquidBubble, glassFrostAt } from './Glass';
export { FavoriteHeartGlyph, GlassIcon } from './GlassIcon';
export { PillButton, Tag } from './Pills';
export { Button, DEVICE, Fab, HeaderCircle, headerContentTop, headerTop, ScreenHeader, SearchField, SegmentedControl, SelectCapsule, TabBar, TabTitleRow, TitleBubble } from './Chrome';
export { MerchantLogo, ReceiptRow } from './ReceiptRow';
export { CouponRow, CouponStoreThumb, CouponTicketSeam } from './CouponRow';
export { StoreAppIcon, StoreBanner, StoreHero, StorePlate, StoreTile } from './StoreVisuals';
export { CouponDetail, CouponsScreen, ReceiptDetail, ReceiptsScreen, StoreProfile } from './Screens';
export { ClipReceipt, demoClipReceipt, type ClipReceiptData } from './ClipReceipt';
export { appTheme, type AppMode } from './theme';
export * from './sampleData';
