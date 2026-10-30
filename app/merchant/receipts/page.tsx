"use client";

// app/merchant/receipts/page.tsx
//
// Receipts: what a customer sees when they tap for their receipt. An editor for
// the merchant's own card config beside a live preview. A publish is a new
// immutable config version, exactly what scripts/cards-publish.mjs writes, with
// the same lint (Papex_RDH lambdas/merchant-api/lib/cardConfig.js).
//
// WHAT THE COPY MAY PROMISE (this page is filmed). A version only decorates
// receipts uploaded after it's published (lib/configItems.js selectConfigVersion),
// and it reaches the cards service within its 60 s cache, so that's what's said.
// Nothing here says a change reaches a receipt that's already printed. Whether a
// customer type can be told apart depends on what the POS prints, and the page
// says so when the real counts show it can't.
//
// Data flow: one load of the config, the merchant's latest receipt and the real
// segment counts; then `draft` is the only state that changes. Every change
// re-renders the preview at once and re-runs the lint as a dry run, debounced.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { History, Lock, Plus, RotateCcw } from "lucide-react";
import { useMerchantAuth } from "../AuthContext";
import { Button, Card, EmptyState, ErrorBanner, LoadingBlock, Select, Sheet, Tabs } from "../ui/primitives";
import { T } from "../ui/tokens";
import {
  MERCHANT_MOCK,
  getCardConfig,
  getCardReach,
  getPreviewReceiptBytes,
  publishCardConfig,
} from "@/lib/merchantApi";
import {
  MAX_OFFERS,
  draftToConfig,
  fromConfig,
  isManagedCard,
  newOffer,
  offersFor,
  toConfigInput,
  type OfferDraft,
  type ReceiptsDraft,
} from "@/lib/merchantReceipts/draft";
import { describeIssues, type PlainIssue } from "@/lib/merchantReceipts/plainLanguage";
import type { CardConfigResponse, CardReach, LayoutOrder, LiveSurface, LoyaltySegment } from "@/lib/merchantReceipts/types";
import { Switch } from "./controls";
import { OfferEditor } from "./OfferEditor";
import { ReceiptPreview } from "./ReceiptPreview";
import { WhoGetsWhat } from "./WhoGetsWhat";

