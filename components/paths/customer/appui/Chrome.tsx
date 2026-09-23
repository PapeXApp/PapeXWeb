import { cn } from "@/lib/utils";
import s from "./appui.module.css";

/**
 * Device-independent app furniture: status bar, the five-tab glass bar, the
 * FAB and the small round glass icon buttons. Shared by every phone on
 * /customers so they cannot drift apart again (they had: four tab bars, two
 * row styles, a serif screen title the app has never shipped).
 *
 * Nothing here holds state or reads the DOM — these render in server
 * components (FeatureScreens) and client ones (NfcPhone/WalkPhone) alike.
 */

export const TABS = [
  { key: "home", label: "Home" },
  { key: "receipts", label: "Receipts" },
  { key: "coupons", label: "Coupons" },
  { key: "stores", label: "Stores" },
  { key: "settings", label: "Settings" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function TabGlyph({ tab }: { tab: TabKey }) {
  return (
    <svg viewBox="0 0 24 24" className={s.tabGlyph} aria-hidden="true">
      {tab === "home" && <path {...stroke} d="M3.6 10.4 12 3.8l8.4 6.6V20a1 1 0 0 1-1 1h-4.6v-6H10.2v6H5.6a1 1 0 0 1-1-1z" />}
      {tab === "receipts" && (
        <>
          <path {...stroke} d="M6 3.2h12v17.6l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.8z" />
          <path {...stroke} d="M9.2 8.2h5.6M9.2 12h5.6" />
        </>
      )}
      {/* Coupons is the shopping BAG, Stores the CART — they must differ. */}
      {tab === "coupons" && (
        <>
          <path {...stroke} d="M5.2 8.2h13.6l-1 12.2a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9z" />
          <path {...stroke} d="M8.8 8.2V6.6a3.2 3.2 0 0 1 6.4 0v1.6" />
        </>
      )}
      {tab === "stores" && (
        <>
          <path {...stroke} d="M2.8 4.4h2.4l2.2 10.2h9.8l2-7.2H6.2" />
          <circle {...stroke} cx="9.4" cy="19" r="1.3" />
          <circle {...stroke} cx="16.4" cy="19" r="1.3" />
        </>
      )}
      {tab === "settings" && (
        <>
          <circle {...stroke} cx="12" cy="12" r="3.1" />
          <path {...stroke} d="M12 4.2v1.9M12 17.9v1.9M19.8 12h-1.9M6.1 12H4.2M17.5 6.5l-1.3 1.3M7.8 16.2l-1.3 1.3M17.5 17.5l-1.3-1.3M7.8 7.8 6.5 6.5" />
        </>
      )}
    </svg>
  );
}

/** The iOS 26 Liquid Glass tab bar PapeXV2 ships via NativeTabs: an inset
 *  floating capsule, the selected tab orange with a glass oval behind it. */
export function TabBar({ active }: { active: TabKey }) {
  return (
    <div className={s.tabBar} aria-hidden="true">
      {TABS.map((tab) => (
        <span key={tab.key} className={cn(s.tab, tab.key === active && s.tabOn)}>
          <TabGlyph tab={tab.key} />
          {tab.label}
        </span>
      ))}
    </div>
  );
}

export function StatusBar({ time = "7:06" }: { time?: string }) {
  return (
    <div className={s.status} aria-hidden="true">
      <span>{time}</span>
      <span className={s.statusRight}>
        <span className={s.bars}>
          <i /><i /><i /><i />
        </span>
        <span className={s.wifi}>
          <i /><i /><i />
        </span>
        <span className={s.battery}>
          <i />
        </span>
      </span>
    </div>
  );
}

/** The orange circular "+" in the bottom-right corner of the receipts list. */
export function Fab() {
  return <span className={s.fab} aria-hidden="true" />;
}

export type RowIcon = "share" | "mail" | "people";

/** The small round glass button on the trailing edge of a receipt row. */
export function IconButton({ icon }: { icon: RowIcon }) {
  return (
    <span className={s.iconBtn} aria-hidden="true">
      <svg viewBox="0 0 24 24" className={s.iconBtnGlyph}>
        {icon === "share" && (
          <>
            <path {...stroke} d="M12 3.6v11" />
            <path {...stroke} d="m8.4 7.2 3.6-3.6 3.6 3.6" />
            <path {...stroke} d="M6 12.4v6.6a1.4 1.4 0 0 0 1.4 1.4h9.2a1.4 1.4 0 0 0 1.4-1.4v-6.6" />
          </>
        )}
        {icon === "mail" && (
          <>
            <rect {...stroke} x="3.4" y="6" width="17.2" height="12" rx="2.4" />
            <path {...stroke} d="m4.4 7.6 7.6 5.4 7.6-5.4" />
          </>
        )}
        {icon === "people" && (
          <>
            <circle {...stroke} cx="9.6" cy="9.2" r="2.8" />
            <path {...stroke} d="M4.4 19a5.2 5.2 0 0 1 10.4 0" />
            <path {...stroke} d="M16 7.2a2.6 2.6 0 0 1 0 5M17.6 18.6h2.4" />
          </>
        )}
      </svg>
    </span>
  );
}

/** Trailing disclosure chevron — two borders, no icon font. */
export function Chevron({ back = false }: { back?: boolean }) {
  return <span className={cn(s.chev, back && s.chevBack)} aria-hidden="true" />;
}
