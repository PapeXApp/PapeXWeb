"use client";

// app/merchant/intelligence/sections/BeyondYourWallsSection.tsx
//
// Section 4 — "Beyond your four walls" (use-cases doc §4 / plan.md §6): the
// panel section, visually distinct from the own-data sections above it, and
// placed LAST in the reading order on purpose — "least certain, most
// legally sensitive... sits last, where it's a reward rather than a claim."
//
// Two independent fetches (plan.md's "The two panel calls run independently
// — one failing must not blank the other," and this build's property 4:
// forensics/cross-shopping/traffic-index are three independent fetches
// total). Mirrors how app/merchant/insights/page.tsx isolates its tap-rate
// fetch from the main insights fetch: separate loading/error state per call,
// so a traffic-index outage never blanks share-of-wallet/competitive-set/
// unserved-demand, and vice versa.

import { useEffect, useState } from "react";
import { useMerchantAuth } from "../../AuthContext";
import {
  getCrossShopping,
  getTrafficIndex,
  type CrossShoppingResponse,
  type CrossShoppingWindow,
  type TrafficIndexResponse,
  type TrafficIndexWindow,
} from "@/lib/merchantApi";
import { ErrorBanner, LoadingBlock } from "../../ui/primitives";
import { T } from "../../ui/tokens";
import { DemoRibbon, PanelSectionBanner } from "../ui";
import { ShareOfWalletCard } from "./ShareOfWalletCard";
import { CompetitiveSetCard } from "./CompetitiveSetCard";
import { UnservedDemandTable } from "./UnservedDemandTable";
import { TrafficIndexCard } from "./TrafficIndexCard";

const XSHOP_WINDOWS: { value: CrossShoppingWindow; label: string }[] = [
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];
const TRAFFIC_WINDOWS: { value: TrafficIndexWindow; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

function WindowToggle<W extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: W; label: string }[];
  value: W;
  onChange: (v: W) => void;
}) {
  return (
    <div className="flex rounded-full border p-0.5" style={{ borderColor: T.glassBorder }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className="rounded-full px-3 py-1 text-xs font-medium transition"
          style={{
            background: value === o.value ? T.orange : "transparent",
            color: value === o.value ? "#181A20" : T.textSecondary,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function BeyondYourWallsSection() {
  const { getIdToken } = useMerchantAuth();

  const [xshopWindow, setXshopWindow] = useState<CrossShoppingWindow>("30d");
  const [trafficWindow, setTrafficWindow] = useState<TrafficIndexWindow>("7d");

  const [xshop, setXshop] = useState<CrossShoppingResponse | null>(null);
  const [xshopLoading, setXshopLoading] = useState(true);
  const [xshopError, setXshopError] = useState<string | null>(null);

  const [traffic, setTraffic] = useState<TrafficIndexResponse | null>(null);
  const [trafficLoading, setTrafficLoading] = useState(true);
  const [trafficError, setTrafficError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setXshopError(null);
      setXshopLoading(true);
      const token = await getIdToken();
      if (!token) return;
      try {
        const data = await getCrossShopping(token, xshopWindow);
        if (!cancelled) setXshop(data);
      } catch {
        if (!cancelled) setXshopError("Couldn't load your category comparison. Try again.");
      } finally {
        if (!cancelled) setXshopLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [xshopWindow, getIdToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTrafficError(null);
      setTrafficLoading(true);
      const token = await getIdToken();
      if (!token) return;
      try {
        const data = await getTrafficIndex(token, trafficWindow);
        if (!cancelled) setTraffic(data);
      } catch {
        if (!cancelled) setTrafficError("Couldn't load the traffic index. Try again.");
      } finally {
        if (!cancelled) setTrafficLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [trafficWindow, getIdToken]);

  // Neither response carries a merchant name (plan.md constraint #5) — only
  // category + dataSource + disclosure, all safe to surface. Either
  // response is an equally valid source for these three (both come from the
  // same panel on the same request), so falling back from xshop to traffic
  // just covers the case where cross-shopping alone failed to load.
  const dataSource = xshop?.dataSource ?? traffic?.dataSource ?? null;
  const category = xshop?.category ?? traffic?.category ?? null;
  const disclosure = xshop?.disclosure ?? traffic?.disclosure ?? null;

  return (
    <section
      className="flex flex-col gap-4 rounded-[24px] border p-5"
      style={{ borderColor: "rgba(43, 127, 198, 0.22)", background: "rgba(43, 127, 198, 0.03)" }}
    >
      {dataSource === "demo_panel" && <DemoRibbon />}

      <PanelSectionBanner category={category} basis={xshop?.unservedDemand.basis} />

      {xshopError && <ErrorBanner message={xshopError} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium" style={{ color: T.text }}>
          Share of wallet &amp; competitive set
        </h3>
        <WindowToggle options={XSHOP_WINDOWS} value={xshopWindow} onChange={setXshopWindow} />
      </div>

      {xshopLoading && !xshop ? (
        <LoadingBlock label="Loading your category comparison…" />
      ) : xshop ? (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <ShareOfWalletCard metric={xshop.shareOfWallet} />
            <CompetitiveSetCard metric={xshop.competitiveSet} />
          </div>
          <UnservedDemandTable metric={xshop.unservedDemand} />
        </>
      ) : null}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: T.divider }}>
        <h3 className="text-sm font-medium" style={{ color: T.text }}>
          Traffic index
        </h3>
        <WindowToggle options={TRAFFIC_WINDOWS} value={trafficWindow} onChange={setTrafficWindow} />
      </div>

      {trafficError && <ErrorBanner message={trafficError} />}

      {trafficLoading && !traffic ? (
        <LoadingBlock label="Loading the traffic index…" />
      ) : traffic ? (
        <TrafficIndexCard metric={traffic.index} yourBasis={traffic.yourBasis} />
      ) : null}

      {disclosure && (
        <p className="border-t pt-4 text-xs leading-relaxed" style={{ borderColor: T.divider, color: T.textMuted }}>
          {disclosure}
        </p>
      )}
    </section>
  );
}