const CHECK_DEBOUNCE_MS = 400;
const FALLBACK_SID = "0123456789abcdef";
/** Above this share of "can't tell", targeting by customer type won't do anything yet. */
const MOSTLY_UNKNOWN = 0.9;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function ReceiptsPage() {
  const { getIdToken } = useMerchantAuth();
  const [data, setData] = useState<CardConfigResponse | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ReceiptsDraft | null>(null);
  const [baseline, setBaseline] = useState("");
  const [reach, setReach] = useState<CardReach | null>(null);
  const [receipt, setReceipt] = useState<{ sid: string; bytes: Uint8Array } | null>(null);
  const [segment, setSegment] = useState<LoyaltySegment>("first");
  const [surface, setSurface] = useState<LiveSurface>("clip");
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const [errors, setErrors] = useState<PlainIssue[]>([]);
  const [warnings, setWarnings] = useState<PlainIssue[]>([]);
  const [checking, setChecking] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // These banners sit at the top of a long page, and the buttons that raise them don't.
  useEffect(() => {
    if (notice || actionError) window.scrollTo({ top: 0 });
  }, [notice, actionError]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const token = await getIdToken();
    if (!token) return;
    try {
      const res = await getCardConfig(token);
      setData(res);
      if (res.config) {
        const next = fromConfig(res.config);
        setDraft(next);
        setBaseline(JSON.stringify(next));
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    void load();
  }, [load]);

  // Both of these only add to the page, so neither failing is worth a banner.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getIdToken();
      if (!token) return;
      const [r, bytes] = await Promise.allSettled([getCardReach(token), getPreviewReceiptBytes(token)]);
      if (cancelled) return;
      if (r.status === "fulfilled") setReach(r.value);
      if (bytes.status === "fulfilled") setReceipt(bytes.value);
    })();
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  const config = useMemo(() => (draft && data?.config ? draftToConfig(draft, data.config) : null), [draft, data?.config]);
  const dirty = draft !== null && JSON.stringify(draft) !== baseline;
  const editable = data?.editable === true;
  const latestVersion = data?.versions[0]?.version ?? null;

  // The lint, as a dry run, whenever the draft changes. A newer answer always
  // wins: `checkRun` drops replies to edits that have since moved on.
  const checkRun = useRef(0);
  useEffect(() => {
    if (!draft || !config || !editable || latestVersion === null) return;
    const run = ++checkRun.current;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await publishCardConfig(token, { baseVersion: latestVersion, config: toConfigInput(draft), dryRun: true });
        if (run !== checkRun.current) return;
        if (res.kind === "invalid") {
          setErrors(describeIssues(res.errors, config));
          setWarnings(describeIssues(res.warnings, config));
        } else if (res.kind === "ok") {
          setErrors([]);
          setWarnings(describeIssues(res.warnings, config));
        } else if (res.kind === "stale") {
          setErrors([{ text: "Someone published a newer version since you opened this page. Reload to get it." }]);
        }
      } catch {
        if (run === checkRun.current) setErrors([{ text: "Couldn't check these changes. They'll be checked again when you publish." }]);
      } finally {
        if (run === checkRun.current) setChecking(false);
      }
    }, CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, config, editable, latestVersion, getIdToken]);

  const updateOffer = useCallback((id: string, next: OfferDraft) => {
    setNotice(null);
    setDraft((d) => (d ? { ...d, offers: d.offers.map((o) => (o.id === id ? next : o)) } : d));
  }, []);
  const update = useCallback((patch: Partial<ReceiptsDraft>) => {
    setNotice(null);
    setDraft((d) => (d ? { ...d, ...patch } : d));
  }, []);
  const toggleSegment = useCallback((id: string, s: LoyaltySegment) => {
    setNotice(null);
    setSegment(s);
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        offers: d.offers.map((o) =>
          o.id === id ? { ...o, segments: o.segments.includes(s) ? o.segments.filter((x) => x !== s) : [...o.segments, s] } : o,
        ),
      };
    });
  }, []);
  const moveOffer = useCallback((index: number, delta: number) => {
    setDraft((d) => {
      if (!d) return d;
      const offers = [...d.offers];
      const [o] = offers.splice(index, 1);
      offers.splice(index + delta, 0, o);
      return { ...d, offers };
    });
  }, []);

  const publish = useCallback(async () => {
    if (!draft || latestVersion === null) return;
    setPublishing(true);
    setActionError(null);
    try {
      const token = await getIdToken();
      if (!token) return;
      const res = await publishCardConfig(token, { baseVersion: latestVersion, config: toConfigInput(draft), dryRun: false });
      setConfirming(false);
      if (res.kind === "ok") {
        const fresh = await getCardConfig(token);
        setData(fresh);
        if (fresh.config) {
          const next = fromConfig(fresh.config);
          setDraft(next);
          setBaseline(JSON.stringify(next));
        }
        setNotice(
          res.noop
            ? "That's already what's live, so nothing changed."
            : MERCHANT_MOCK
              ? `Version ${res.version} saved in this browser. Mock mode: no real receipt changed.`
              : `Version ${res.version} published. It reaches receipts printed from now on, within about a minute.`,
        );
      } else if (res.kind === "invalid" && config) {
        setErrors(describeIssues(res.errors, config));
        setActionError("This couldn't be published. Fix the items below and try again.");
      } else if (res.kind === "stale") {
        setActionError("Someone published a newer version since you opened this page. Reload to get it. Your changes here will be lost.");
      } else {
        setActionError("This store's offers are set up by PapeX and can't be changed here.");
      }
    } catch {
      setActionError("Couldn't publish. Nothing changed. Try again.");
    } finally {
      setPublishing(false);
    }
  }, [draft, latestVersion, getIdToken, config]);

  const restore = useCallback(
    async (version: number) => {
      setActionError(null);
      try {
        const token = await getIdToken();
        if (!token) return;
        const res = await getCardConfig(token, version);
        if (res.config) {
          setDraft(fromConfig(res.config));
          setNotice(`Version ${version} is loaded below. Publish it to make it live again.`);
          setMobileView("edit");
        }
      } catch {
        setActionError(`Couldn't load version ${version}.`);
      }
    },
    [getIdToken],
  );

  if (loading) return <LoadingBlock label="Loading your receipts…" />;
  if (loadError) {
    return (
      <div className="flex flex-col gap-4">
        <Header />
        <ErrorBanner message="Couldn't load your receipt settings. Try again." />
        <Button variant="outline" className="self-start" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }
  if (!data?.config || !draft || !config) {
    return (
      <div className="flex flex-col gap-4">
        <Header />
        <EmptyState title="Not set up yet" message="PapeX sets up the first version of your receipt offers with you. Contact PapeX to get started." />
      </div>
    );
  }

  const offerErrors = (id: string) => errors.filter((e) => e.offerId === id);
  const generalErrors = errors.filter((e) => !e.offerId);
  const liveCount = offersFor(draft, segment).filter((o) => o.surfaces.includes(surface)).length;
  const managedCards = data.config.cards.filter(isManagedCard);
  const unknownShare = reach && reach.total > 0 ? reach.segments.unknown / reach.total : null;
  const previewSid = receipt?.sid ?? FALLBACK_SID;

  const preview = (
    <ReceiptPreview
      config={config}
      state={data.state}
      segment={segment}
      surface={surface}
      onSegment={setSegment}
      onSurface={setSurface}
      receiptBytes={receipt?.bytes ?? null}
      sid={previewSid}
      offerCount={liveCount}
      active={mobileView === "preview"}
    />
  );

  return (
    <div className="flex flex-col gap-5">
      <Header />

      {MERCHANT_MOCK && (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{ borderColor: "rgba(245,165,36,0.35)", background: "rgba(245,165,36,0.1)", color: T.warning }}
          data-testid="mock-banner"
        >
          Mock mode. This is sample data, and publishing here only saves in this browser. No real receipt changes.
        </div>
      )}
      {!editable && (
        <div className="flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: T.glassBorder, color: T.textSecondary }}>
          <Lock className="h-4 w-4 shrink-0" strokeWidth={2} />
          Your store&apos;s offers are set up by PapeX. You can see them here. Contact PapeX to change them.
        </div>
      )}
      {!data.state.enabled && (
        <ErrorBanner message="PapeX has paused offers for your store, so no receipt shows them right now. Contact PapeX to turn them back on." />
      )}
      {notice && (
        <div className="rounded-2xl border px-4 py-3 text-sm" role="status" style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.1)", color: "#6EE7B7" }}>
          {notice}
        </div>
      )}
      {actionError && <ErrorBanner message={actionError} />}

      <Tabs
        className="xl:hidden"
        label="Edit or preview"
        value={mobileView}
        onChange={setMobileView}
        tabs={[
          { id: "edit", label: "Edit" },
          { id: "preview", label: "Preview" },
        ]}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className={`flex min-w-0 flex-col gap-4 ${mobileView === "edit" ? "" : "hidden xl:flex"}`}>
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="font-barlow text-lg font-medium" style={{ color: T.text }}>
                  Offers on receipts
                </h2>
                <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
                  {draft.enabled ? "On. Customers get the offers below with their receipt." : "Off. New receipts show no offers."}
                </p>
              </div>
              <Switch checked={draft.enabled} disabled={!editable} label="Offers on receipts" onChange={(enabled) => update({ enabled })} />
            </div>
            <label className="flex flex-col gap-1.5 sm:max-w-xs">
              <span className="text-xs font-medium" style={{ color: T.textSecondary }}>
                Where offers sit
              </span>
              <Select disabled={!editable} value={draft.order} onChange={(e) => update({ order: e.target.value as LayoutOrder })}>
                <option value="receipt-first">Below the receipt</option>
                <option value="cards-first">Above the receipt</option>
              </Select>
            </label>
          </Card>

          {unknownShare !== null && unknownShare >= MOSTLY_UNKNOWN && (
            <div
              className="rounded-2xl border px-4 py-3 text-sm leading-relaxed"
              style={{ borderColor: "rgba(245,165,36,0.35)", background: "rgba(245,165,36,0.1)", color: T.warning }}
              data-testid="unknown-warning"
            >
              Your recent receipts don&apos;t print loyalty lines PapeX can read, so nearly every customer lands in &ldquo;Can&apos;t
              tell&rdquo;. Until they do, those customers get the offers you choose for &ldquo;Can&apos;t tell&rdquo;.
            </div>
          )}

          <WhoGetsWhat
            offers={draft.offers}
            reach={reach}
            segment={segment}
            disabled={!editable}
            onPreview={setSegment}
            onToggle={toggleSegment}
          />

          {draft.offers.map((offer, i) => (
            <OfferEditor
              key={offer.id}
              offer={offer}
              issues={offerErrors(offer.id)}
              disabled={!editable}
              index={i}
              count={draft.offers.length}
              initiallyOpen={i === 0}
              onChange={(next) => updateOffer(offer.id, next)}
              onMove={(delta) => moveOffer(i, delta)}
              onDelete={() => update({ offers: draft.offers.filter((o) => o.id !== offer.id) })}
            />
          ))}
          {editable && (
            <Button
              variant="outline"
              className="self-start"
              disabled={draft.offers.length >= MAX_OFFERS}
              onClick={() => update({ offers: [...draft.offers, newOffer(draft.offers, data.config!.merchant.ageRestricted)] })}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              Add an offer
            </Button>
          )}

          {(data.config.compliance || managedCards.length > 0) && (
            <Card className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 font-barlow text-lg font-medium" style={{ color: T.text }}>
                <Lock className="h-4 w-4" strokeWidth={2} style={{ color: T.textMuted }} />
                Always on your receipts
              </h2>
              {data.config.compliance && (
                <div data-testid="licence-line">
                  <p className="text-xs font-medium" style={{ color: T.textSecondary }}>
                    Licence line, on every offer
                  </p>
                  <p className="mt-1 text-sm" style={{ color: T.text }}>
                    {data.config.compliance.licenseLine}
                  </p>
                </div>
              )}
              {managedCards
                .filter((c, i, all) => all.findIndex((x) => x.text === c.text) === i)
                .map((c) =>
                  typeof c.text === "string" ? (
                    <div key={c.id}>
                      <p className="text-xs font-medium" style={{ color: T.textSecondary }}>
                        Disclosure
                      </p>
                      <p className="mt-1 text-sm" style={{ color: T.text }}>
                        {c.text}
                      </p>
                    </div>
                  ) : null,
                )}
              <p className="text-xs" style={{ color: T.textMuted }}>
                Set by PapeX. Contact PapeX to change these.
              </p>
            </Card>
          )}

          {editable && (
            // Pinned only while there's something to do, so it never sits over the page for nothing.
            <div className={dirty || errors.length > 0 ? "sticky bottom-20 z-10 md:bottom-4" : ""}>
              <Card className="flex flex-col gap-3 !bg-[#141A24] !p-4">
                {generalErrors.map((e) => (
                  <p key={e.text} role="alert" className="text-sm" style={{ color: "#FCA5A5" }}>
                    {e.text}
                  </p>
                ))}
                {warnings.map((w) => (
                  <p key={w.text} className="text-sm" style={{ color: T.warning }}>
                    {w.text}
                  </p>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <Button disabled={!dirty || errors.length > 0 || checking || publishing} onClick={() => setConfirming(true)}>
                    Publish
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={!dirty || publishing}
                    onClick={() => {
                      setDraft(JSON.parse(baseline) as ReceiptsDraft);
                      setNotice(null);
                    }}
                  >
                    Discard changes
                  </Button>
                  <span className="text-xs" style={{ color: T.textMuted }} aria-live="polite">
                    {checking ? "Checking…" : errors.length > 0 ? `${errors.length} to fix` : dirty ? "Ready to publish" : "No changes"}
                  </span>
                </div>
              </Card>
            </div>
          )}

          <Card className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 font-barlow text-lg font-medium" style={{ color: T.text }}>
              <History className="h-4 w-4" strokeWidth={2} style={{ color: T.textMuted }} />
              Versions
            </h2>
            <p className="text-sm" style={{ color: T.textSecondary }}>
              Each publish is a new version and applies to receipts printed after it. Receipts already printed keep the offers they came with.
            </p>
            <ul className="flex flex-col">
              {data.versions.map((v, i) => (
                <li key={v.version} className="flex items-center justify-between gap-3 border-t py-2.5 first:border-t-0" style={{ borderColor: T.divider }}>
                  <span className="min-w-0 text-sm" style={{ color: T.text }}>
                    Version {v.version}
                    {i === 0 && <span style={{ color: T.success }}> · live</span>}
                    <span className="block text-xs" style={{ color: T.textMuted }}>
                      {formatDate(v.publishedAt)}
                    </span>
                  </span>
                  {editable && i > 0 && (
                    <Button variant="ghost" className="!px-3 !py-1.5" onClick={() => void restore(v.version)}>
                      <RotateCcw className="h-4 w-4" strokeWidth={2} />
                      Load
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className={`min-w-0 xl:sticky xl:top-8 ${mobileView === "preview" ? "" : "hidden xl:block"}`}>{preview}</div>
      </div>

      <Sheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Publish version ${(latestVersion ?? 0) + 1}?`}
        description="Customers see this on receipts printed from now on, within about a minute. Receipts already printed keep the offers they came with."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button disabled={publishing} onClick={() => void publish()}>
              {publishing ? "Publishing…" : "Publish"}
            </Button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: T.textSecondary }}>
          You can go back at any time by loading an earlier version and publishing it again.
        </p>
      </Sheet>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
        Receipts
      </h1>
      <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
        Choose what customers see when they tap for their receipt.
      </p>
    </div>
  );
}
