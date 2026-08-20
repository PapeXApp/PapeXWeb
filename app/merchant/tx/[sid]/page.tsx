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
import { parseEscPos, type DecodedRasterPage } from "@/lib/escpos";
import { summarizeReceipt, hasStructure as computeHasStructure, type ReceiptSummary } from "@/lib/receiptSummary";
import { GlassCard, ReceiptView } from "@/app/r/ui";
import { LoadingBlock, EmptyState, ErrorBanner, ApproximateCaveat, PaymentChip, ConfidencePill, ParseFailedPill, ImageOnlyPill } from "../../ui/primitives";
import { T } from "../../ui/tokens";

interface ParsedReceipt {
  summary: ReceiptSummary;
  hasStructure: boolean;
  /**
   * Set when the payload decoded to a FULL-PAGE Star Line Mode bitmap — the
   * POS printed the whole receipt as a picture instead of sending text (see
   * lib/starRaster.ts). A logo-sized band is deliberately excluded: that is
   * decoration on a textual receipt, not a receipt.
   */
  rasterPage?: DecodedRasterPage;
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
      if (!d) return;

      // The decode is attempted for EVERY status, and what comes back decides
      // how the page renders — deliberately not `parseStatus`, which is only
      // the indexer's opinion at upload time and can be wrong about raster in
      // two directions:
      //
      //   - "failed" — the indexer demotes a raster job to "failed" if the
      //     decode OR the PNG upload throws, and the PNG upload needs an
      //     s3:PutObject grant on receipts/* that has not been applied yet.
      //     Those rows are perfectly decodable bitmaps sitting behind a
      //     failure label.
      //   - "ok" — rows indexed BEFORE raster support ran the bitmap through
      //     the text parser and stored the resulting mojibake as a success.
      //
      // Both render correctly here as long as the bytes are trusted over the
      // label. parseEscPos detects Star raster over the whole blob up front,
      // so it never desyncs its text state machine on these payloads.
      if (bytesResult.status === "fulfilled") {
        try {
          const parsed = parseEscPos(bytesResult.value);
          const summary = summarizeReceipt(parsed.lines);
          // Only a full-page bitmap counts as the receipt — same line
          // lib/receiptState.ts draws for /r.
          const rasterPage = parsed.rasterPage?.fullPage ? parsed.rasterPage : undefined;
          if (!cancelled) setReceipt({ summary, hasStructure: computeHasStructure(summary), rasterPage });
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
              {receipt?.rasterPage || detail.parseStatus === "ok_raster" ? (
                <ImageOnlyPill />
              ) : detail.parseStatus === "failed" ? (
                <ParseFailedPill />
              ) : (
                <ConfidencePill confidence={detail.confidence} />
              )}
              <PaymentChip method={detail.paymentMethod} last4={detail.cardLast4} />
            </div>
          </div>

          {receipt?.rasterPage ? (
            // The bitmap decoded, so it IS the receipt — merchant name, items
            // and total are all in those pixels. Rendered through the same
            // ReceiptView /r uses, which puts the image in its own card and
            // skips the text cards (there are no text lines by construction).
            // This branch sits ahead of the parseStatus ones on purpose: see
            // the effect above for why a decodable bitmap can be sitting
            // behind a "failed" or a stale "ok" label.
            <ReceiptView
              summary={receipt.summary}
              hasStructure={receipt.hasStructure}
              rasterPage={receipt.rasterPage}
            />
          ) : detail.parseStatus === "failed" ? (
            <>
              <ErrorBanner message="This receipt couldn't be parsed. Showing the raw captured text below." />
              <GlassCard>
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs" style={{ color: T.textSecondary }}>
                  {detail.rawText}
                </pre>
              </GlassCard>
            </>
          ) : detail.parseStatus === "ok_raster" ? (
            // Reached only when the row IS raster but we could not produce the
            // picture: the bytes fetch failed, or the blob aged out of S3.
            // rawText is empty on these rows, so without this branch the page
            // fell through to the generic fallback and rendered blank. Say
            // what happened instead — and don't imply the capture was lost,
            // because it wasn't.
            <GlassCard>
              <p className="text-sm font-medium" style={{ color: T.text }}>
                Captured as an image
              </p>
              <p className="mt-1.5 text-sm" style={{ color: T.textSecondary }}>
                This point-of-sale prints receipts as an image rather than as
                text. The receipt was captured and stored, but the image
                couldn&apos;t be loaded just now — try again in a moment.
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
