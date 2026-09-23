import { cn } from "@/lib/utils";
import { Chevron, Fab, IconButton, StatusBar, TabBar, type RowIcon, type TabKey } from "./Chrome";
import { DETAIL_RECEIPT, LIST_ROWS, type ListRow } from "./data";
import s from "./appui.module.css";

/* Rebuilt 2026-09-22 against app-media/reference/. Structure, not pixels. */

/** Circular merchant logo with the small orange dot at its bottom-right. */
export function MerchantLogo({
  initial,
  bg,
  size,
}: {
  initial: string;
  bg: string;
  /** Override in app points; defaults to the list row's 44pt. */
  size?: number;
}) {
  return (
    <span
      className={s.logo}
      aria-hidden="true"
      style={{
        background: bg,
        ...(size
          ? { width: `calc(${size} * var(--u))`, height: `calc(${size} * var(--u))`, fontSize: `calc(${size * 0.4} * var(--u))` }
          : null),
      }}
    >
      {initial}
      <span className={s.logoDot} />
    </span>
  );
}

export function ReceiptRow({ row }: { row: ListRow }) {
  return (
    <div className={s.row}>
      <span className={s.rowAccent} aria-hidden="true" />
      <MerchantLogo initial={row.initial} bg={row.logoBg} />
      <span className={s.rowText}>
        <span className={s.merchant}>{row.merchant}</span>
        <span className={s.rowDate}>{row.date}</span>
        <span className={s.rowSource}>
          {row.sharedBy ? <span className={s.rowSourceBlue}>{row.sharedBy}</span> : null}
          {row.source}
        </span>
      </span>
      <span className={s.rowRight}>
        <span className={s.amount}>{row.amount}</span>
        <span className={s.rowActions}>
          <IconButton icon={row.icon as RowIcon} />
          <Chevron />
        </span>
      </span>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.searchIcon} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <circle cx="10.6" cy="10.6" r="6.4" />
      <path d="m15.4 15.4 4.2 4.2" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.filterIcon} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M4 7.2h16M4 12h16M4 16.8h16" />
      <circle cx="9" cy="7.2" r="2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16.8" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * The Receipts screen: floating "Receipts / N unreviewed" pill + Select, the
 * search pill with its filter button, date-grouped rows, the orange FAB and
 * the five-tab glass bar.
 *
 * `query` types a term into the search field (the Features row is selling
 * search, and an empty field says nothing about it).
 * `tabLift` raises the tab bar and FAB off the device's bottom edge for the
 * cells that crop the device — same trick as --wp-sheet-lift.
 */
export function ReceiptsScreen({
  query,
  rows = LIST_ROWS,
  unreviewed = 139,
  tabLift,
}: {
  query?: string;
  rows?: ListRow[];
  unreviewed?: number;
  tabLift?: string;
}) {
  return (
    <div className={s.screen} style={tabLift ? ({ "--appui-lift": tabLift } as React.CSSProperties) : undefined}>
      <div className={s.ground} aria-hidden="true" />
      <StatusBar />

      <div className={s.listScroll}>
        <div className={s.searchRow}>
          <div className={cn(s.search, query && s.searchTyped)}>
            <SearchIcon />
            {query ?? "Search receipts…"}
            {query ? <span className={s.caret} aria-hidden="true" /> : null}
          </div>
          <span className={s.filterBtn} aria-hidden="true">
            <FilterIcon />
          </span>
        </div>

        {rows.map((row) => (
          <div key={row.merchant} className={s.listGroup}>
            <div className={s.groupLabel}>{row.group}</div>
            <ReceiptRow row={row} />
          </div>
        ))}
      </div>

      <div className={s.headerRow}>
        <div className={s.headerPill}>
          <span className={s.headerTitle}>Receipts</span>
          <span className={s.headerSub}>
            <span className={s.headerCount}>{unreviewed}</span> unreviewed
          </span>
        </div>
        <span className={s.selectPill} aria-hidden="true">
          Select
        </span>
      </div>

      <Fab />
      <TabBar active="receipts" />
    </div>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.fieldGlyph} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinejoin="round" aria-hidden="true">
      <path d="M11.4 3.4H20v8.6l-8.8 8.8-8.6-8.6z" />
      <circle cx="16.2" cy="7.6" r="1.3" />
    </svg>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className ?? s.fieldGlyph} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden="true">
      <circle cx="9.6" cy="9.2" r="2.8" />
      <path d="M4.4 19a5.2 5.2 0 0 1 10.4 0" />
      <path d="M16 7.2a2.6 2.6 0 0 1 0 5M17.6 18.6h2.4" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.chipGlyph} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.6v11" />
      <path d="m8.4 7.2 3.6-3.6 3.6 3.6" />
      <path d="M6 12.4v6.6a1.4 1.4 0 0 0 1.4 1.4h9.2a1.4 1.4 0 0 0 1.4-1.4v-6.6" />
    </svg>
  );
}

