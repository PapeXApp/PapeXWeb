import { ReceiptDetailScreen, ReceiptsScreen, SEARCH_QUERY, SEARCH_ROWS } from "./appui";
import { PhoneChrome } from "./WalkPhone";
import styles from "./customer.module.css";

/**
 * The two "Once it's yours" app shots.
 *
 * These cells shipped as literal TODO boxes — a 45-degree stripe pattern with
 * "[ app screen: receipt list + search ]" in Courier — waiting on simulator
 * captures of PapeXV2 that never came. Building them from the app's own
 * tokens instead means no capture is needed, they can't drift from the
 * product, and they stay sharp at any size.
 *
 * Rebuilt 2026-09-22 against app-media/reference/: both screens now come from
 * `./appui`, the same kit the hero phone and the walkthrough use. Audited
 * 2026-09-23 against PapeXV2's code (docs/design/app-reference.md).
 */

/**
 * Wraps a screen in the device and crops it against the cell's bottom edge.
 *
 * THE CROP IS HONEST (2026-09-23, Nico: "no inconsistencies, like a FAB in the
 * middle of the screen"). The screen inside is laid out exactly as the app
 * lays it out — FAB 89pt above the device's bottom edge, tab bar and share
 * sheet flush to it — and the cell simply cuts the device off. Whatever sits
 * below the cut is not shown; nothing is lifted to "ride" the crop line.
 * (This replaces the old `sheetLift` / `tabLift` props, which moved the FAB,
 * the tab bar and the share sheet up to the cut and left the FAB floating
 * mid-screen — a place the app never puts it. See
 * docs/design/app-reference.md.)
 */
function Shot({
  children,
  slot,
}: {
  children: React.ReactNode;
  /** app-media slot whose real capture, if imported, replaces the drawn screen. */
  slot: string;
}) {
  return (
    // "dark" is the pointer-glow variant for a card on navy: the Features
    // section has been on the NAVY ground since 2026-09-22, and .featShot
    // takes its navy bed there (customer.module.css). If the section ever
    // goes back to light, drop this to the default `data-lit=""`.
    <div className={styles.featShot} data-lit="dark" style={{ aspectRatio: "4 / 3" }}>
      <div className={styles.featShotPhone}>
        <PhoneChrome mediaSlot={slot}>{children}</PhoneChrome>
      </div>
    </div>
  );
}

/**
 * Row 1 — the real Receipts tab after a search for "blue": the query sits in
 * the field with its clear button, the keyboard is down, and the list holds
 * only receipts that match (search FILTERS). The whole tab is drawn — FAB and
 * tab bar included, at their real spots — and the crop cuts them off.
 */
export function ReceiptListShot() {
  return (
    <Shot slot="receipts-search">
      <ReceiptsScreen query={SEARCH_QUERY} rows={SEARCH_ROWS} />
    </Shot>
  );
}

/**
 * Row 2 — a receipt DETAIL screen with iOS's own share sheet over it. In the
 * app this sheet comes from the ••• menu's Export (a PDF of the receipt,
 * receiptDetail.tsx `handleShare` -> `Sharing.shareAsync`), so nothing on the
 * screen behind it is focused. Sheet anatomy is iOS's: dimmed backdrop,
 * translucent material, document header, the AirDrop/app row, the action
 * list. The sheet sits flush to the device bottom, where iOS puts it; the
 * cell's crop shows its top and cuts the rest.
 */
const SHARE_APPS = [
  { label: "AirDrop", bg: "linear-gradient(180deg,#3E8BFF,#1F63E8)" },
  { label: "Messages", bg: "linear-gradient(180deg,#5BF675,#28C63F)" },
  { label: "Mail", bg: "linear-gradient(180deg,#57B9FF,#1E7BE0)" },
  { label: "Notes", bg: "linear-gradient(180deg,#FFE27A,#F2C300)" },
];

const SHARE_ACTIONS = ["Copy", "Save to Files", "Print"];

export function ShareSheetShot() {
  return (
    <Shot slot="share-sheet">
      {/* The receipt stays visible behind the sheet — that's what makes it
          read as a sheet presented over the app rather than its own screen. */}
      <ReceiptDetailScreen />

      <div className={styles.wpDim} aria-hidden="true" />

      <div className={styles.wpSheet}>
        <div className={styles.wpSheetHead}>
          <span aria-hidden="true" className={styles.wpSheetThumb} />
          <span>
            <span className={styles.wpSheetTitle} style={{ display: "block" }}>
              United States Postal Service
            </span>
            <span className={styles.wpSheetSub} style={{ display: "block" }}>
              PDF Document
            </span>
          </span>
          <span aria-hidden="true" className={styles.wpSheetClose}>&times;</span>
        </div>

        <div className={styles.wpShareRow}>
          {SHARE_APPS.map((app) => (
            <span key={app.label} className={styles.wpShareApp}>
              <span aria-hidden="true" className={styles.wpShareIcon} style={{ background: app.bg }} />
              <span className={styles.wpShareLabel}>{app.label}</span>
            </span>
          ))}
        </div>

        <div className={styles.wpSheetActions}>
          {SHARE_ACTIONS.map((action) => (
            <div key={action} className={styles.wpSheetAction}>
              {action}
              <svg viewBox="0 0 24 24" className={styles.wpActionGlyph} aria-hidden="true"
                   fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                {action === "Copy" && <><rect x="9" y="9" width="11" height="11" rx="2.4" /><path d="M15 5.6A2 2 0 0 0 13.4 4H6a2 2 0 0 0-2 2v7.4A2 2 0 0 0 5.6 15" /></>}
                {action === "Save to Files" && <><path d="M3.6 7.4a2 2 0 0 1 2-2h3.2l1.8 2h7.8a2 2 0 0 1 2 2v7.2a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2z" /></>}
                {action === "Print" && <><path d="M7 9V4.4h10V9" /><rect x="4.2" y="9" width="15.6" height="7" rx="2" /><path d="M7 16h10v3.6H7z" /></>}
              </svg>
            </div>
          ))}
        </div>
      </div>
    </Shot>
  );
}
