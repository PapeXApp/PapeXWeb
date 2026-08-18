"use client";

// app/merchant/tx/[sid]/page.tsx
//
// Receipt detail (PRD §5.3). Reuses app/r/ui.tsx's receipt cards verbatim
// (GlassCard, ReceiptView -> MerchantHeaderCard/ItemsCard/TotalsCard/
// OriginalReceiptCollapsible) rather than re-implementing receipt rendering
// — that's the same component that renders the consumer-facing `/r` page,
// so a merchant clicking into a transaction sees byte-identical styling to
// what their customer saw at the counter.
//
// B5 fix: the merchant API does NOT hand this page a pre-built
// ReceiptSummary anymore (that meant duplicating app/r's parse+summarize
// logic server-side, and it drifted out of sync with the web types — see
// the adversarial review that found this). Instead this page fetches the
// same two things app/r's server component does — metadata + raw bytes —
// and runs the exact same client-side pipeline (parseEscPos ->
// summarizeReceipt) app/r/page.tsx runs server-side. `detail` (metadata:
// sid/uploadedAt/parseStatus/confidence/rawText/etc.) and the raw bytes are
// fetched in parallel; the two are independent failure domains, so a bytes
// fetch/parse failure never blocks the metadata from rendering — it just
// falls back to `detail.rawText`, same as when the backend's own parse
// failed (parseStatus === "failed").
//
// `hasStructure` comes back from summarizeReceipt()/computeHasStructure()
// on the freshly-parsed bytes now, not from the API — a failed parse means
// "trust nothing but the raw text," which parseStatus === "failed" (backend
// couldn't parse the stored blob at index time) forces regardless of
// whether client-side parsing of the bytes would happen to find structure.

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMerchantAuth } from "../../AuthContext";
import { getTransaction, getReceiptBytes, type MerchantTransactionDetail } from "@/lib/merchantApi";
import { parseEscPos } from "@/lib/escpos";
import { summarizeReceipt, hasStructure as computeHasStructure, type ReceiptSummary } from "@/lib/receiptSummary";
import { GlassCard, ReceiptView } from "@/app/r/ui";
import { LoadingBlock, EmptyState, ErrorBanner, ApproximateCaveat, PaymentChip, ConfidencePill, ParseFailedPill, ImageOnlyPill } from "../../ui/primitives";
import { T } from "../../ui/tokens";

interface ParsedReceipt {
  summary: ReceiptSummary;
  hasStructure: boolean;
}

function formatFullDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TransactionDetailPage() {
  const params = useParams<{ sid: string }>();
  const sid = params.sid;
  const router = useRouter();
  const { getIdToken } = useMerchantAuth();

  const [detail, setDetail] = useState<MerchantTransactionDetail | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState<string | null>(null);
  // null = no parsed receipt available (bytes fetch/parse failed, or backend
  // parseStatus === "failed") -> render detail.rawText instead.
  const [receipt, setReceipt] = useState<ParsedReceipt | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setDetail(undefined);
      setReceipt(null);
      const token = await getIdToken();
      if (!token) return;

      // Independent failure domains: metadata (detail) and raw bytes are
      // fetched in parallel, and a bytes failure must never block metadata
      // from rendering — it just means falling back to rawText below.
      const [detailResult, bytesResult] = await Promise.allSettled([
        getTransaction(token, sid),
        getReceiptBytes(token, sid),
      ]);
      if (cancelled) return;

      if (detailResult.status === "rejected") {
        setError("Couldn't load this receipt. Try again.");
        return;
      }
      const d = detailResult.value;
      setDetail(d);
      // "failed" has no parse to attempt. "ok_raster" is a 1bpp bitmap, and
      // feeding Star raster bytes to the ESC/POS text state machine desyncs
      // it immediately — it would either yield nothing or invent mojibake
      // lines. Either way the page renders from `detail` alone below.
      if (!d || d.parseStatus === "failed" || d.parseStatus === "ok_raster") return;

      if (bytesResult.status === "fulfilled") {
        try {
          const parsed = parseEscPos(bytesResult.value);
          const summary = summarizeReceipt(parsed.lines);
          if (!cancelled) setReceipt({ summary, hasStructure: computeHasStructure(summary) });
        } catch {
          // Parsing the bytes threw — fall back to rawText, same as a fetch failure.
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [sid, getIdToken]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <button
        onClick={() => router.push("/merchant")}
        className="flex w-fit items-center gap-1.5 text-sm font-medium transition hover:opacity-80"
        style={{ color: T.textSecondary }}
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to transactions
      </button>

      {error && <ErrorBanner message={error} />}

      {error ? null : detail === undefined ? (
        <LoadingBlock label="Loading receipt…" />
      ) : detail === null ? (
        <EmptyState title="Receipt not found" message="This transaction doesn't exist or isn't visible to your account." />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="font-barlow text-xl font-medium" style={{ color: T.text }}>
                Receipt {detail.receiptNumber && detail.receiptNumber !== "—" ? `#${detail.receiptNumber}` : ""}
              </h1>
              <p className="text-sm" style={{ color: T.textSecondary }}>
                {formatFullDateTime(detail.uploadedAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {detail.parseStatus === "failed" ? (
                <ParseFailedPill />
              ) : detail.parseStatus === "ok_raster" ? (
                <ImageOnlyPill />
              ) : (
                <ConfidencePill confidence={detail.confidence} />
              )}
              <PaymentChip method={detail.paymentMethod} last4={detail.cardLast4} />
            </div>
          </div>

          {detail.parseStatus === "failed" ? (
            <>
              <ErrorBanner message="This receipt couldn't be parsed. Showing the raw captured text below." />
              <GlassCard>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs" style={{ color: T.textSecondary }}>
                  {detail.rawText}
                </pre>
              </GlassCard>
            </>
          ) : detail.parseStatus === "ok_raster" ? (
            // The receipt is a bitmap and no text was extracted, so there is
            // nothing to feed ReceiptView and rawText is empty — without this
            // branch the page fell through to the generic fallback card and
            // rendered blank. Say plainly what happened instead: the capture
            // worked, the reading hasn't happened yet.
            //
            // The image itself is NOT displayed here. `detail.imageKey` is an
            // S3 key with no route serving it, and decoding the raw bytes
            // client-side needs lib/starRaster.ts, which is landing separately
            // on the /r consumer branch. When either seam exists, this is
            // where the bitmap goes.
            <GlassCard>
              <p className="text-sm font-medium" style={{ color: T.text }}>
                Captured as an image
              </p>
              <p className="mt-1.5 text-sm" style={{ color: T.textSecondary }}>
                This point-of-sale prints receipts as an image rather than as
                text, so there are no line items to show yet. The receipt was
                captured and stored successfully.
              </p>
            </GlassCard>
          ) : receipt ? (
            <>
              {detail.confidence === "low" && <ApproximateCaveat />}
              <ReceiptView summary={receipt.summary} hasStructure={receipt.hasStructure} />
            </>
          ) : (
            <GlassCard>
              <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs" style={{ color: T.textSecondary }}>
                {detail.rawText}
              </pre>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}
