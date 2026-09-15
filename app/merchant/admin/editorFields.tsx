"use client";

// app/merchant/admin/editorFields.tsx
//
// Form building blocks for the admin merchant editor: labeled fields, an
// image-URL field with "Upload" (assets endpoint), a generic list editor
// (add / edit / remove / move up and down), email chips, a weekday picker,
// the hours editor, and one form per list item type.

import { useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2, Upload, X } from "lucide-react";
import type {
  Coupon,
  CouponKind,
  StoreDeal,
  StoreHours,
  StoreHoursInterval,
  StoreMenuItem,
  StoreUpdate,
  Weekday,
} from "@/lib/merchantProfiles/types";
import { IMAGE_ACCEPT, adminUploadAsset, checkImageFiles, friendlyError, prepareImageForUpload, type TokenGetter } from "@/lib/merchantProfilesClient";
import { Chip, Input, Select, Spinner, Textarea } from "../ui/primitives";
import { T } from "../ui/tokens";
import { DAY_NAMES, DAY_SHORT, SafeImg, WEEK_ORDER, dealImageRatio } from "../profile/shared";

export const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#141A24]";

const labelCls = "text-xs font-medium";

// ---- Plain fields ----------------------------------------------------------------

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  required,
  className = "",
  multiline,
  rows = 3,
  mono,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  placeholder?: string;
  hint?: ReactNode;
  type?: string;
  required?: boolean;
  className?: string;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
}) {
  const id = useId();
  const set = (v: string) => onChange(v === "" ? undefined : v);
  return (
    <div className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className={labelCls} style={{ color: T.textMuted }}>
        {label}
        {required && <span style={{ color: T.orange }}> *</span>}
      </label>
      {multiline ? (
        <Textarea id={id} value={value ?? ""} onChange={(e) => set(e.target.value)} placeholder={placeholder} rows={rows} className="min-h-0" />
      ) : (
        <Input
          id={id}
          type={type}
          value={value ?? ""}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${mono ? "font-mono" : ""}`}
          style={type === "date" || type === "time" ? { colorScheme: "dark" } : undefined}
        />
      )}
      {hint && (
        <span className="text-[11px] leading-snug" style={{ color: T.textMuted }}>
          {hint}
        </span>
      )}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  step = "any",
  min,
  required,
  suffix,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  step?: string;
  min?: number;
  required?: boolean;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelCls} style={{ color: T.textMuted }}>
        {label}
        {required && <span style={{ color: T.orange }}> *</span>}
      </label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={typeof value === "number" && Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="w-full"
        />
        {suffix && (
          <span className="shrink-0 text-xs" style={{ color: T.textMuted }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function SelectField<V extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string }[];
}) {
  const id = useId();
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelCls} style={{ color: T.textMuted }}>
        {label}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as V)} className="w-full">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

// ---- Icon button ------------------------------------------------------------------

export function IconButton({
  label,
  onClick,
  disabled,
  children,
  danger,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:pointer-events-none disabled:opacity-30 ${
        danger ? "text-[#C4C7CC] hover:bg-[#EF4444]/[0.14] hover:text-[#FCA5A5]" : "text-[#C4C7CC] hover:bg-white/[0.08] hover:text-white"
      } ${FOCUS_RING}`}
    >
      {children}
    </button>
  );
}

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 self-start rounded-full bg-[#FB8500]/[0.16] px-3.5 py-1.5 text-sm font-medium text-[#F4F4F4] transition hover:bg-[#FB8500]/[0.26] active:scale-[0.97] ${FOCUS_RING}`}
    >
      <Plus className="h-4 w-4" strokeWidth={2.25} style={{ color: T.orange }} />
      {children}
    </button>
  );
}

// ---- Image URL + upload --------------------------------------------------------------

