"use client";

// app/merchant/admin/Editor.tsx
//
// PapeX staff editor for ONE merchant record. Structured forms for every
// part of the record, an "Advanced: raw JSON" fallback, the private account
// box (dashboard logins + RDH merchant id), a live header preview, recent
// history, and, when opened from a request, that request pinned alongside
// with "Use as logo / banner" on its pictures and "Save and mark request
// done".
//
// Save = PUT with expectedVersion (optimistic concurrency). A 409 means
// someone else saved in between; we say so and offer a reload rather than
// overwriting their work.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, History, Mail, RefreshCw, Trash2, X } from "lucide-react";
import type {
  AdminMerchantResponse,
  AdminMerchantUpdate,
  Coupon,
  MerchantRecord,
  StoreDeal,
  StoreMenuCategory,
  StoreMenuItem,
  StoreUpdate,
} from "@/lib/merchantProfiles/types";
import type { ChangeRequest } from "@/lib/changeRequests/types";
import {
  adminAssetFromAttachment,
  adminGetMerchant,
  adminListRequests,
  adminSaveMerchant,
  friendlyError,
  safeHttpUrl,
  safeImageSrc,
  toApiError,
  type TokenGetter,
} from "@/lib/merchantProfilesClient";
import { Button, Card, ColorField, ErrorBanner, LoadingBlock, Spinner, StatusPill, Tabs, Textarea } from "../ui/primitives";
import { T } from "../ui/tokens";
import { BrandHeaderPreview } from "../profile/BrandHeaderPreview";
import {
  ACTION_LABEL,
  Lightbox,
  SECTION_META,
  Swatch,
  Thumb,
  formatDateTime,
  formatDay,
  formatPrice,
  isHex,
  menuItemKey,
  relativeTime,
} from "../profile/shared";
import {
  AddButton,
  CouponForm,
  DealForm,
  EmailChips,
  FOCUS_RING,
  HoursEditor,
  ImageUrlField,
  ListEditor,
  MenuItemForm,
  NumberField,
  SummaryLine,
  TextField,
  UpdateForm,
} from "./editorFields";

type Editable = Omit<MerchantRecord, "version" | "updatedAt" | "updatedBy">;

type EditorTab = "brand" | "about" | "hours" | "menu" | "deals" | "coupons" | "whatsNew" | "loyalty" | "account" | "json";

const TABS: { id: EditorTab; label: string }[] = [
  { id: "brand", label: "Brand" },
  { id: "about", label: "About & contact" },
  { id: "hours", label: "Hours" },
  { id: "menu", label: "Menu" },
  { id: "deals", label: "Deals" },
  { id: "coupons", label: "Coupons" },
  { id: "whatsNew", label: "What's new" },
  { id: "loyalty", label: "Loyalty" },
  { id: "account", label: "Account" },
  { id: "json", label: "Advanced: raw JSON" },
];

/** Which tab a request's section maps to, so a pinned request opens in the right place. */
const TAB_FOR_SECTION: Record<string, EditorTab> = {
  brand: "brand",
  about: "about",
  contact: "about",
  hours: "hours",
  menu: "menu",
  deals: "deals",
  coupons: "coupons",
  whatsNew: "whatsNew",
  loyalty: "loyalty",
  other: "brand",
};

function toEditable(r: MerchantRecord): Editable {
  const rest: Partial<MerchantRecord> = { ...r };
  delete rest.version;
  delete rest.updatedAt;
  delete rest.updatedBy;
  return rest as Editable;
}

/** Drop empty strings / undefined / NaN everywhere; drop empty top-level lists and empty hours. */
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || v === "" || (typeof v === "number" && !Number.isFinite(v))) continue;
      out[k] = clean(v);
    }
    return out;
  }
  return value;
}

