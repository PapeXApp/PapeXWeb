import { cn } from "@/lib/utils";
import { receiptsListContent } from "./content";
import { PhoneChrome } from "./WalkPhone";
import styles from "./customer.module.css";

/**
 * The two "Once it's yours" app shots.
 *
 * These cells shipped as literal TODO boxes — a 45-degree stripe pattern with
 * "[ app screen: receipt list + search ]" in Courier — waiting on simulator
 * captures of PapeXV2 that never came. Building them from the app's own tokens
 * instead means no capture is needed, they can't drift from the product, and
 * they stay sharp at any size.
 *
 * Fidelity notes: the categories are PapeXV2's real list
 * (constants/receiptCategories.ts — "Dining", "Gas & auto", not invented ones),
 * and the share sheet is iOS's own anatomy: dimmed backdrop, translucent
 * blurred material, document header, the AirDrop/app row, then the action list.
 */

/** Wraps a screen in the device and crops it against the cell's bottom edge. */
function Shot({ children }: { children: React.ReactNode }) {
  return (
    // "dark" was for the navy panel this cell used to sit on; the card is
    // light now (2026-09-10), so the default (lighter) pointer-glow variant
    // matches — same as the light-ground quiz options in Personas.tsx.
    <div className={styles.featShot} data-lit="" style={{ aspectRatio: "4 / 3" }}>
      <div className={styles.featShotPhone}>
        <PhoneChrome tab="receipts">{children}</PhoneChrome>
      </div>
    </div>
  );
}

const CHIPS = ["All", "Dining", "Groceries", "Travel"];

export function ReceiptListShot() {
  return (
    <Shot>
      <div className={styles.wpBody}>
        <div className={styles.wpTitle}>{receiptsListContent.title}</div>

        {/* Search shown mid-query — an empty field would say nothing about the
            feature this row is actually selling. */}
        <div className={styles.wpSearchActive}>
          <span aria-hidden="true" className={styles.wpSearchIcon} />
          blue
          <span aria-hidden="true" className={styles.wpCaret} />
        </div>

        <div className={styles.wpChips}>
          {CHIPS.map((chip, i) => (
            <span key={chip} className={cn(styles.wpChip, i === 0 && styles.wpChipOn)}>
              {chip}
            </span>
          ))}
        </div>

        <div className={styles.wpSectionLabel}>3 results</div>

        {receiptsListContent.rows.map((row) => (
          <div key={row.merchant} className={cn(styles.wpRow, row.unreviewed && styles.wpRowUnreviewed)}>
            <span aria-hidden="true" className={styles.wpAvatar}>{row.initial}</span>
            <span className={styles.wpRowText}>
              <span className={styles.wpMerchant} style={{ display: "block" }}>{row.merchant}</span>
              <span className={styles.wpMeta} style={{ display: "block" }}>
                {row.category} &middot; {row.date}
              </span>
            </span>
            <span className={styles.wpAmount}>{row.amount}</span>
            <span aria-hidden="true" className={styles.wpChevron} />
          </div>
        ))}
      </div>
    </Shot>
  );
}

/** The apps iOS actually offers first for a document share. */
const SHARE_APPS = [
  { label: "AirDrop", bg: "linear-gradient(180deg,#3E8BFF,#1F63E8)" },
  { label: "Messages", bg: "linear-gradient(180deg,#5BF675,#28C63F)" },
  { label: "Mail", bg: "linear-gradient(180deg,#57B9FF,#1E7BE0)" },
  { label: "Notes", bg: "linear-gradient(180deg,#FFE27A,#F2C300)" },
];

const SHARE_ACTIONS = ["Copy", "Save to Files", "Print"];

export function ShareSheetShot() {
  return (
    <Shot>
      {/* The receipt list stays visible behind the sheet — that's what makes it
          read as a sheet presented over the app rather than its own screen. */}
      <div className={styles.wpBody} aria-hidden="true">
        <div className={styles.wpTitle}>{receiptsListContent.title}</div>
        {receiptsListContent.rows.slice(0, 2).map((row) => (
          <div key={row.merchant} className={styles.wpRow}>
            <span className={styles.wpAvatar}>{row.initial}</span>
            <span className={styles.wpRowText}>
              <span className={styles.wpMerchant} style={{ display: "block" }}>{row.merchant}</span>
              <span className={styles.wpMeta} style={{ display: "block" }}>
                {row.category} &middot; {row.date}
              </span>
            </span>
            <span className={styles.wpAmount}>{row.amount}</span>
          </div>
        ))}
      </div>

      <div className={styles.wpDim} aria-hidden="true" />

      <div className={styles.wpSheet}>
        <div className={styles.wpSheetHead}>
          <span aria-hidden="true" className={styles.wpSheetThumb} />
          <span>
            <span className={styles.wpSheetTitle} style={{ display: "block" }}>
              Blue Bottle Coffee
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