export function ImageUrlField({
  label,
  value,
  onChange,
  merchantId,
  getIdToken,
  hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  merchantId: string;
  getIdToken: TokenGetter;
  hint?: string;
}) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    const { accepted, errors } = checkImageFiles([], [file], 1);
    if (!accepted[0]) {
      setErr(errors[0] ?? "That file can't be used.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const prepared = await prepareImageForUpload(accepted[0]);
      const { url } = await adminUploadAsset(getIdToken, merchantId, prepared);
      onChange(url);
    } catch (e) {
      setErr(friendlyError(e, "Upload failed. Try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className={labelCls} style={{ color: T.textMuted }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border" style={{ borderColor: T.glassBorder }}>
          {value ? (
            <SafeImg src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="block h-full w-full" style={{ background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 4px, transparent 4px 8px)" }} />
          )}
        </span>
        <Input
          id={id}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.trim() === "" ? undefined : e.target.value.trim())}
          placeholder="https://"
          className="min-w-0 flex-1"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-white/[0.12] px-3 text-sm font-medium text-[#F4F4F4] transition hover:bg-white/[0.06] disabled:opacity-50 ${FOCUS_RING}`}
        >
          {busy ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" strokeWidth={2} />}
          <span className="hidden sm:inline">{busy ? "Uploading…" : "Upload"}</span>
        </button>
        {value && (
          <IconButton label={`Clear ${label}`} onClick={() => onChange(undefined)}>
            <X className="h-4 w-4" />
          </IconButton>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload(f);
          }}
        />
      </div>
      {(err || hint) && (
        <span className="text-[11px]" style={{ color: err ? "#FCA5A5" : T.textMuted }}>
          {err ?? hint}
        </span>
      )}
    </div>
  );
}

// ---- Generic list editor ----------------------------------------------------------------

export function ListEditor<Item>({
  items,
  onChange,
  newItem,
  summary,
  render,
  addLabel,
  emptyLabel,
  itemNoun,
}: {
  items: Item[];
  onChange: (next: Item[]) => void;
  newItem: () => Item;
  summary: (item: Item, i: number) => ReactNode;
  render: (item: Item, update: (patch: Partial<Item>) => void, i: number) => ReactNode;
  addLabel: string;
  emptyLabel: string;
  itemNoun: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    if (openIdx === i) setOpenIdx(j);
    else if (openIdx === j) setOpenIdx(i);
  }

  function remove(i: number) {
    onChange(items.filter((_, k) => k !== i));
    if (openIdx === i) setOpenIdx(null);
    else if (openIdx !== null && openIdx > i) setOpenIdx(openIdx - 1);
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-3 text-sm" style={{ borderColor: "rgba(255,255,255,0.14)", color: T.textMuted }}>
          {emptyLabel}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, i) => {
            const open = openIdx === i;
            return (
              <li key={i} className="overflow-hidden rounded-2xl border" style={{ borderColor: open ? "rgba(251,133,0,0.4)" : T.divider }}>
                <div className="flex items-center gap-1 pr-1.5">
                  <button
                    type="button"
                    onClick={() => setOpenIdx(open ? null : i)}
                    aria-expanded={open}
                    className={`flex min-w-0 flex-1 items-center gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-white/[0.04] ${FOCUS_RING} focus-visible:ring-offset-0`}
                  >
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                      style={{ color: T.textMuted }}
                      strokeWidth={2}
                    />
                    <span className="min-w-0 flex-1">{summary(item, i)}</span>
                  </button>
                  <IconButton label={`Move ${itemNoun} up`} onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={`Move ${itemNoun} down`} onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                    <ArrowDown className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={`Remove ${itemNoun}`} onClick={() => remove(i)} danger>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
                {open && (
                  <div className="border-t p-3.5" style={{ borderColor: T.divider, background: "rgba(255,255,255,0.015)" }}>
                    {render(item, (patch) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it))), i)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <AddButton
        onClick={() => {
          onChange([...items, newItem()]);
          setOpenIdx(items.length);
        }}
      >
        {addLabel}
      </AddButton>
    </div>
  );
}

export function SummaryLine({ title, sub }: { title: string; sub?: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="truncate text-sm font-medium" style={{ color: title ? T.text : T.textMuted }}>
        {title || "Untitled"}
      </span>
      {sub && (
        <span className="truncate text-xs" style={{ color: T.textMuted }}>
          {sub}
        </span>
      )}
    </span>
  );
}

// ---- Email chips --------------------------------------------------------------------------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailChips({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function commit() {
    const parts = draft.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean);
    if (parts.length === 0) return;
    const bad = parts.filter((p) => !EMAIL.test(p));
    const good = parts.filter((p) => EMAIL.test(p) && !value.includes(p));
    if (good.length) onChange([...value, ...good]);
    setErr(bad.length ? `Not an email: ${bad.join(", ")}` : null);
    setDraft(bad.join(" "));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelCls} style={{ color: T.textMuted }}>
        Dashboard logins
      </label>
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-xl border px-2 py-1.5 transition focus-within:border-[#FB8500]/60"
        style={{ borderColor: T.glassBorder, background: "rgba(255,255,255,0.03)" }}
      >
        {value.map((email) => (
          <span key={email} className="inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-xs" style={{ background: "rgba(255,255,255,0.08)", color: T.text }}>
            {email}
            <button
              type="button"
              onClick={() => onChange(value.filter((e) => e !== email))}
              aria-label={`Remove ${email}`}
              className="flex h-5 w-5 items-center justify-center rounded-full transition hover:bg-white/15 outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
              style={{ color: T.textSecondary }}
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && draft === "" && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={value.length ? "Add another" : "name@store.com"}
          className="min-w-[10rem] flex-1 bg-transparent px-1.5 py-1 text-sm text-[#F4F4F4] placeholder:text-[#6B7280] outline-none"
        />
      </div>
      <span className="text-[11px]" style={{ color: err ? "#FCA5A5" : T.textMuted }}>
        {err ?? "Press Enter to add. These people can sign in to this merchant's dashboard."}
      </span>
    </div>
  );
}

// ---- Weekdays ---------------------------------------------------------------------------

export function WeekdayPicker({ label, value, onChange }: { label: string; value: Weekday[] | undefined; onChange: (v: Weekday[] | undefined) => void }) {
  const set = new Set(value ?? []);
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={`mb-1.5 ${labelCls}`} style={{ color: T.textMuted }}>
        {label}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {WEEK_ORDER.map((d) => (
          <Chip
            key={d}
            selected={set.has(d)}
            onClick={() => {
              const next = new Set(set);
              if (next.has(d)) next.delete(d);
              else next.add(d);
              const arr = WEEK_ORDER.filter((w) => next.has(w));
              onChange(arr.length ? arr : undefined);
            }}
          >
            {DAY_SHORT[d]}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

// ---- Hours ------------------------------------------------------------------------------

const COMMON_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
];

export function HoursEditor({ hours, onChange }: { hours: StoreHours | undefined; onChange: (h: StoreHours | undefined) => void }) {
  const zoneId = useId();
  const listId = useId();
  const intervals = hours?.intervals ?? [];
  const set = (next: Partial<StoreHours>) => onChange({ intervals, ...hours, ...next });
  const setRow = (i: number, patch: Partial<StoreHoursInterval>) =>
    set({ intervals: intervals.map((r, k) => (k === i ? { ...r, ...patch } : r)) });

  function addRow() {
    const last = intervals[intervals.length - 1];
    const day = last ? (((last.day + 1) % 7) as Weekday) : (1 as Weekday);
    set({ intervals: [...intervals, { day, opensAt: last?.opensAt ?? "09:00", closesAt: last?.closesAt ?? "17:00" }] });
  }

  function sortRows() {
    const rank = (d: Weekday) => WEEK_ORDER.indexOf(d);
    set({ intervals: [...intervals].sort((a, b) => rank(a.day) - rank(b.day) || a.opensAt.localeCompare(b.opensAt)) });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-w-sm flex-col gap-1.5">
        <label htmlFor={zoneId} className={labelCls} style={{ color: T.textMuted }}>
          Timezone
        </label>
        <Input
          id={zoneId}
          list={listId}
          value={hours?.timezone ?? ""}
          onChange={(e) => set({ timezone: e.target.value.trim() || undefined })}
          placeholder="America/Los_Angeles"
          spellCheck={false}
        />
        <datalist id={listId}>
          {COMMON_ZONES.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </div>

      {intervals.length === 0 ? (
        <p className="rounded-2xl border border-dashed px-4 py-3 text-sm" style={{ borderColor: "rgba(255,255,255,0.14)", color: T.textMuted }}>
          No hours yet. Days without a row show as Closed.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {intervals.map((row, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2" style={{ borderColor: T.divider }}>
              <Select aria-label="Day" value={String(row.day)} onChange={(e) => setRow(i, { day: Number(e.target.value) as Weekday })} className="w-36">
                {WEEK_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {DAY_NAMES[d]}
                  </option>
                ))}
              </Select>
              <Input aria-label="Opens at" type="time" value={row.opensAt} onChange={(e) => setRow(i, { opensAt: e.target.value })} style={{ colorScheme: "dark" }} />
              <span className="text-xs" style={{ color: T.textMuted }}>
                to
              </span>
              <Input aria-label="Closes at" type="time" value={row.closesAt} onChange={(e) => setRow(i, { closesAt: e.target.value })} style={{ colorScheme: "dark" }} />
              {row.closesAt <= row.opensAt && (
                <span className="text-[11px]" style={{ color: T.warning }}>
                  closes next day
                </span>
              )}
              <span className="ml-auto">
                <IconButton label="Remove these hours" onClick={() => set({ intervals: intervals.filter((_, k) => k !== i) })} danger>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <AddButton onClick={addRow}>Add hours</AddButton>
        {intervals.length > 1 && (
          <button type="button" onClick={sortRows} className={`rounded-full px-3 py-1.5 text-sm font-medium text-[#C4C7CC] transition hover:bg-white/[0.06] hover:text-white ${FOCUS_RING}`}>
            Sort by day
          </button>
        )}
        {hours && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium text-[#C4C7CC] transition hover:bg-[#EF4444]/[0.12] hover:text-[#FCA5A5] ${FOCUS_RING}`}
          >
            Clear all hours
          </button>
        )}
      </div>
    </div>
  );
}

// ---- Item forms --------------------------------------------------------------------------

interface AssetCtx {
  merchantId: string;
  getIdToken: TokenGetter;
}

function IdNote({ id }: { id: string | undefined }) {
  if (!id) return null;
  return (
    <p className="text-[11px] sm:col-span-2" style={{ color: T.textMuted }}>
      id: <span className="font-mono">{id}</span>
    </p>
  );
}

export function DealForm({ deal, update, ctx }: { deal: StoreDeal; update: (p: Partial<StoreDeal>) => void; ctx: AssetCtx }) {
  const advanced = (deal.daysOfMonth?.length ?? 0) > 0 || (deal.menuItemIds?.length ?? 0) > 0;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="Title" required value={deal.title} onChange={(v) => update({ title: v ?? "" })} />
      <TextField label="Schedule" value={deal.schedule} onChange={(v) => update({ schedule: v })} placeholder="Every Tuesday, 4 to 7 PM" />
      <TextField label="Description" multiline value={deal.description} onChange={(v) => update({ description: v })} className="sm:col-span-2" />
      <TextField label="Terms" multiline rows={2} value={deal.terms} onChange={(v) => update({ terms: v })} className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <ImageUrlField label="Image" value={deal.imageUrl} onChange={(v) => update({ imageUrl: v })} {...ctx} />
      </div>
      {deal.imageUrl && (
        <div className="sm:col-span-2">
          <SafeImg
            src={deal.imageUrl}
            alt={`${deal.title || "Deal"} image, as the app shows it`}
            className="block w-full max-w-sm rounded-xl border object-contain"
            style={{ aspectRatio: String(dealImageRatio(deal.imageAspectRatio)), borderColor: T.glassBorder, background: "rgba(255,255,255,0.03)" }}
          />
        </div>
      )}
      <NumberField label="Image aspect ratio" value={deal.imageAspectRatio} onChange={(v) => update({ imageAspectRatio: v })} step="0.01" suffix="w / h" />
      <NumberField label="Percent off" value={deal.percentOff} onChange={(v) => update({ percentOff: v })} min={0} suffix="%" />
      <TextField label="Starts on" type="date" value={deal.startsOn} onChange={(v) => update({ startsOn: v })} />
      <TextField label="Ends on" type="date" value={deal.endsOn} onChange={(v) => update({ endsOn: v })} />
      <div className="sm:col-span-2">
        <WeekdayPicker label="Runs on" value={deal.weekdays} onChange={(v) => update({ weekdays: v })} />
      </div>
      <TextField label="Applies to" value={deal.appliesTo} onChange={(v) => update({ appliesTo: v })} />
      <TextField label="Category" value={deal.category} onChange={(v) => update({ category: v })} />
      {advanced && (
        <p className="text-[11px] sm:col-span-2" style={{ color: T.textMuted }}>
          This deal also has days of the month or linked menu items. Edit those in Advanced: raw JSON.
        </p>
      )}
      <IdNote id={deal.id} />
    </div>
  );
}

const COUPON_KINDS: { value: CouponKind; label: string }[] = [
  { value: "percent", label: "Percent off" },
  { value: "dollar", label: "Dollars off" },
  { value: "bogo", label: "Buy one, get one" },
  { value: "freebie", label: "Freebie" },
];

/** ISO -> YYYY-MM-DD in the browser's zone (for a date input). */
function isoToYmd(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** YYYY-MM-DD -> ISO at the end of that local day. */
function ymdToIso(ymd: string | undefined): string | undefined {
  const m = ymd ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd) : null;
  if (!m) return undefined;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59).toISOString();
}

export function CouponForm({ coupon, update }: { coupon: Coupon; update: (p: Partial<Coupon>) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="Title" required value={coupon.title} onChange={(v) => update({ title: v ?? "" })} />
      <SelectField label="Kind" value={coupon.kind} onChange={(v) => update({ kind: v })} options={COUPON_KINDS} />
      <TextField label="Value label" value={coupon.valueLabel} onChange={(v) => update({ valueLabel: v })} placeholder="20%" />
      <TextField label="Value suffix" value={coupon.valueSuffix} onChange={(v) => update({ valueSuffix: v })} placeholder="OFF" />
      <TextField label="Subtitle" value={coupon.subtitle} onChange={(v) => update({ subtitle: v })} />
      <TextField label="Badge" value={coupon.badge} onChange={(v) => update({ badge: v })} placeholder="New" />
      <TextField label="Body" multiline rows={2} value={coupon.body} onChange={(v) => update({ body: v })} className="sm:col-span-2" />
      <TextField label="Terms" multiline rows={2} value={coupon.terms} onChange={(v) => update({ terms: v })} className="sm:col-span-2" />
      <TextField label="Code" value={coupon.code} onChange={(v) => update({ code: v })} mono />
      <TextField label="Barcode" value={coupon.barcode} onChange={(v) => update({ barcode: v })} mono />
      <TextField
        label="Expires on"
        type="date"
        value={isoToYmd(coupon.expiresAt)}
        onChange={(v) => update({ expiresAt: ymdToIso(v) })}
        hint="Ends at 11:59 PM that day."
      />
      <NumberField label="Minimum spend" value={coupon.minSpend} onChange={(v) => update({ minSpend: v })} min={0} suffix="USD" />
      <label className="flex cursor-pointer items-center gap-2.5 text-sm sm:col-span-2" style={{ color: T.text }}>
        <input
          type="checkbox"
          checked={!!coupon.inStoreOnly}
          onChange={(e) => update({ inStoreOnly: e.target.checked || undefined })}
          className="h-4 w-4 cursor-pointer accent-[#FB8500]"
        />
        In store only
      </label>
      <IdNote id={coupon.id} />
    </div>
  );
}

export function UpdateForm({ item, update }: { item: StoreUpdate; update: (p: Partial<StoreUpdate>) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="Title" required value={item.title} onChange={(v) => update({ title: v ?? "" })} />
      <SelectField
        label="Kind"
        value={item.kind}
        onChange={(v) => update({ kind: v })}
        options={[
          { value: "announcement", label: "Announcement" },
          { value: "new-product", label: "New product" },
        ]}
      />
      <TextField label="Body" multiline value={item.body} onChange={(v) => update({ body: v })} className="sm:col-span-2" />
      <TextField label="Posted on" type="date" value={item.postedOn} onChange={(v) => update({ postedOn: v })} />
      <TextField label="Menu item id" value={item.menuItemId} onChange={(v) => update({ menuItemId: v })} mono hint="Optional. Links the update to a menu item." />
      <IdNote id={item.id} />
    </div>
  );
}

export function MenuItemForm({ item, update, ctx }: { item: StoreMenuItem; update: (p: Partial<StoreMenuItem>) => void; ctx: AssetCtx }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="Name" required value={item.name} onChange={(v) => update({ name: v ?? "" })} />
      <NumberField label="Price" required value={item.price} onChange={(v) => update({ price: v as number })} step="0.01" min={0} suffix="USD" />
      <TextField label="Description" multiline rows={2} value={item.description} onChange={(v) => update({ description: v })} className="sm:col-span-2" />
      <div className="sm:col-span-2">
        <ImageUrlField label="Image" value={item.imageUrl} onChange={(v) => update({ imageUrl: v })} {...ctx} />
      </div>
      <TextField label="Item id" value={item.id} onChange={(v) => update({ id: v })} mono hint="Used by deals and updates that point at this item." />
    </div>
  );
}