function cleanRecord(d: Editable): Editable {
  const out = clean(d) as Editable & Record<string, unknown>;
  for (const k of ["menu", "deals", "coupons", "whatsNew", "menuCategories"] as const) {
    if (Array.isArray(out[k]) && (out[k] as unknown[]).length === 0) delete out[k];
  }
  if (out.hours && (out.hours.intervals?.length ?? 0) === 0 && !out.hours.timezone) delete out.hours;
  if (out.loyaltyProgram && Object.keys(out.loyaltyProgram).length === 0) delete out.loyaltyProgram;
  return out;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

function validate(d: Editable): string[] {
  const errs: string[] = [];
  if (!d.name?.trim()) errs.push("Brand: name is required.");
  if (d.brandColor && !isHex(d.brandColor)) errs.push("Brand: primary color must look like #RRGGBB.");
  if (d.brandColorSecondary && !isHex(d.brandColorSecondary)) errs.push("Brand: secondary color must look like #RRGGBB.");
  for (const [label, v] of [
    ["Logo", d.logoUrl],
    ["Banner", d.heroImageUrl],
  ] as const) {
    if (v && !safeImageSrc(v)) errs.push(`Brand: ${label} must be an http(s) link.`);
  }
  for (const [label, v] of [
    ["Website", d.website],
    ["Menu link", d.menuUrl],
  ] as const) {
    if (v && !safeHttpUrl(v)) errs.push(`Contact: ${label} isn't a valid link.`);
  }
  (d.hours?.intervals ?? []).forEach((i, n) => {
    if (!HHMM.test(i.opensAt) || !HHMM.test(i.closesAt)) errs.push(`Hours: row ${n + 1} needs both times.`);
  });
  (d.menu ?? []).forEach((c, ci) => {
    if (!c.category?.trim()) errs.push(`Menu: category ${ci + 1} needs a name.`);
    (c.items ?? []).forEach((it, ii) => {
      if (!it.name?.trim()) errs.push(`Menu: item ${ii + 1} in "${c.category || `category ${ci + 1}`}" needs a name.`);
      if (typeof it.price !== "number" || !Number.isFinite(it.price) || it.price < 0)
        errs.push(`Menu: "${it.name || `item ${ii + 1}`}" needs a price.`);
    });
  });
  const dupes = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errs.push(`${label}: two items share the id "${id}".`);
      seen.add(id);
    }
  };
  (d.deals ?? []).forEach((x, i) => !x.title?.trim() && errs.push(`Deals: deal ${i + 1} needs a title.`));
  (d.coupons ?? []).forEach((x, i) => !x.title?.trim() && errs.push(`Coupons: coupon ${i + 1} needs a title.`));
  (d.whatsNew ?? []).forEach((x, i) => !x.title?.trim() && errs.push(`What's new: update ${i + 1} needs a title.`));
  dupes("Deals", (d.deals ?? []).map((x) => x.id));
  dupes("Coupons", (d.coupons ?? []).map((x) => x.id));
  dupes("What's new", (d.whatsNew ?? []).map((x) => x.id));
  return errs;
}

function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10);
  return `${prefix}-${rand}`;
}

function todayYmd(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

interface AccountDraft {
  dashboardEmails: string[];
  rdhMerchantId: string;
}

function accountFrom(res: AdminMerchantResponse): AccountDraft {
  return { dashboardEmails: res.account?.dashboardEmails ?? [], rdhMerchantId: res.account?.rdhMerchantId ?? "" };
}

// ---- One-click apply for "remove" requests ---------------------------------------------

const REMOVE_NOUN: Partial<Record<ChangeRequest["section"], readonly [string, string]>> = {
  deals: ["deal", "deals"],
  menu: ["menu item", "menu items"],
  coupons: ["coupon", "coupons"],
  whatsNew: ["update", "updates"],
};

/**
 * What removing a request's items would do to `d`. Deals / coupons / updates
 * match on id. Menu items match on id, or, for items without one, on the
 * "Name (Category)" key the composer sends instead (menuItemKey).
 */
function planRemoval(d: Editable, req: ChangeRequest): { removed: number; missing: number; next: Partial<Editable> } | null {
  if (req.action !== "remove" || !REMOVE_NOUN[req.section] || req.itemIds.length === 0) return null;
  const ids = new Set(req.itemIds);
  const hit = new Set<string>();
  let removed = 0;
  const match = (key: string | undefined) => {
    if (!key || !ids.has(key)) return false;
    hit.add(key);
    removed += 1;
    return true;
  };
  const byId = <X extends { id: string }>(list: X[] | undefined) => (list ?? []).filter((x) => !match(x.id));
  let next: Partial<Editable>;
  if (req.section === "deals") next = { deals: byId(d.deals) };
  else if (req.section === "coupons") next = { coupons: byId(d.coupons) };
  else if (req.section === "whatsNew") next = { whatsNew: byId(d.whatsNew) };
  else
    next = {
      menu: (d.menu ?? []).map((c) => ({
        ...c,
        items: (c.items ?? []).filter((it) => !match(it.id && ids.has(it.id) ? it.id : menuItemKey(c.category, { name: it.name }))),
      })),
    };
  return { removed, missing: ids.size - hit.size, next };
}

interface RemovalState {
  /** Matching items still in the draft. */
  draftCount: number;
  /** Matching items in the saved record. */
  baseCount: number;
  /** Requested ids the saved record doesn't have. */
  missing: number;
  noun: readonly [string, string];
}

// ---- Change count for the Save bar --------------------------------------------------------

/** Per-item diff of two id-keyed lists; a pure reorder counts as one change. */
function listDiff(a: unknown, b: unknown, key: (x: Record<string, unknown>, i: number) => string): number {
  const toMap = (l: unknown) =>
    new Map((Array.isArray(l) ? (l as Record<string, unknown>[]) : []).map((x, i) => [key(x, i), JSON.stringify(x)] as const));
  const am = toMap(a);
  const bm = toMap(b);
  let n = 0;
  for (const [k, v] of am) if (bm.get(k) !== v) n += 1;
  for (const k of bm.keys()) if (!am.has(k)) n += 1;
  return n || 1;
}

function flatMenu(m: unknown): Record<string, unknown>[] {
  return (Array.isArray(m) ? (m as StoreMenuCategory[]) : []).flatMap((c, ci) => [
    { _key: `category ${ci}`, name: c.category },
    ...(c.items ?? []).map((it) => ({ _key: `item ${it.id ?? it.name}`, ...it })),
  ]);
}

/** Roughly "how many things will this save change": one per field, one per list item. */
function countChanges(base: Editable, next: Editable): number {
  const a = cleanRecord(base) as unknown as Record<string, unknown>;
  const b = cleanRecord(next) as unknown as Record<string, unknown>;
  let n = 0;
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (JSON.stringify(a[k]) === JSON.stringify(b[k])) continue;
    if (k === "deals" || k === "coupons" || k === "whatsNew") n += listDiff(a[k], b[k], (x, i) => String(x.id ?? `#${i}`));
    else if (k === "menu") n += listDiff(flatMenu(a[k]), flatMenu(b[k]), (x) => String(x._key));
    else n += 1;
  }
  return n;
}

