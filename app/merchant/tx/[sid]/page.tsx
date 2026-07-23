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
// `hasStructure` is forced to false whenever parseStatus === "failed",
// regardless of what the summarizer's own heuristic says — a failed parse
// means "trust nothing but the raw text," and that must win even if a
// garbled receipt accidentally trips a heuristic (see lib/merchantMock.ts's
// comment on why the failed fixture is built with zero A-Z content, which
// keeps this belt-and-suspenders check from ever actually firing in the mock).

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useMerchantAuth } from "../../AuthContext";
import { getTransaction, type MerchantTransactionDetail } from "@/lib/merchantApi";
import { GlassCard, ReceiptView } from "@/app/r/ui";
import { LoadingBlock, EmptyState, ErrorBanner, ApproximateCaveat, PaymentChip, ConfidencePill, ParseFailedPill } from "../../ui/primitives";
import { T } from "../../ui/tokens";

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

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setDetail(undefined);
      const token = await getIdToken();
      if (!token) return;
      try {
        const d = await getTransaction(token, sid);
        if (!cancelled) setDetail(d);
      } catch {
        if (!cancelled) setError("Couldn't load this receipt. Try again.");
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
          ) : (
            <>
              {detail.confidence === "low" && <ApproximateCaveat />}
              <ReceiptView summary={detail.receipt} hasStructure={detail.hasStructure} />
            </>
          )}
        </>
      )}
    </div>
  );
}
