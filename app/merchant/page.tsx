"use client";

// app/merchant/page.tsx
//
// Transactions list — the merchant dashboard's home route (PRD §5.2).
// Reverse-chronological, durable past the 30-day raw-blob TTL (the whole
// point of this dashboard existing, per the PRD's problem statement).
//
// Search is applied client-side over whatever page(s) are currently loaded
// (amount / receipt # / item text) — matches plan.md's pilot-scale call
// ("partition query + Lambda filter, no GSI"): the real API doesn't index
// full-text search either, so this UI shell doesn't pretend to have
// server-side search beyond the date-range params it does send.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, ChevronRight, RefreshCw } from "lucide-react";
import { useMerchantAuth } from "./AuthContext";
import {
  listTransactions,
  listDevices,
  exportCsv,
  type MerchantTransactionSummary,
  type MerchantDevice,
} from "@/lib/merchantApi";
import { Card, Button, Input, PaymentChip, ConfidencePill, ParseFailedPill, LoadingBlock, EmptyState, ErrorBanner } from "./ui/primitives";
import { T } from "./ui/tokens";

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function formatMoney(n: number | null): string {
  return n == null ? "—" : `$${n.toFixed(2)}`;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { getIdToken } = useMerchantAuth();

  const [transactions, setTransactions] = useState<MerchantTransactionSummary[]>([]);
  const [devices, setDevices] = useState<MerchantDevice[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        });
        setTransactions((prev) => (reset ? page.transactions : [...prev, ...page.transactions]));
        setCursor(page.nextCursor);
      } catch {
        setError("Couldn't load transactions. Check your connection and try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [from, to, getIdToken]
  );

  useEffect(() => {
    load(true);
    // Device labels for the "device" column — only meaningful once, not per filter change.
    getIdToken().then((token) => {
      if (token) listDevices(token).then(setDevices).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const deviceLabel = useMemo(() => {
    const map = new Map(devices.map((d) => [d.deviceId, d.label]));
    return (deviceId: string) => map.get(deviceId) ?? deviceId;
  }, [devices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter((t) => {
      const haystacks = [
        t.total != null ? t.total.toFixed(2) : "",
        t.receiptNumber ?? "",
        t.itemsPreview,
        t.merchantName ?? "",
      ];
      return haystacks.some((h) => h.toLowerCase().includes(q));
    });
  }, [transactions, search]);

  async function handleExport() {
    const token = await getIdToken();
    if (!token) return;
    setExporting(true);
    try {
      await exportCsv(token, { from: from || undefined, to: to || undefined });
    } finally {
      setExporting(false);
    }
  }

  const multiDevice = devices.length > 1;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
            Transactions
          </h1>
          <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
            Every upload from your RDH device{multiDevice ? "s" : ""} — kept forever, past the 30-day cache.
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search amount, receipt #, or item…"
            className="w-full pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            From
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
            To
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          {(from || to) && (
            <button
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="text-xs font-medium underline underline-offset-2"
              style={{ color: T.textSecondary }}
            >
              Clear
            </button>
          )}
        </div>
      </Card>

      {error && <ErrorBanner message={error} />}

      {loading ? (
        <LoadingBlock label="Loading transactions…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={search || from || to ? "No matching transactions" : "No transactions yet"}
          message={
            search || from || to
              ? "Try a different search term or widen the date range."
              : "Once your RDH device uploads a receipt, it'll show up here within about a minute."
          }
        >
          {(search || from || to) && (
            <button
              onClick={() => {
                setSearch("");
                setFrom("");
                setTo("");
              }}
              className="mt-2 text-sm font-medium underline underline-offset-2"
              style={{ color: T.orange }}
            >
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
                {filtered.map((t) => {
                  const { date, time } = formatDateTime(t.uploadedAt);
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
                          {t.parseStatus === "failed" ? <ParseFailedPill /> : <ConfidencePill confidence={t.confidence} />}
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

      {!loading && cursor && !search && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => load(false, cursor)} disabled={loadingMore}>
            {loadingMore ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2} /> Loading…
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