const sameHex = (a: string | undefined, b: string | undefined) => (a ?? "").toUpperCase() === (b ?? "").toUpperCase();

// ---- Pinned request ----------------------------------------------------------------

function PinnedRequest({
  req,
  merchantId,
  getIdToken,
  onUseAsset,
  onApplyColors,
  colorsInDraft,
  removal,
  onApplyRemoval,
  onUnpin,
}: {
  req: ChangeRequest;
  merchantId: string;
  getIdToken: TokenGetter;
  onUseAsset: (field: "logoUrl" | "heroImageUrl", url: string) => void;
  onApplyColors: (c: { primary?: string; secondary?: string }) => void;
  colorsInDraft: boolean;
  removal: RemovalState | null;
  onApplyRemoval: () => void;
  onUnpin: () => void;
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const images = req.attachments.map((a) => ({ src: a.url, name: a.name }));

  async function use(attachmentId: string, field: "logoUrl" | "heroImageUrl") {
    setBusy(`${attachmentId}:${field}`);
    setErr(null);
    try {
      const { url } = await adminAssetFromAttachment(getIdToken, merchantId, req.id, attachmentId);
      onUseAsset(field, url);
    } catch (e) {
      setErr(friendlyError(e, "Couldn't copy that picture. Try again."));
    } finally {
      setBusy(null);
    }
  }

  const assetButton = (attachmentId: string, field: "logoUrl" | "heroImageUrl", label: string) => (
    <button
      type="button"
      onClick={() => void use(attachmentId, field)}
      disabled={busy !== null}
      className={`inline-flex items-center gap-1 rounded-full border border-white/[0.12] px-2.5 py-1 text-[11px] font-medium text-[#F4F4F4] transition hover:bg-white/[0.08] disabled:opacity-50 ${FOCUS_RING}`}
    >
      {busy === `${attachmentId}:${field}` && <Spinner className="h-3 w-3" />}
      {label}
    </button>
  );

  return (
    <Card className="flex flex-col gap-3 !p-4" >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: T.orange }}>
          Pinned request
        </span>
        <div className="flex items-center gap-1.5">
          <StatusPill status={req.status} />
          <button
            type="button"
            onClick={onUnpin}
            aria-label="Unpin request"
            className={`flex h-7 w-7 items-center justify-center rounded-full text-[#C4C7CC] transition hover:bg-white/[0.08] hover:text-white ${FOCUS_RING}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="text-sm font-medium" style={{ color: T.text }}>
        {(SECTION_META[req.section] ?? SECTION_META.other).label} · {ACTION_LABEL[req.action] ?? req.action}
      </p>
      {req.itemLabels.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {req.itemLabels.map((l, i) => (
            <li key={i} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: "rgba(255,255,255,0.06)", color: T.textSecondary }}>
              {l}
            </li>
          ))}
        </ul>
      )}
      {removal &&
        (removal.draftCount > 0 ? (
          <div className="flex flex-col gap-1.5">
            <Button onClick={onApplyRemoval} className="w-full">
              <Trash2 className="h-4 w-4" strokeWidth={2} />
              {removal.draftCount === 1
                ? `Remove this ${removal.noun[0]}`
                : `Remove these ${removal.draftCount} ${removal.noun[1]}`}
            </Button>
            <p className="text-[11px] leading-snug" style={{ color: T.textMuted }}>
              {removal.missing > 0 &&
                `${removal.missing} ${removal.missing === 1 ? `${removal.noun[0]} isn't` : `${removal.noun[1]} aren't`} on the profile anymore. `}
              Takes them out of the draft only. Nothing goes live until you save.
            </p>
          </div>
        ) : removal.baseCount > 0 ? (
          <p className="flex items-start gap-1.5 rounded-xl px-3 py-2 text-xs leading-snug" style={{ background: "rgba(16,185,129,0.1)", color: T.success }} role="status">
            <Check className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
            {req.status === "done"
              ? `Removed from the draft. Save to make it live.`
              : `Removed from the draft. Save and mark request done to make it live.`}
          </p>
        ) : (
          <p className="text-xs" style={{ color: T.textMuted }}>
            None of these are on the profile anymore.
          </p>
        ))}
      {req.message && (
        <p className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: T.textSecondary }}>
          {req.message}
        </p>
      )}
      {req.proposedColors && (req.proposedColors.primary || req.proposedColors.secondary) && (
        <div className="flex flex-wrap items-center gap-4">
          {req.proposedColors.primary && <Swatch label="Proposed primary" hex={req.proposedColors.primary} />}
          {req.proposedColors.secondary && <Swatch label="Proposed secondary" hex={req.proposedColors.secondary} />}
          {colorsInDraft ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: T.success }} role="status">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> In the draft
            </span>
          ) : (
            <Button onClick={() => onApplyColors(req.proposedColors!)} className="!px-4 !py-2 !text-xs">
              Use these colors
            </Button>
          )}
        </div>
      )}
      {req.attachments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {req.attachments.map((a, i) => (
            <li key={a.id} className="flex items-center gap-2.5">
              <Thumb src={a.url} name={a.name} onClick={() => setLightbox(i)} size={48} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-xs" style={{ color: T.textMuted }}>
                  {a.name}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {assetButton(a.id, "logoUrl", "Use as logo")}
                  {assetButton(a.id, "heroImageUrl", "Use as banner")}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {err && <p className="text-xs" style={{ color: "#FCA5A5" }}>{err}</p>}
      <p className="flex flex-wrap items-center gap-x-2 text-xs" style={{ color: T.textMuted }}>
        <a href={`mailto:${req.requesterEmail}`} className="inline-flex items-center gap-1 rounded underline-offset-2 hover:underline" style={{ color: T.textSecondary }}>
          <Mail className="h-3 w-3" />
          {req.requesterEmail}
        </a>
        <span>· {formatDateTime(req.createdAt)}</span>
      </p>
      <Lightbox
        images={images}
        index={lightbox}
        onIndex={setLightbox}
        onClose={() => setLightbox(null)}
        actions={(_img, i) => {
          const a = req.attachments[i];
          return a ? (
            <>
              {assetButton(a.id, "logoUrl", "Use as logo")}
              {assetButton(a.id, "heroImageUrl", "Use as banner")}
            </>
          ) : null;
        }}
      />
    </Card>
  );
}

// ---- Editor -------------------------------------------------------------------------

export function Editor({
  merchantId,
  requestId,
  getIdToken,
  onBack,
  onUnpin,
  onDirtyChange,
  onSaved,
}: {
  merchantId: string;
  requestId?: string;
  getIdToken: TokenGetter;
  onBack: () => void;
  onUnpin: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onSaved: () => void;
}) {
  const [loaded, setLoaded] = useState<AdminMerchantResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Editable | null>(null);
  const [account, setAccount] = useState<AccountDraft>({ dashboardEmails: [], rdhMerchantId: "" });
  const [tab, setTab] = useState<EditorTab>("brand");
  const [saving, setSaving] = useState<null | "save" | "done">(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pinned, setPinned] = useState<ChangeRequest | null>(null);
  const [historyAll, setHistoryAll] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setConflict(false);
    try {
      const res = await adminGetMerchant(getIdToken, merchantId);
      setLoaded(res);
      setDraft(toEditable(res.record));
      setAccount(accountFrom(res));
    } catch (e) {
      setLoadError(friendlyError(e, "Couldn't load this merchant. Try again."));
    }
  }, [getIdToken, merchantId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Pinned request: fetched by merchant, then matched by id, so a reload of
  // the page (URL carries ?request=) still finds it.
  useEffect(() => {
    let cancelled = false;
    if (!requestId) {
      setPinned(null);
      return;
    }
    (async () => {
      try {
        const res = await adminListRequests(getIdToken, { merchantId });
        const found = res.requests.find((r) => r.id === requestId) ?? null;
        if (!cancelled) {
          setPinned(found);
          if (found) setTab(TAB_FOR_SECTION[found.section] ?? "brand");
        }
      } catch {
        if (!cancelled) setPinned(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId, merchantId, getIdToken]);

  const baseline = useMemo(() => (loaded ? JSON.stringify(cleanRecord(toEditable(loaded.record))) : ""), [loaded]);
  const baseAccount = useMemo(() => (loaded ? JSON.stringify(accountFrom(loaded)) : ""), [loaded]);
  const recordDirty = !!draft && JSON.stringify(cleanRecord(draft)) !== baseline;
  const accountDirty = !!loaded && JSON.stringify(account) !== baseAccount;
  const dirty = recordDirty || accountDirty;

  const changeCount = useMemo(
    () => (loaded && draft && recordDirty ? countChanges(toEditable(loaded.record), draft) : 0) + (accountDirty ? 1 : 0),
    [loaded, draft, recordDirty, accountDirty]
  );

  const removal = useMemo<RemovalState | null>(() => {
    if (!pinned || !draft || !loaded) return null;
    const noun = REMOVE_NOUN[pinned.section];
    const inDraft = planRemoval(draft, pinned);
    const inBase = planRemoval(toEditable(loaded.record), pinned);
    if (!noun || !inDraft || !inBase) return null;
    return { draftCount: inDraft.removed, baseCount: inBase.removed, missing: inBase.missing, noun };
  }, [pinned, draft, loaded]);

  // The Save bar is sticky, so mid-scroll it sits over the form. Scroll
  // padding keeps focused / scrolled-to fields clear of it.
  const barRef = useRef<HTMLDivElement>(null);
  const ready = !!loaded && !!draft;
  useEffect(() => {
    const el = barRef.current;
    if (!ready || !el) return;
    const root = document.documentElement;
    const prev = root.style.scrollPaddingBottom;
    const apply = () => {
      const bottom = parseFloat(getComputedStyle(el).bottom) || 0;
      root.style.scrollPaddingBottom = `${el.offsetHeight + bottom + 16}px`;
    };
    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", apply);
      root.style.scrollPaddingBottom = prev;
    };
  }, [ready]);

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (tab === "json" && draft) {
      setJsonText(JSON.stringify(cleanRecord(draft), null, 2));
      setJsonError(null);
    }
    // Regenerate only when the tab opens; edits below apply on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const patch = useCallback((p: Partial<Editable>) => setDraft((d) => (d ? { ...d, ...p } : d)), []);

  async function save(markDone: boolean) {
    if (!draft || !loaded) return;
    const problems = validate(draft);
    setIssues(problems);
    if (problems.length) return;
    setSaving(markDone ? "done" : "save");
    setSaveError(null);
    setConflict(false);
    const rdh = account.rdhMerchantId.trim();
    const payload: AdminMerchantUpdate = {
      record: { ...cleanRecord(draft), id: merchantId },
      expectedVersion: loaded.record.version,
      ...(accountDirty || loaded.account
        ? { account: { dashboardEmails: account.dashboardEmails, ...(rdh ? { rdhMerchantId: rdh } : {}) } }
        : {}),
      ...(pinned ? { requestId: pinned.id, ...(markDone ? { markRequestDone: true } : {}) } : {}),
    };
    try {
      const res = await adminSaveMerchant(getIdToken, merchantId, payload);
      setSavedAt(new Date().toISOString());
      if (markDone && pinned) setPinned({ ...pinned, status: "done", appliedHistoryId: res.historyId });
      // Pull the fresh record + history (the PUT response has no history).
      try {
        const fresh = await adminGetMerchant(getIdToken, merchantId);
        setLoaded(fresh);
        setDraft(toEditable(fresh.record));
        setAccount(accountFrom(fresh));
      } catch {
        setLoaded({ ...loaded, record: res.record, account: loaded.account });
        setDraft(toEditable(res.record));
      }
      onSaved();
    } catch (e) {
      const err = toApiError(e);
      if (err.status === 409) setConflict(true);
      else setSaveError(friendlyError(err, "Couldn't save. Try again."));
    } finally {
      setSaving(null);
    }
  }

  function discard() {
    if (!loaded) return;
    setDraft(toEditable(loaded.record));
    setAccount(accountFrom(loaded));
    setIssues([]);
    setSaveError(null);
  }

  function applyJson() {
    try {
      const parsed = JSON.parse(jsonText) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("The JSON must be one object.");
      const obj = { ...(parsed as Record<string, unknown>) };
      delete obj.version;
      delete obj.updatedAt;
      delete obj.updatedBy;
      if (typeof obj.name !== "string") throw new Error("The record needs a \"name\" string.");
      setDraft({ ...(obj as unknown as Editable), id: merchantId });
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "That isn't valid JSON.");
    }
  }

  if (loadError && !loaded) {
    return (
      <div className="flex flex-col items-start gap-3">
        <ErrorBanner message={loadError} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
          <Button variant="ghost" onClick={onBack}>
            All merchants
          </Button>
        </div>
      </div>
    );
  }
  if (!loaded || !draft) return <LoadingBlock label="Loading merchant…" />;

  const ctx = { merchantId, getIdToken };
  const history = [...loaded.history].sort((a, b) => b.at.localeCompare(a.at));
  const shownHistory = historyAll ? history : history.slice(0, 6);
  const menu = draft.menu ?? [];
  const canSave = dirty && saving === null;
  const proposed = pinned?.proposedColors;
  const colorsInDraft =
    !!proposed &&
    (!proposed.primary || sameHex(draft.brandColor, proposed.primary)) &&
    (!proposed.secondary || sameHex(draft.brandColorSecondary, proposed.secondary));

  /** Never saves: takes the request's items out of the draft and shows that tab. */
  function applyRemoval() {
    if (!pinned) return;
    const req = pinned;
    setDraft((d) => {
      const plan = d ? planRemoval(d, req) : null;
      return d && plan ? { ...d, ...plan.next } : d;
    });
    setTab(TAB_FOR_SECTION[req.section] ?? "brand");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onBack}
              className={`mb-1 inline-flex items-center gap-1 rounded-full py-0.5 pr-2 text-xs font-medium text-[#9AA1A8] transition hover:text-white ${FOCUS_RING}`}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> All merchants
            </button>
            <h2 className="truncate font-barlow text-xl font-medium" style={{ color: T.text }}>
              {draft.name || merchantId}
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: T.textMuted }}>
              <span className="font-mono">{merchantId}</span> · version {loaded.record.version}
              {loaded.record.updatedAt && ` · updated ${relativeTime(loaded.record.updatedAt)}`}
              {loaded.record.updatedBy && ` by ${loaded.record.updatedBy}`}
            </p>
          </div>
        </div>

        {conflict && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <ErrorBanner message="Someone else saved first. Reload to see their changes." />
            </div>
            <Button variant="outline" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" /> Reload
            </Button>
          </div>
        )}

        <Tabs label="Editor sections" tabs={TABS} value={tab} onChange={setTab} />

        <Card className="flex flex-col gap-4">
          {tab === "brand" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Name" required value={draft.name} onChange={(v) => patch({ name: v ?? "" })} />
              <TextField label="Category" value={draft.category} onChange={(v) => patch({ category: v })} placeholder="Dispensary" />
              <TextField label="Short blurb" multiline rows={2} value={draft.blurb} onChange={(v) => patch({ blurb: v })} className="sm:col-span-2" />
              <div className="sm:col-span-2">
                <ImageUrlField label="Logo" value={draft.logoUrl} onChange={(v) => patch({ logoUrl: v })} hint="Square works best." {...ctx} />
              </div>
              <div className="sm:col-span-2">
                <ImageUrlField label="Banner" value={draft.heroImageUrl} onChange={(v) => patch({ heroImageUrl: v })} hint="Wide, about 3 to 1." {...ctx} />
              </div>
              <ColorField label="Primary color" value={draft.brandColor} onChange={(v) => patch({ brandColor: v })} onClear={() => patch({ brandColor: undefined })} />
              <ColorField
                label="Secondary color"
                value={draft.brandColorSecondary}
                onChange={(v) => patch({ brandColorSecondary: v })}
                onClear={() => patch({ brandColorSecondary: undefined })}
                fallback={draft.brandColor ?? "#FB8500"}
              />
            </div>
          )}

          {tab === "about" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Description" multiline rows={6} value={draft.description} onChange={(v) => patch({ description: v })} className="sm:col-span-2" />
              <TextField label="Website" value={draft.website} onChange={(v) => patch({ website: v })} placeholder="https://" />
              <TextField label="Phone" type="tel" value={draft.phone} onChange={(v) => patch({ phone: v })} />
              <TextField label="Address" multiline rows={2} value={draft.address} onChange={(v) => patch({ address: v })} className="sm:col-span-2" />
              <TextField label="Menu link" value={draft.menuUrl} onChange={(v) => patch({ menuUrl: v })} placeholder="https://" className="sm:col-span-2" />
            </div>
          )}

          {tab === "hours" && <HoursEditor hours={draft.hours} onChange={(h) => patch({ hours: h })} />}

          {tab === "menu" && (
            <ListEditor<StoreMenuCategory>
              items={menu}
              onChange={(next) => patch({ menu: next })}
              newItem={() => ({ category: "", items: [] })}
              itemNoun="category"
              addLabel="Add category"
              emptyLabel="No menu yet."
              summary={(c) => <SummaryLine title={c.category} sub={`${c.items?.length ?? 0} item${c.items?.length === 1 ? "" : "s"}`} />}
              render={(c, update) => (
                <div className="flex flex-col gap-4">
                  <TextField label="Category name" required value={c.category} onChange={(v) => update({ category: v ?? "" })} />
                  <ListEditor<StoreMenuItem>
                    items={c.items ?? []}
                    onChange={(items) => update({ items })}
                    newItem={() => ({ id: newId("item"), name: "", price: 0 })}
                    itemNoun="item"
                    addLabel="Add item"
                    emptyLabel="No items in this category."
                    summary={(it) => <SummaryLine title={it.name} sub={formatPrice(it.price)} />}
                    render={(it, upd) => <MenuItemForm item={it} update={upd} ctx={ctx} />}
                  />
                </div>
              )}
            />
          )}

          {tab === "deals" && (
            <ListEditor<StoreDeal>
              items={draft.deals ?? []}
              onChange={(next) => patch({ deals: next })}
              newItem={() => ({ id: newId("deal"), title: "" })}
              itemNoun="deal"
              addLabel="Add deal"
              emptyLabel="No deals yet."
              summary={(d) => <SummaryLine title={d.title} sub={d.schedule} />}
              render={(d, update) => <DealForm deal={d} update={update} ctx={ctx} />}
            />
          )}

          {tab === "coupons" && (
            <ListEditor<Coupon>
              items={draft.coupons ?? []}
              onChange={(next) => patch({ coupons: next })}
              newItem={() => ({ id: newId("coupon"), storeId: merchantId, kind: "percent", title: "" })}
              itemNoun="coupon"
              addLabel="Add coupon"
              emptyLabel="No coupons yet."
              summary={(c) => (
                <SummaryLine
                  title={c.title}
                  sub={[[c.valueLabel, c.valueSuffix].filter(Boolean).join(" "), c.expiresAt ? `expires ${formatDateTime(c.expiresAt)}` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                />
              )}
              render={(c, update) => <CouponForm coupon={c} update={update} />}
            />
          )}

          {tab === "whatsNew" && (
            <ListEditor<StoreUpdate>
              items={draft.whatsNew ?? []}
              onChange={(next) => patch({ whatsNew: next })}
              newItem={() => ({ id: newId("update"), kind: "announcement", title: "", postedOn: todayYmd() })}
              itemNoun="update"
              addLabel="Add update"
              emptyLabel="No updates yet."
              summary={(u) => (
                <SummaryLine title={u.title} sub={[u.kind === "new-product" ? "New product" : "Announcement", formatDay(u.postedOn)].filter(Boolean).join(" · ")} />
              )}
              render={(u, update) => <UpdateForm item={u} update={update} />}
            />
          )}

          {tab === "loyalty" &&
            (draft.loyaltyProgram ? (
              <div className="flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Program name"
                    value={draft.loyaltyProgram.programName}
                    onChange={(v) => patch({ loyaltyProgram: { ...draft.loyaltyProgram, programName: v } })}
                    className="sm:col-span-2"
                  />
                  <NumberField
                    label="Next reward at"
                    value={draft.loyaltyProgram.nextRewardAt}
                    onChange={(v) => patch({ loyaltyProgram: { ...draft.loyaltyProgram, nextRewardAt: v } })}
                    min={0}
                    step="1"
                    suffix="points"
                  />
                  <TextField
                    label="Reward"
                    value={draft.loyaltyProgram.nextRewardLabel}
                    onChange={(v) => patch({ loyaltyProgram: { ...draft.loyaltyProgram, nextRewardLabel: v } })}
                    placeholder="Free drink"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => patch({ loyaltyProgram: undefined })}
                  className={`self-start rounded-full px-3 py-1.5 text-sm font-medium text-[#C4C7CC] transition hover:bg-[#EF4444]/[0.12] hover:text-[#FCA5A5] ${FOCUS_RING}`}
                >
                  Remove loyalty program
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm" style={{ color: T.textMuted }}>
                  No loyalty program.
                </p>
                <AddButton onClick={() => patch({ loyaltyProgram: { programName: "" } })}>Add loyalty program</AddButton>
              </div>
            ))}

          {tab === "account" && (
            <div className="flex flex-col gap-4">
              <p className="text-xs" style={{ color: T.textMuted }}>
                Private. Stored in merchantAccounts, never in the public record the app reads.
              </p>
              <EmailChips value={account.dashboardEmails} onChange={(v) => setAccount((a) => ({ ...a, dashboardEmails: v }))} />
              <div className="max-w-sm">
                <TextField
                  label="RDH merchant id"
                  value={account.rdhMerchantId}
                  onChange={(v) => setAccount((a) => ({ ...a, rdhMerchantId: v ?? "" }))}
                  mono
                  hint="The merchant_id on the RDH backend, when linked."
                />
              </div>
            </div>
          )}

          {tab === "json" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs" style={{ color: T.textMuted }}>
                The whole public record. Apply copies it into the editor; nothing is saved until you press Save. id, version and updatedAt are managed by the server.
              </p>
              <Textarea
                aria-label="Record JSON"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                spellCheck={false}
                rows={22}
                className="font-mono text-xs"
              />
              {jsonError && <ErrorBanner message={jsonError} />}
              <div className="flex gap-2">
                <Button variant="outline" onClick={applyJson}>
                  Apply JSON
                </Button>
                <Button variant="ghost" onClick={() => setJsonText(JSON.stringify(cleanRecord(draft), null, 2))}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </Card>

        {issues.length > 0 && (
          <div className="rounded-2xl border px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", color: "#FCA5A5" }} role="alert">
            <p className="font-medium">Fix these before saving:</p>
            <ul className="mt-1 list-disc pl-5">
              {issues.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        )}
        {saveError && <ErrorBanner message={saveError} />}

        <div ref={barRef} className="sticky bottom-20 z-10 md:bottom-4">
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            style={{ background: "rgba(20,26,36,0.94)", borderColor: T.glassBorder }}
          >
            <span className="flex items-center gap-2 text-sm" style={{ color: dirty ? T.text : T.textMuted }} role="status">
              <span className="h-2 w-2 rounded-full" style={{ background: dirty ? T.orange : savedAt ? T.success : "rgba(255,255,255,0.2)" }} aria-hidden />
              {dirty
                ? changeCount > 0
                  ? `${changeCount} unsaved change${changeCount === 1 ? "" : "s"}`
                  : "Unsaved changes"
                : savedAt
                  ? `Saved ${relativeTime(savedAt)}`
                  : "No changes"}
            </span>
            <div className="flex flex-wrap gap-2">
              {dirty && (
                <Button variant="ghost" onClick={discard} disabled={saving !== null}>
                  Discard
                </Button>
              )}
              {pinned && pinned.status !== "done" && (
                <Button variant="outline" onClick={() => void save(true)} disabled={!canSave}>
                  {saving === "done" && <Spinner className="h-4 w-4" />}
                  Save and mark request done
                </Button>
              )}
              <Button onClick={() => void save(false)} disabled={!canSave}>
                {saving === "save" && <Spinner className="h-4 w-4 !text-white" />}
                {saving === "save" ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-8 xl:max-h-[calc(100vh-4rem)] xl:self-start xl:overflow-y-auto xl:pb-1">
        <Card className="!p-4">
          <BrandHeaderPreview
            compact
            caption="Live preview"
            name={draft.name}
            logoUrl={draft.logoUrl}
            brandColor={draft.brandColor}
            brandColorSecondary={draft.brandColorSecondary}
            category={draft.category}
            blurb={draft.blurb}
          />
        </Card>

        {pinned && (
          <PinnedRequest
            req={pinned}
            merchantId={merchantId}
            getIdToken={getIdToken}
            onUseAsset={(field, url) => {
              patch({ [field]: url } as Partial<Editable>);
              setTab("brand");
            }}
            onApplyColors={(c) => {
              patch({
                ...(c.primary ? { brandColor: c.primary } : {}),
                ...(c.secondary ? { brandColorSecondary: c.secondary } : {}),
              });
              setTab("brand");
            }}
            colorsInDraft={colorsInDraft}
            removal={removal}
            onApplyRemoval={applyRemoval}
            onUnpin={onUnpin}
          />
        )}

        <Card className="flex flex-col gap-3 !p-4">
          <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
            <History className="h-3.5 w-3.5" /> Recent history
          </span>
          {history.length === 0 ? (
            <p className="text-sm" style={{ color: T.textMuted }}>
              No edits yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {shownHistory.map((h) => (
                <li key={h.id} className="flex flex-col gap-1.5 border-b py-2.5 first:pt-0 last:border-0 last:pb-0" style={{ borderColor: T.divider }}>
                  <p className="text-xs" style={{ color: T.textSecondary }}>
                    <span style={{ color: T.text }}>{h.by}</span>
                    <span title={formatDateTime(h.at)}> · {relativeTime(h.at)}</span>
                    {h.requestId && <span style={{ color: T.orange }}> · from a request</span>}
                  </p>
                  {h.changedFields.length > 0 && (
                    <ul className="flex flex-wrap gap-1">
                      {h.changedFields.map((f) => (
                        <li key={f} className="rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: "rgba(255,255,255,0.06)", color: T.textSecondary }}>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
          {history.length > 6 && (
            <button
              type="button"
              onClick={() => setHistoryAll((v) => !v)}
              className={`self-start rounded-full px-2 py-1 text-xs font-medium text-[#C4C7CC] transition hover:bg-white/[0.06] hover:text-white ${FOCUS_RING}`}
            >
              {historyAll ? "Show less" : `Show all ${history.length}`}
            </button>
          )}
        </Card>
      </aside>
    </div>
  );
}
