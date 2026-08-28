"use client";

// app/merchant/page.tsx
//
// Transactions list — the merchant dashboard's home route (PRD §5.2).
// Reverse-chronological, durable past the 30-day raw-blob TTL (the whole
// point of this dashboard existing, per the PRD's problem statement).
//
// Filtering is now REAL server-side filtering (q/minAmount/maxAmount/hour/
// dow/device), matching Papex_RDH's GET /merchant/transactions — see
// lib/merchantApi.ts's ListTransactionsParams and Papex_RDH/lambdas/
// merchant-api/handler.js's parseTransactionFilter/matchesTransactionFilter.
// This replaces the earlier client-side-only search over whatever page(s)
// happened to be loaded.
//
// URL query params are the source of truth for every filter (via
// useSearchParams/router.replace) — NOT component state alone. That is what
// makes a drill-through link from Insights work (?hour=8&from=...&to=...),
// the back button behave, and a filtered view shareable/bookmarkable. The
// free-text/amount inputs keep a local "draft" copy for responsive typing,
// debounced ~300ms into the URL (see useDebouncedFilterSync below); every
// other control (device select, pill clears, "clear all") writes the URL
// immediately.
//
// `hour`/`dow` are deliberately NOT exposed as their own dropdowns on this
// page — they're reached via drill-through from Insights (Part 4) or a
// shared link, and render here only as an active-filter pill with its own
// clear. Building a redundant "hour of day" selector here would just
// duplicate what the Insights charts already are.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Download, ChevronRight, RefreshCw } from "lucide-react";
import { useMerchantAuth } from "./AuthContext";
import {
  listTransactions,
  listTransactionsCount,
  listDevices,
  exportCsv,
  type MerchantTransactionSummary,
  type MerchantDevice,
} from "@/lib/merchantApi";
import { Card, Button, Input, Select, FilterPill, PaymentChip, ConfidencePill, ParseFailedPill, ImageOnlyPill, LoadingBlock, EmptyState, ErrorBanner } from "./ui/primitives";
import { T } from "./ui/tokens";
import { DOW_LABELS, hourLabelLong, formatMerchantDateTime, formatMoney, formatCount } from "./ui/format";

// ---- URL <-> filter-object plumbing --------------------------------------------

interface ActiveFilters {
  q?: string;
  minAmount?: number;
  maxAmount?: number;
  hour?: number;
  dow?: number;
  device?: string;
}

function readFilters(sp: URLSearchParams): ActiveFilters {
  const filters: ActiveFilters = {};
  const q = sp.get("q");
  if (q) filters.q = q;
  for (const key of ["minAmount", "maxAmount", "hour", "dow"] as const) {
    const raw = sp.get(key);
    if (raw != null && raw !== "" && Number.isFinite(Number(raw))) filters[key] = Number(raw);
  }
  const device = sp.get("device");
  if (device) filters.device = device;
  return filters;
}

function TransactionsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getIdToken } = useMerchantAuth();

  const [transactions, setTransactions] = useState<MerchantTransactionSummary[]>([]);
  const [devices, setDevices] = useState<MerchantDevice[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  // matchedCount is fetched SEPARATELY from the list (listTransactionsCount,
  // ?countOnly=1) and arrives later — see the `loadCount` effect below.
  // `null` here means "not known yet" (still loading, or the last attempt
  // failed), never "zero matches"; `countLoading` distinguishes the two so
  // the UI can show a placeholder instead of a wrong/missing number.
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [pageCapped, setPageCapped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against an in-flight count request for an OLDER filter set
  // resolving after a newer one and clobbering it — "never render a stale
  // count against a new filter set." Only the response whose id still
  // matches the latest-fired request gets applied.
  const countRequestId = useRef(0);

  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const hasActiveFilters = Boolean(from || to || filters.q || filters.minAmount != null || filters.maxAmount != null || filters.hour != null || filters.dow != null || filters.device);

  // Writes `patch` into the URL's query string (deleting a key when its
  // value is undefined/empty), via router.replace — NOT push — so typing
  // into a filter or clicking a pill doesn't spam browser history. Real
  // navigations (a drill-through <Link> from Insights, or the back button
  // leaving this page) still behave normally; replace only affects
  // in-place filter edits.
  const updateSearchParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === "") params.delete(key);
        else params.set(key, value);
      }
      const next = params.toString();
      if (next === searchParams.toString()) return;
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  // ---- Debounced free-text / amount inputs ----------------------------------
  //
  // Local "draft" state keeps typing responsive; a 300ms-idle timer pushes
  // the draft into the URL (which is what actually triggers a fetch, via the
  // `load` effect below keying off searchParams). Draft re-syncs FROM the
  // URL whenever it changes from elsewhere (a pill clear, "clear all", a
  // drill-through navigation, or the browser back/forward button).
  const [draftQ, setDraftQ] = useState(filters.q ?? "");
  const [draftMin, setDraftMin] = useState(filters.minAmount != null ? String(filters.minAmount) : "");
  const [draftMax, setDraftMax] = useState(filters.maxAmount != null ? String(filters.maxAmount) : "");

  useEffect(() => {
    setDraftQ(filters.q ?? "");
    setDraftMin(filters.minAmount != null ? String(filters.minAmount) : "");
    setDraftMax(filters.maxAmount != null ? String(filters.maxAmount) : "");
  }, [filters.q, filters.minAmount, filters.maxAmount]);

  useEffect(() => {
    const t = setTimeout(() => {
      updateSearchParams({ q: draftQ.trim() || undefined, minAmount: draftMin.trim() || undefined, maxAmount: draftMax.trim() || undefined });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQ, draftMin, draftMax]);

  // ---- Data loading -----------------------------------------------------------

  const load = useCallback(
    async (reset: boolean, cursorOverride?: string | null) => {
      const token = await getIdToken();
      if (!token) return;
      setError(null);
      if (reset) setLoading(true);
      else setLoadingMore(true);
      try {
        const page = await listTransactions(token, {
          from: from || undefined,
          to: to || undefined,
          cursor: reset ? undefined : cursorOverride ?? undefined,
          ...filters,
        });
        setTransactions((prev) => (reset ? page.transactions : [...prev, ...page.transactions]));
        setCursor(page.nextCursor);
        setPageCapped(page.pageCapped);
      } catch {
        setError("Couldn't load transactions. Check your connection and try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // filters is a freshly-built object every render — compare its
    // serialized form so this callback (and the effect below) only changes
    // identity when the ACTUAL filter values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to, JSON.stringify(filters), getIdToken]
  );

  // Independent of `load` above: fires its own request (?countOnly=1) so
  // the list never waits on it. Clears the OLD count immediately (before
  // the new request even starts) so a slow count from a previous filter
  // set can never linger on screen looking like it describes the current
  // one; the request-id guard then makes sure only the still-current
  // request's answer gets applied when it lands.
  const loadCount = useCallback(async () => {
    const token = await getIdToken();
    if (!token) return;
    const id = ++countRequestId.current;
    setMatchedCount(null);
    setCountLoading(true);
    try {
      const count = await listTransactionsCount(token, { from: from || undefined, to: to || undefined, ...filters });
      if (countRequestId.current === id) setMatchedCount(count);
    } catch {
      // Non-critical — the list itself already loaded fine. Leave
      // matchedCount null; the UI just omits the count rather than
      // showing a wrong one or an endless placeholder.
    } finally {
      if (countRequestId.current === id) setCountLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, JSON.stringify(filters), getIdToken]);

  useEffect(() => {
    load(true);
    loadCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, JSON.stringify(filters)]);

  useEffect(() => {
    // Device labels for the "device" column and the device filter dropdown
    // — only meaningful once, not per filter change.
    getIdToken().then((token) => {
      if (token) listDevices(token).then(setDevices).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deviceLabel = useMemo(() => {
    const map = new Map(devices.map((d) => [d.deviceId, d.label]));
    return (deviceId: string) => map.get(deviceId) ?? deviceId;
  }, [devices]);

  async function handleExport() {
    const token = await getIdToken();
    if (!token) return;
    setExporting(true);
    try {
      // Same filters as the on-screen list — exporting an unfiltered CSV
      // from a filtered view would be a trap.
      await exportCsv(token, { from: from || undefined, to: to || undefined, ...filters });
    } finally {
      setExporting(false);
    }
  }

  const multiDevice = devices.length > 1;

  const pills: { key: string; label: string; onClear: () => void }[] = [];
  if (filters.q) pills.push({ key: "q", label: `Search: "${filters.q}"`, onClear: () => updateSearchParams({ q: undefined }) });
  if (filters.minAmount != null) pills.push({ key: "minAmount", label: `Min ${formatMoney(filters.minAmount)}`, onClear: () => updateSearchParams({ minAmount: undefined }) });
  if (filters.maxAmount != null) pills.push({ key: "maxAmount", label: `Max ${formatMoney(filters.maxAmount)}`, onClear: () => updateSearchParams({ maxAmount: undefined }) });
  if (filters.hour != null) pills.push({ key: "hour", label: `Hour: ${hourLabelLong(filters.hour)}`, onClear: () => updateSearchParams({ hour: undefined }) });
  if (filters.dow != null) pills.push({ key: "dow", label: `Day: ${DOW_LABELS[filters.dow]}`, onClear: () => updateSearchParams({ dow: undefined }) });
  if (filters.device) pills.push({ key: "device", label: `Device: ${deviceLabel(filters.device)}`, onClear: () => updateSearchParams({ device: undefined }) });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
            Transactions
          </h1>
          <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
            Every upload from your RDH device{multiDevice ? "s" : ""} — kept forever, past the 30-day cache. Times shown are Pacific.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={exporting || loading}>
          <Download className="h-4 w-4" strokeWidth={2} />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      <Card className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.textMuted }} />
          <Input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="Search receipt #, item, card, or merchant…"
            className="w-full pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            Min $
            <Input type="number" inputMode="decimal" min={0} step="0.01" value={draftMin} onChange={(e) => setDraftMin(e.target.value)} className="w-20" />
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            Max $
            <Input type="number" inputMode="decimal" min={0} step="0.01" value={draftMax} onChange={(e) => setDraftMax(e.target.value)} className="w-20" />
          </label>
        </div>
        {multiDevice && (
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            Device
            <Select value={filters.device ?? ""} onChange={(e) => updateSearchParams({ device: e.target.value || undefined })}>
              <option value="">All devices</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </Select>
          </label>
        )}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            From
            <Input type="date" value={from} onChange={(e) => updateSearchParams({ from: e.target.value || undefined })} />
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            To
            <Input type="date" value={to} onChange={(e) => updateSearchParams({ to: e.target.value || undefined })} />
          </label>
          {(from || to) && (
            <button
              onClick={() => updateSearchParams({ from: undefined, to: undefined })}
              className="text-xs font-medium underline underline-offset-2"
              style={{ color: T.textSecondary }}
            >
              Clear
            </button>
          )}
        </div>
      </Card>

      {(pills.length > 0 || countLoading || matchedCount != null) && (
        <div className="flex flex-wrap items-center gap-2">
          {pills.map((p) => (
            <FilterPill key={p.key} label={p.label} onClear={p.onClear} />
          ))}
          {pills.length > 0 && (
            <button onClick={clearAllFilters} className="text-xs font-medium underline underline-offset-2" style={{ color: T.textSecondary }}>
              Clear all
            </button>
          )}
          {/* Fetched separately from the list (see loadCount) so the list
              never waits on it — this slot fills in a beat after the rows
              land. A subtle pulsing placeholder while in flight, never a
              spinner and never a stale number left over from a previous
              filter set (loadCount clears matchedCount the instant it
              starts a new request, before this render). */}
          <span className="ml-auto text-xs" style={{ color: T.textMuted }}>
            {matchedCount != null ? (
              `${formatCount(matchedCount)} matching transaction${matchedCount === 1 ? "" : "s"}`
            ) : countLoading ? (
              <span
                className="inline-block h-3 w-32 animate-pulse rounded-full align-middle"
                style={{ background: "rgba(255,255,255,0.08)" }}
                aria-hidden="true"
              />
            ) : null}
          </span>
        </div>
      )}

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingBlock label="Loading transactions…" />
      ) : transactions.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No matching transactions" : "No transactions yet"}
          message={
            hasActiveFilters
              ? "Try a different search term, widen the date range, or clear a filter."
              : "Once your RDH device uploads a receipt, it'll show up here within about a minute."
          }
        >
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="mt-2 text-sm font-medium underline underline-offset-2" style={{ color: T.orange }}>
              Clear filters
            </button>
          )}
        </EmptyState>
      ) : (
        <Card className="overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: T.divider }}>
                  {["Date", "Total", "Payment", "Receipt #", multiDevice ? "Device" : null, ""]
                    .filter((h): h is string => h !== null)
                    .map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => {
                  const { date, time } = formatMerchantDateTime(t.uploadedAt);
                  return (
                    <tr
                      key={t.sid}
                      onClick={() => router.push(`/merchant/tx/${t.sid}`)}
                      className="cursor-pointer border-b transition hover:bg-white/[0.03]"
                      style={{ borderColor: T.divider }}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div style={{ color: T.text }}>{date}</div>
                        <div className="text-xs" style={{ color: T.textMuted }}>
                          {time}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-medium whitespace-nowrap" style={{ color: T.text }}>
                        {formatMoney(t.total)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <PaymentChip method={t.paymentMethod} last4={t.cardLast4} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: T.textSecondary }}>
                        {t.receiptNumber ?? "—"}
                      </td>
                      {multiDevice && (
                        <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: T.textSecondary }}>
                          {deviceLabel(t.deviceId)}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Three-way, not "failed vs everything else": an
                              ok_raster row has confidence "low" only because
                              nothing was extracted from it yet, so falling
                              through to ConfidencePill would label a perfectly
                              good capture "Low confidence". */}
                          {t.parseStatus === "failed" ? (
                            <ParseFailedPill />
                          ) : t.parseStatus === "ok_raster" ? (
                            <ImageOnlyPill />
                          ) : (
                            <ConfidencePill confidence={t.confidence} />
                          )}
                          <ChevronRight className="h-4 w-4" style={{ color: T.textMuted }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!loading && cursor && (
        <div className="flex flex-col items-center gap-1.5">
          <Button variant="outline" onClick={() => load(false, cursor)} disabled={loadingMore}>
            {loadingMore ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2} /> Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
          {pageCapped && (
            <span className="text-xs" style={{ color: T.textMuted }}>
              Still searching a large date range — click Load more to keep going.
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  // useSearchParams requires a Suspense boundary (Next.js App Router) —
  // the fallback only ever flashes briefly since this whole route tree is
  // client-rendered behind the merchant auth gate anyway.
  return (
    <Suspense fallback={<LoadingBlock label="Loading transactions…" />}>
      <TransactionsPageInner />
    </Suspense>
  );
}