function CardGlyph() {
  return (
    <svg viewBox="0 0 24 24" className={s.chipGlyph} fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2.6" />
      <path d="M3 10h18" />
    </svg>
  );
}

/**
 * The receipt DETAIL screen — back/… glass buttons, the merchant card, the
 * Category / Shared Group / People sections, Items Purchased and the
 * orange-rimmed totals card.
 *
 * `peopleFocused` lights the People field: the share story starts there.
 */
export function ReceiptDetailScreen({ peopleFocused = false }: { peopleFocused?: boolean }) {
  const r = DETAIL_RECEIPT;
  return (
    <div className={s.screen}>
      <div className={s.ground} aria-hidden="true" />
      <StatusBar time="7:08" />

      <div className={s.detailScroll}>
        <div className={s.merchantCard}>
          <div className={s.merchantHead}>
            <MerchantLogo initial={r.initial} bg={r.logoBg} size={56} />
            <div className={s.merchantName}>{r.merchant}</div>
          </div>
          <div className={s.merchantRule} aria-hidden="true" />
          <div className={s.merchantAddr}>{r.address}</div>
          <div className={s.merchantDate}>{r.date}</div>
          <div className={s.chipRow}>
            <span className={s.chipPlain}>
              <CardGlyph />
              {r.sourceChip}
            </span>
            <span className={s.chipShared}>
              <ShareGlyph />
              Shared
            </span>
          </div>
        </div>

        <div className={cn(s.sectionTitle, s.sectionTitleAcc)}>Category</div>
        <div className={s.fieldRow}>
          <TagIcon />
          No category
          <span className={s.fieldSpacer} />
          <Chevron />
        </div>

        <div className={s.sectionTitle}>Shared Group</div>
        <div className={s.fieldRow}>
          <PeopleIcon />
          Not shared
          <span className={s.fieldSpacer} />
          <Chevron />
        </div>

        <div className={s.sectionTitle}>People</div>
        <div className={s.peopleRow}>
          <div className={cn(s.peopleInput, peopleFocused && s.peopleInputOn)}>
            Phone number or email
            {peopleFocused ? <span className={s.caret} aria-hidden="true" style={{ marginLeft: "calc(3 * var(--u))" }} /> : null}
          </div>
          <span className={s.addBtn} aria-hidden="true">
            Add
          </span>
        </div>

        <div className={cn(s.sectionTitle, s.sectionTitleAcc)}>Items Purchased</div>
        <div className={s.itemsCard}>
          {r.items.map((item) => (
            <div key={item.name} className={s.itemRow}>
              <span className={s.itemName}>{item.name}</span>
              <span>
                <span className={s.itemQty} style={{ display: "block" }}>
                  {item.qty}
                </span>
                <span className={s.itemPrice}>{item.price}</span>
              </span>
            </div>
          ))}
        </div>

        <div className={s.totalsCard}>
          <div className={s.totalRow}>
            <span className={s.totalLabel}>Subtotal</span>
            <span className={s.totalValueAcc}>{r.subtotal}</span>
          </div>
          <div className={s.totalRule} aria-hidden="true" />
          <div className={s.totalRow}>
            <span className={s.grandLabel}>Total</span>
            <span className={s.grandValue}>{r.total}</span>
          </div>
          <div className={s.totalRow}>
            <span className={s.totalLabel}>Payment</span>
            <span className={s.payChip}>
              <CardGlyph />
              {r.payment}
            </span>
          </div>
        </div>
      </div>

      <div className={s.navRow}>
        <span className={s.navBtn} aria-hidden="true">
          <Chevron back />
        </span>
        <span className={s.navBtn} aria-hidden="true">
          •••
        </span>
      </div>
    </div>
  );
}

export type { TabKey };
