import { ReceiptDetailScreen, ReceiptsScreen } from "./appui";
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
 * `./appui`, the same kit the hero phone and the walkthrough use.
 */

/**
 * Wraps a screen in the device and crops it against the cell's bottom edge.
 *
 * `sheetLift` is only for screens whose content is anchored to the bottom of
 * the device (the share sheet, and the tab bar / FAB of a full app screen).
 * The crop takes roughly 40cqh off the bottom, so anything pinned there is
 * off-frame; lifting it by that much puts it back on the visible edge.
 */
function Shot({
  children,
  sheetLift,
  slot,
}: {
  children: React.ReactNode;
  sheetLift?: string;
  /** app-media slot whose real capture, if imported, replaces the drawn screen. */
  slot: string;
}) {
  return (
    // "dark" is the pointer-glow variant for a card on navy: the Features
    // section has been on the NAVY ground since 2026-09-22, and .featShot
    // takes its navy bed there (customer.module.css). If the section ever
    // goes back to light, drop this to the default `data-lit=""`.
    <div className={styles.featShot} data-lit="dark" style={{ aspectRatio: "4 / 3" }}>
      <div
        className={styles.featShotPhone}
        style={sheetLift ? ({ "--wp-sheet-lift": sheetLift } as React.CSSProperties) : undefined}
      >
        <PhoneChrome mediaSlot={slot}>{children}</PhoneChrome>
      </div>
    </div>
  );
}

/**
 * Row 1 — the real Receipts screen, mid-search. An empty search field would
 * say nothing about the feature this row is selling, so the query is typed
 * with the caret still blinking.
 */
export function ReceiptListShot() {
  return (
    <Shot slot="receipts-search" sheetLift="38cqh">
      {/* NO TAB BAR (2026-09-22, Nico). This cell crops the device, so the
          phone has no visible bottom edge — a floating five-tab capsule
          parked mid-frame reads as a rendering bug, not as chrome. The FAB
          stays and rides the crop line (--appui-lift): it is a free-floating
          button in the app too, so it looks right anywhere on the screen. */}
      <ReceiptsScreen query="blue" tabLift="38cqh" tabBar={false} />
    </Shot>
  );
}

/**
 * Row 2 — a receipt DETAIL screen (where sharing actually starts: the People
 * field), with iOS's own share sheet rising over it. Sheet anatomy is iOS's:
 * dimmed backdrop, translucent blurred material, document header, the
 * AirDrop/app row, then the action list.
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
    <Shot slot="share-sheet" sheetLift="40cqh">
      {/* The receipt stays visible behind the sheet — that's what makes it
          read as a sheet presented over the app rather than its own screen. */}
      <ReceiptDetailScreen peopleFocused />

      <div className={styles.wpDim} aria-hidden="true" />

      <div className={styles.wpSheet}>
        <div className={styles.wpSheetHead}>
          <span aria-hidden="true" className={styles.wpSheetThumb} />
          <span>
            <span className={styles.wpSheetTitle} style={{ display: "block" }}>
              United States Postal Service
            </span>
            <span className={styles.wpSheetSub} style={{ display: "block" }}>
              PapeX receipt &middot; PDF
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
