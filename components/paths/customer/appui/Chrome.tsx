import { cn } from "@/lib/utils";
import s from "./appui.module.css";
/* The iOS status-bar glyphs are device chrome, so they live with the device
   in iphone.module.css, not in the app kit sheet. */
import ip from "../iphone.module.css";

/**
 * Device-independent app furniture: status bar, the five-tab glass bar, the
 * FAB and the small round glass icon buttons. Shared by every phone on
 * /customers so they cannot drift apart again (they had: four tab bars, two
 * row styles, a serif screen title the app has never shipped).
 *
 * Nothing here holds state or reads the DOM — these render in server
 * components (FeatureScreens) and client ones (NfcPhone/WalkPhone) alike.
 */

/**
 * The five tabs, each with the PapeXV2 glass icon that the real NativeTabs bar
 * renders (`assets/icons/glass/tabbar/*.png`, copied verbatim to
 * `public/app/icons/tabbar/`). Coupons is the shopping BAG, Stores the CART —
 * Nico's rule, and the two must never be swapped.
 */
export const TABS = [
  { key: "home", label: "Home", icon: "house" },
  { key: "receipts", label: "Receipts", icon: "receipt" },
  { key: "coupons", label: "Coupons", icon: "coupon" },
  { key: "stores", label: "Stores", icon: "cart" },
  { key: "settings", label: "Settings", icon: "gear" },
] as const;

export type TabKey = (typeof TABS)[number]["key"];

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * The real 3D glass icon, not a traced SVG of it.
 *
 * The set ships an "active" and an "-inactive" variant per tab (the inactive
 * one is the same sculpt, desaturated); the bar picks between them exactly as
 * the app does. @2x/@3x come along so the icons stay sharp on a retina screen
 * where `--u` can put the base asset well above 1 device pixel per point.
 */
function TabIcon({ icon, on }: { icon: (typeof TABS)[number]["icon"]; on: boolean }) {
  const base = `/app/icons/tabbar/${icon}${on ? "" : "-inactive"}`;
  return (
    /* A 25pt decorative PNG inside a CSS-scaled mockup: next/image would fight
       the --u sizing and wrap it in a layout div for no benefit at this size. */
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={s.tabIcon}
      src={`${base}.png`}
      srcSet={`${base}@2x.png 2x, ${base}@3x.png 3x`}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}

/** The iOS 26 Liquid Glass tab bar PapeXV2 ships via NativeTabs: an inset
 *  floating capsule, the selected tab orange over the mirrored thumb. */
export function TabBar({ active }: { active: TabKey }) {
  return (
    <div className={s.tabBar} aria-hidden="true">
      {TABS.map((tab) => (
        <span key={tab.key} className={cn(s.tab, tab.key === active && s.tabOn)}>
          <TabIcon icon={tab.icon} on={tab.key === active} />
          {tab.label}
        </span>
      ))}
    </div>
  );
}

/**
 * iOS's status bar: the time on the left (empty on the lock screen, where the
 * big clock is the clock), cellular, Wi-Fi and battery on the right.
 *
 * 2.1 (2026-09-23): the three glyphs are SVGs drawn to Apple's shapes (the
 * rounded bars, the three-arc Wi-Fi fan, the battery with its cap) instead of
 * CSS borders, which at mockup scale rendered the Wi-Fi as a "?" and helped
 * the phone read as Android. The container keeps the kit's `.status` /
 * `.statusRight` classes so the kit still owns where the bar sits.
 */
export function StatusBar({ time = "7:06" }: { time?: string }) {
  return (
    <div className={s.status} aria-hidden="true">
      <span className={ip.sfTime}>{time}</span>
      <span className={s.statusRight}>
        <svg viewBox="0 0 18 12" className={ip.sbSignal} fill="#fff">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="1" />
          <rect x="4.9" y="5.2" width="3.2" height="6.8" rx="1" />
          <rect x="9.8" y="2.8" width="3.2" height="9.2" rx="1" />
          <rect x="14.7" y="0" width="3.2" height="12" rx="1" />
        </svg>
        <svg viewBox="0 0 16 12" className={ip.sbWifi} fill="#fff">
          <path d="M8 2.3c2.3 0 4.4.9 6 2.4.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7A11.4 11.4 0 0 0 8 0C5.1 0 2.4 1.1.4 3.1c-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0 1.6-1.5 3.7-2.4 6-2.4Z" />
          <path d="M8 6c1.3 0 2.4.5 3.3 1.3.2.2.5.2.7 0l.9-.9c.2-.2.2-.5 0-.7A7 7 0 0 0 8 3.7a7 7 0 0 0-4.9 2c-.2.2-.2.5 0 .7l.9.9c.2.2.5.2.7 0C5.6 6.5 6.7 6 8 6Z" />
          <path d="M10.2 9.2c.2-.2.2-.5 0-.7A3.2 3.2 0 0 0 8 7.6c-.8 0-1.6.3-2.2.9-.2.2-.2.5 0 .7l1.8 1.8c.2.2.6.2.8 0l1.8-1.8Z" />
        </svg>
        <svg viewBox="0 0 27 13" className={ip.sbBattery}>
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.6" fill="none" stroke="#fff" strokeOpacity="0.4" />
          <rect x="2" y="2" width="16.4" height="9" rx="2.2" fill="#fff" />
          <path d="M25 4.4v4.2c.8-.3 1.4-1.1 1.4-2.1s-.6-1.8-1.4-2.1Z" fill="#fff" fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

/** The orange circular "+" in the bottom-right corner of the receipts list. */
export function Fab() {
  return <span className={s.fab} aria-hidden="true" />;
}

export type RowIcon = "share" | "mail" | "people";

/** The small round button on the trailing edge of a receipt row. Its outline
 *  is the app's `standard` tier, #7FC4EC — see appui.module.css. */
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
