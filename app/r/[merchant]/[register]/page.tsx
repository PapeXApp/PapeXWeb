// app/r/[merchant]/[register]/page.tsx
//
// RDS sticker taps: `https://papex.app/r/<merchantSlug>/<registerSlug>`.
//
// A passive NFC sticker on a register (POS-fed merchants, KORONA today) holds
// that one URL for every customer, with no sid in it. This page asks the
// adapter which sale just happened at that register (lib/rdsSticker.ts) and
// then hands off to the ordinary receipt page, `/r?sid=<sid>`, which renders
// and saves POS receipts like any other (app/r/receiptPage.tsx):
//   one recent sale        -> redirect to /r?sid=<sid>
//   several recent sales   -> a picker (total + how long ago), each a link
//   no_recent_sale         -> "tap again right after paying"
//   unknown_register       -> "this sticker isn't set up yet"
//   adapter unreachable    -> retry screen
//
// /r/demo is a separate, static route and is untouched: it is one segment
// deep, this is two, and `demo` is refused as a merchant slug here anyway.
//
// Never cached: the answer changes the moment a sale is claimed or ages out of
// the adapter's ~2 minute window. The resolved sid only ever appears in the
// redirect / links, never in a log.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { platformFromUserAgent } from "@/lib/storeLinks";
import {
  formatCandidateAge,
  formatCandidateTotal,
  receiptPathFor,
  resolveSticker,
  type StickerCandidate,
} from "@/lib/rdsSticker";
import { Shell, GlassCard, StateCard, AppCta } from "../../ui";
import { S } from "../../chrome";
import RetryButton from "../../RetryButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ merchant: string; register: string }> };

export const metadata: Metadata = {
  title: "Your PapeX Receipt",
  description: "View your digital receipt from PapeX.",
  robots: { index: false, follow: false },
};

export default async function StickerTapPage({ params }: Props) {
  const { merchant, register } = await params;
  const result = await resolveSticker(merchant, register);

  // Outside any try/catch: redirect() works by throwing.
  if (result.kind === "receipt") redirect(receiptPathFor(result.sid));

  const platform = platformFromUserAgent((await headers()).get("user-agent") ?? "");

  if (result.kind === "pick") {
    return (
      <Shell>
        <CandidatePicker candidates={result.candidates} now={new Date()} />
      </Shell>
    );
  }

  if (result.kind === "no_recent_sale") {
    return (
      <Shell>
        <StateCard
          icon="clock"
          title="No receipt yet"
          message="We couldn't find a sale at this register in the last 2 minutes. Tap the sticker again right after you pay."
        >
          <RetryButton />
        </StateCard>
        <AppCta platform={platform} />
      </Shell>
    );
  }

  if (result.kind === "unknown_register") {
    return (
      <Shell>
        <StateCard
          icon="warning"
          title="This sticker isn't set up yet"
          message="Ask the store for your receipt another way — this PapeX sticker isn't linked to a register."
        />
        <AppCta platform={platform} />
      </Shell>
    );
  }

  return (
    <Shell>
      <StateCard
        icon="warning"
        title="Couldn't load your receipt"
        message="We're having trouble right now — try again in a moment."
      >
        <RetryButton />
      </StateCard>
      <AppCta platform={platform} />
    </Shell>
  );
}

function CandidatePicker({ candidates, now }: { candidates: StickerCandidate[]; now: Date }) {
  return (
    <>
      <div className="px-1 pt-2">
        <h1 className="font-barlow text-xl font-medium" style={{ color: S.text }}>
          Which one is yours?
        </h1>
        <p className="mt-1 text-sm" style={{ color: S.textSecondary }}>
          A few sales just happened at this register. Pick the one you paid for.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {candidates.map((c) => {
          const age = formatCandidateAge(c, now);
          return (
            <li key={c.sid}>
              <Link href={receiptPathFor(c.sid)} prefetch={false} className="block">
                <GlassCard emphasis="neutral" className="flex items-center justify-between px-5 py-4">
                  <span className="text-lg font-medium tabular-nums">
                    {formatCandidateTotal(c)}
                    {c.isRefund ? <span className="ml-2 text-sm font-normal">Refund</span> : null}
                  </span>
                  {age ? <span className="text-sm opacity-70">{age}</span> : null}
                </GlassCard>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
