"use client";

// app/merchant/profile/sections.tsx
//
// The read-only cards on the Profile page, one per part of the shared
// merchant record. Every card has its own "Request a change" button, and an
// empty card still renders (with "Not on your profile yet" and an add
// button) so a merchant can see what they COULD have on their profile.

import { useState, type ReactNode } from "react";
import { Clock, ExternalLink, Globe, Link2, MapPin, PencilLine, Phone, Plus } from "lucide-react";
import type { MerchantRecord, StoreDeal, StoreHoursInterval, Weekday } from "@/lib/merchantProfiles/types";
import type { ChangeRequestAction, ChangeRequestSection } from "@/lib/changeRequests/types";
import { safeHttpUrl } from "@/lib/merchantProfilesClient";
import { Card } from "../ui/primitives";
import { T } from "../ui/tokens";
import {
  AppIconTile,
  DAY_NAMES,
  SECTION_META,
  SafeImg,
  Swatch,
  WEEK_ORDER,
  dealImageRatio,
  formatClock,
  formatDay,
  formatPrice,
  todayIn,
  zoneLabel,
} from "./shared";

export interface ComposerPrefill {
  section: ChangeRequestSection;
  action?: ChangeRequestAction;
  itemIds?: string[];
}

export type RequestHandler = (p: ComposerPrefill) => void;

const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141A24]";

// ---- Card chrome ---------------------------------------------------------------

export function RequestButton({ section, onRequest }: { section: ChangeRequestSection; onRequest: RequestHandler }) {
  return (
    <button
      type="button"
      onClick={() => onRequest({ section })}
      aria-label={`Request a change to ${SECTION_META[section].label}`}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] px-3 py-1.5 text-xs font-medium text-[#C4C7CC] transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white active:scale-[0.97] ${FOCUS_RING}`}
    >
      <PencilLine className="h-3.5 w-3.5" strokeWidth={2} />
      <span className="hidden sm:inline">Request a change</span>
      <span className="sm:hidden">Request</span>
    </button>
  );
}

export function SectionCard({
  section,
  onRequest,
  count,
  children,
  className = "",
}: {
  section: ChangeRequestSection;
  onRequest: RequestHandler;
  count?: number;
  children: ReactNode;
  className?: string;
}) {
  const meta = SECTION_META[section];
  const Icon = meta.icon;
  return (
    <Card className={`flex min-w-0 flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: T.orangeDim }}>
            <Icon className="h-4 w-4" style={{ color: T.orange }} strokeWidth={2} />
          </span>
          <h2 className="truncate font-barlow text-base font-medium" style={{ color: T.text }}>
            {meta.label}
          </h2>
          {count != null && count > 0 && (
            <span className="text-xs tabular-nums" style={{ color: T.textMuted }}>
              {count}
            </span>
          )}
        </div>
        <RequestButton section={section} onRequest={onRequest} />
      </div>
      {children}
    </Card>
  );
}

function NotYet({
  section,
  onRequest,
  message,
  addLabel,
}: {
  section: ChangeRequestSection;
  onRequest: RequestHandler;
  message: string;
  addLabel: string;
}) {
  return (
    <div
      className="flex flex-col items-start gap-3 rounded-2xl border border-dashed px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
      style={{ borderColor: "rgba(255,255,255,0.14)" }}
    >
      <div>
        <p className="text-sm font-medium" style={{ color: T.textSecondary }}>
          Not on your profile yet
        </p>
        <p className="mt-0.5 text-xs" style={{ color: T.textMuted }}>
          {message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRequest({ section, action: "add" })}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#FB8500]/[0.16] px-3 py-1.5 text-xs font-medium text-[#F4F4F4] transition hover:bg-[#FB8500]/[0.26] active:scale-[0.97] ${FOCUS_RING}`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} style={{ color: T.orange }} />
        {addLabel}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-xs" style={{ color: T.textMuted }}>
        {label}
      </span>
      <div className="min-w-0 text-sm" style={{ color: T.text }}>
        {children}
      </div>
    </div>
  );
}

function NotSet() {
  return <span style={{ color: T.textMuted }}>Not set</span>;
}

function ExternalA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex max-w-full items-center gap-1 rounded underline-offset-2 transition hover:underline ${FOCUS_RING}`}
      style={{ color: T.orange }}
    >
      <span className="truncate">{children}</span>
      <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={2.25} />
    </a>
  );
}

function prettyUrl(href: string): string {
  try {
    const u = new URL(href);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.hostname.replace(/^www\./, "")}${path}`;
  } catch {
    return href;
  }
}

// ---- Brand -----------------------------------------------------------------------

