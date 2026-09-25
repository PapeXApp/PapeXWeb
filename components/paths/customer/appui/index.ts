/**
 * One import point for the shared PapeX app / App Clip UI. See
 * appui.module.css for the sizing contract: the host must set `--u` to
 * (screen width / 393) on the element that wraps these.
 *
 * The app screens follow docs/design/app-reference.md (derived from
 * PapeXV2's code) — read it before changing any layout here.
 */
export { Chevron, Fab, IconButton, StatusBar, TabBar, TABS } from "./Chrome";
export type { RowIcon, TabKey } from "./Chrome";
export { MerchantLogo, ReceiptDetailScreen, ReceiptRow, ReceiptsScreen } from "./Screens";
export { ClipLockScreen, ClipReading, ClipTopBar, IslandLockGlyph, PapeXAppIcon } from "./Clip";
/* W3: the App Clip receipt and the app tabs, drawn by components/app-kit. */
export { ClipApp, toClipData } from "./ClipApp";
export { WalkAppScreen, walkReceipts } from "./AppScreens";
export { DETAIL_RECEIPT, LIST_ROWS, SEARCH_QUERY, SEARCH_ROWS } from "./data";
export type { ListRow, OriginGlyph, OriginTone } from "./data";