function BrandBody({ record, onRequest }: { record: MerchantRecord; onRequest: RequestHandler }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <AppIconTile
          name={record.name}
          logoUrl={record.logoUrl}
          brandColor={record.brandColor}
          brandColorSecondary={record.brandColorSecondary}
          size={64}
        />
        <div className="grid min-w-0 flex-1 gap-2.5">
          <Field label="Name">{record.name || <NotSet />}</Field>
          <Field label="Category">{record.category || <NotSet />}</Field>
        </div>
      </div>
      <Field label="Short blurb">{record.blurb || <NotSet />}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Swatch label="Primary color" hex={record.brandColor} />
        <Swatch label="Secondary color" hex={record.brandColorSecondary} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs" style={{ color: T.textMuted }}>
          Banner
        </span>
        {record.heroImageUrl ? (
          <SafeImg
            src={record.heroImageUrl}
            alt={`${record.name} banner`}
            className="aspect-[3/1] w-full rounded-xl border object-cover"
            style={{ borderColor: T.glassBorder }}
          />
        ) : (
          <div
            className="flex h-11 items-center justify-between gap-3 rounded-xl border border-dashed pl-3.5 pr-1.5"
            style={{ borderColor: "rgba(255,255,255,0.14)" }}
          >
            <span className="text-xs" style={{ color: T.textMuted }}>
              No banner yet
            </span>
            <button
              type="button"
              onClick={() => onRequest({ section: "brand", action: "add" })}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-[#F4F4F4] transition hover:bg-white/[0.06] active:scale-[0.97] ${FOCUS_RING}`}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.25} style={{ color: T.orange }} />
              Add one
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Hours -----------------------------------------------------------------------

function sortIntervals(list: StoreHoursInterval[]): StoreHoursInterval[] {
  return [...list].sort((a, b) => a.opensAt.localeCompare(b.opensAt));
}

function HoursBody({ record }: { record: MerchantRecord }) {
  const hours = record.hours!;
  const today = todayIn(hours.timezone);
  const byDay = new Map<Weekday, StoreHoursInterval[]>();
  for (const i of hours.intervals ?? []) byDay.set(i.day, [...(byDay.get(i.day) ?? []), i]);
  return (
    <div className="flex flex-col gap-2">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Weekly hours</caption>
        <tbody>
          {WEEK_ORDER.map((d) => {
            const list = sortIntervals(byDay.get(d) ?? []);
            const isToday = d === today;
            return (
              <tr key={d} className="border-b last:border-0" style={{ borderColor: T.divider }}>
                <th scope="row" className="py-2 pr-3 text-left font-normal" style={{ color: isToday ? T.text : T.textSecondary }}>
                  <span className="inline-flex items-center gap-2">
                    {DAY_NAMES[d]}
                    {isToday && (
                      <span className="rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide" style={{ background: T.orangeDim, color: T.orange }}>
                        Today
                      </span>
                    )}
                  </span>
                </th>
                <td className="py-2 text-right tabular-nums" style={{ color: list.length ? T.text : T.textMuted }}>
                  {list.length
                    ? list.map((i, idx) => (
                        <span key={idx} className="block">
                          {formatClock(i.opensAt)} to {formatClock(i.closesAt)}
                        </span>
                      ))
                    : "Closed"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
        <Clock className="h-3 w-3" strokeWidth={2} />
        {hours.timezone ? `${zoneLabel(hours.timezone)} (${hours.timezone})` : "No timezone set"}
      </p>
    </div>
  );
}

// ---- Contact -----------------------------------------------------------------------

function ContactRow({ icon: Icon, label, children }: { icon: typeof Globe; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: T.textMuted }} strokeWidth={2} />
      <Field label={label}>{children}</Field>
    </div>
  );
}

function ContactBody({ record }: { record: MerchantRecord }) {
  const website = safeHttpUrl(record.website);
  const menuUrl = safeHttpUrl(record.menuUrl);
  const tel = record.phone ? record.phone.replace(/[^\d+]/g, "") : "";
  return (
    <div className="grid gap-3.5">
      <ContactRow icon={Globe} label="Website">
        {website ? <ExternalA href={website}>{prettyUrl(website)}</ExternalA> : record.website ? <span style={{ color: T.textSecondary }}>{record.website}</span> : <NotSet />}
      </ContactRow>
      <ContactRow icon={MapPin} label="Address">
        {record.address ? (
          <span className="flex flex-col gap-0.5">
            <span className="whitespace-pre-line">{record.address}</span>
            <ExternalA href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.address)}`}>Open in Maps</ExternalA>
          </span>
        ) : (
          <NotSet />
        )}
      </ContactRow>
      <ContactRow icon={Phone} label="Phone">
        {record.phone ? (
          tel ? (
            <a href={`tel:${tel}`} className={`rounded underline-offset-2 transition hover:underline ${FOCUS_RING}`} style={{ color: T.orange }}>
              {record.phone}
            </a>
          ) : (
            record.phone
          )
        ) : (
          <NotSet />
        )}
      </ContactRow>
      <ContactRow icon={Link2} label="Menu link">
        {menuUrl ? <ExternalA href={menuUrl}>{prettyUrl(menuUrl)}</ExternalA> : record.menuUrl ? <span style={{ color: T.textSecondary }}>{record.menuUrl}</span> : <NotSet />}
      </ContactRow>
    </div>
  );
}

// ---- Menu ----------------------------------------------------------------------------

const MENU_PREVIEW = 8;

function MenuBody({ record }: { record: MerchantRecord }) {
  const [expanded, setExpanded] = useState(false);
  const cats = (record.menu ?? []).filter((c) => (c.items ?? []).length > 0);
  const total = cats.reduce((n, c) => n + c.items.length, 0);
  let budget = expanded ? Infinity : MENU_PREVIEW;

  return (
    <div className="flex flex-col gap-5">
      {cats.map((cat, ci) => {
        if (budget <= 0) return null;
        const shown = cat.items.slice(0, budget);
        budget -= shown.length;
        return (
          <div key={`${cat.category}-${ci}`} className="flex flex-col gap-2">
            <h3 className="font-barlow text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
              {cat.category || "Menu"} <span className="normal-case tracking-normal">({cat.items.length})</span>
            </h3>
            <ul className="grid gap-2 md:grid-cols-2">
              {shown.map((item, ii) => (
                <li
                  key={item.id ?? `${ii}-${item.name}`}
                  className="flex items-start gap-3 rounded-2xl border px-3 py-2.5"
                  style={{ borderColor: T.divider, background: "rgba(255,255,255,0.02)" }}
                >
                  {item.imageUrl && (
                    <SafeImg src={item.imageUrl} alt={item.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-medium" style={{ color: T.text }}>
                        {item.name}
                      </span>
                      <span className="shrink-0 text-sm tabular-nums" style={{ color: T.textSecondary }}>
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug" style={{ color: T.textMuted }}>
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      {total > MENU_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className={`self-start rounded-full border border-white/[0.12] px-3.5 py-1.5 text-xs font-medium text-[#C4C7CC] transition hover:bg-white/[0.06] hover:text-white ${FOCUS_RING}`}
        >
          {expanded ? "Show less" : `Show all ${total} items`}
        </button>
      )}
    </div>
  );
}

// ---- Deals ----------------------------------------------------------------------------

function dealRange(d: StoreDeal): string {
  if (d.startsOn && d.endsOn) return `Runs ${formatDay(d.startsOn)} to ${formatDay(d.endsOn)}`;
  if (d.startsOn) return `Starts ${formatDay(d.startsOn)}`;
  if (d.endsOn) return `Ends ${formatDay(d.endsOn)}`;
  return "";
}

function DealCard({ deal }: { deal: StoreDeal }) {
  const range = dealRange(deal);
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border" style={{ borderColor: T.divider, background: "rgba(255,255,255,0.02)" }}>
      {deal.imageUrl && (
        // Full width at the deal's own ratio, contained: the art is usually
        // text ("DAILY DEAL: ...") so any crop cuts words.
        <SafeImg
          src={deal.imageUrl}
          alt={deal.title}
          className="block w-full object-contain"
          style={{ aspectRatio: String(dealImageRatio(deal.imageAspectRatio)), background: "rgba(255,255,255,0.03)" }}
        />
      )}
      <div className="flex flex-col gap-1.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-barlow text-base font-medium leading-tight" style={{ color: T.text }}>
            {deal.title}
          </h3>
          {typeof deal.percentOff === "number" && (
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: T.orangeDim, color: T.orange }}>
              {deal.percentOff}% off
            </span>
          )}
        </div>
        {deal.schedule && (
          <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: T.warning }}>
            <Clock className="h-3 w-3" strokeWidth={2.25} />
            {deal.schedule}
          </p>
        )}
        {deal.description && (
          <p className="text-sm leading-snug" style={{ color: T.textSecondary }}>
            {deal.description}
          </p>
        )}
        {range && (
          <p className="text-xs" style={{ color: T.textMuted }}>
            {range}
          </p>
        )}
        {deal.terms && (
          <p className="text-xs leading-snug" style={{ color: T.textMuted }}>
            <span className="font-medium">Terms:</span> {deal.terms}
          </p>
        )}
      </div>
    </article>
  );
}

// ---- The whole grid ------------------------------------------------------------------------

export function ProfileSections({ record, onRequest }: { record: MerchantRecord; onRequest: RequestHandler }) {
  const hasHours = (record.hours?.intervals?.length ?? 0) > 0;
  const hasContact = !!(record.website || record.address || record.phone || record.menuUrl);
  const menuCount = (record.menu ?? []).reduce((n, c) => n + (c.items?.length ?? 0), 0);
  const deals = record.deals ?? [];
  const updates = [...(record.whatsNew ?? [])].sort((a, b) => (b.postedOn ?? "").localeCompare(a.postedOn ?? ""));
  const loyalty = record.loyaltyProgram;
  const hasLoyalty = !!(loyalty && (loyalty.programName || loyalty.nextRewardAt || loyalty.nextRewardLabel));

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <SectionCard section="brand" onRequest={onRequest}>
        <BrandBody record={record} onRequest={onRequest} />
      </SectionCard>

      <div className="grid min-w-0 gap-3">
        <SectionCard section="about" onRequest={onRequest}>
          {record.description ? (
            <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: T.textSecondary }}>
              {record.description}
            </p>
          ) : (
            <NotYet section="about" onRequest={onRequest} message="Tell customers what makes your place worth a visit." addLabel="Add a description" />
          )}
        </SectionCard>
        <SectionCard section="contact" onRequest={onRequest}>
          {hasContact ? (
            <ContactBody record={record} />
          ) : (
            <NotYet section="contact" onRequest={onRequest} message="Add a website, address or phone number." addLabel="Add contact details" />
          )}
        </SectionCard>
      </div>

      <SectionCard section="hours" onRequest={onRequest}>
        {hasHours ? (
          <HoursBody record={record} />
        ) : (
          <NotYet section="hours" onRequest={onRequest} message="Add your hours so customers know when you're open." addLabel="Add hours" />
        )}
      </SectionCard>

      <SectionCard section="loyalty" onRequest={onRequest}>
        {hasLoyalty ? (
          <div className="flex flex-col gap-3">
            <Field label="Program name">{loyalty?.programName || <NotSet />}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Next reward at">
                {typeof loyalty?.nextRewardAt === "number" ? `${loyalty.nextRewardAt.toLocaleString("en-US")} points` : <NotSet />}
              </Field>
              <Field label="Reward">{loyalty?.nextRewardLabel || <NotSet />}</Field>
            </div>
          </div>
        ) : (
          <NotYet section="loyalty" onRequest={onRequest} message="Reward regulars with points they collect in the app." addLabel="Add a loyalty program" />
        )}
      </SectionCard>

      <SectionCard section="menu" onRequest={onRequest} count={menuCount} className="lg:col-span-2">
        {menuCount > 0 ? (
          <MenuBody record={record} />
        ) : (
          <NotYet section="menu" onRequest={onRequest} message="Show customers what you sell, with prices and pictures." addLabel="Add a menu" />
        )}
      </SectionCard>

      <SectionCard section="deals" onRequest={onRequest} count={deals.length} className="lg:col-span-2">
        {deals.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {deals.map((d) => (
              <DealCard key={d.id} deal={d} />
            ))}
          </div>
        ) : (
          <NotYet section="deals" onRequest={onRequest} message="Recurring deals, like a happy hour, show up here." addLabel="Add a deal" />
        )}
      </SectionCard>

      <SectionCard section="whatsNew" onRequest={onRequest} count={updates.length} className="lg:col-span-2">
        {updates.length > 0 ? (
          <ul className="flex flex-col">
            {updates.map((u) => (
              <li key={u.id} className="flex flex-col gap-1 border-b py-3 first:pt-0 last:border-0 last:pb-0" style={{ borderColor: T.divider }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={
                      u.kind === "new-product"
                        ? { background: "rgba(16,185,129,0.14)", color: T.success }
                        : { background: "rgba(0,136,234,0.16)", color: "#5AB0F0" }
                    }
                  >
                    {u.kind === "new-product" ? "New product" : "Announcement"}
                  </span>
                  {u.postedOn && (
                    <span className="text-xs" style={{ color: T.textMuted }}>
                      {formatDay(u.postedOn)}
                    </span>
                  )}
                </div>
                <h3 className="font-barlow text-sm font-medium" style={{ color: T.text }}>
                  {u.title}
                </h3>
                {u.body && (
                  <p className="text-sm leading-snug" style={{ color: T.textSecondary }}>
                    {u.body}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <NotYet section="whatsNew" onRequest={onRequest} message="Share new products and announcements with your customers." addLabel="Post an update" />
        )}
      </SectionCard>
    </div>
  );
}
