"use client";

// app/merchant/profile/page.tsx
//
// Profile: everything on the merchant's PapeX app profile, as read-only
// cards, straight from the shared record `merchants/{merchantId}` (the same
// document the app reads, see lib/merchantProfiles/types.ts). Merchants
// don't edit it here; every card has "Request a change", which opens the
// Composer and lands in "Your requests" at the bottom. PapeX staff make the
// edit from /admin.
//
// Live reflection: when the profile source is "firestore" the page
// subscribes to the doc (onSnapshot on papexv2), so a staff save shows up
// without a reload; on mock data it refetches on focus and every 15s
// (useLiveMerchantRecord). A version bump also refreshes "Your requests",
// since a save can mark a request done.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PencilLine, RefreshCw } from "lucide-react";
import { useMerchantAuth } from "../AuthContext";
import { useMerchantProfile } from "./ProfileContext";
import { isServiceNotConfigured, friendlyError, useLiveMerchantRecord, useMyRequests } from "@/lib/merchantProfilesClient";
import type { ChangeRequest } from "@/lib/changeRequests/types";
import { Button, EmptyState, ErrorBanner, LoadingBlock } from "../ui/primitives";
import { T } from "../ui/tokens";
import { BrandHeaderPreview } from "./BrandHeaderPreview";
import { Composer } from "./Composer";
import { RequestsList } from "./RequestsList";
import { ProfileSections, type ComposerPrefill } from "./sections";
import { formatDateTime } from "./shared";

export default function ProfilePage() {
  const { getIdToken, user } = useMerchantAuth();
  const { data, error, loading, reload, isAdmin } = useMerchantProfile();
  const refetchQuiet = useCallback(() => void reload({ quiet: true }), [reload]);
  const { record, mode } = useLiveMerchantRecord(data, refetchQuiet);

  const serviceDown = isServiceNotConfigured(error);
  const requestsState = useMyRequests(getIdToken, !!data && !serviceDown);
  const { data: reqData, setData: setReqData, reload: reloadRequests } = requestsState;
  const requests = reqData?.requests ?? [];
  const openCount = requests.filter((r) => r.status === "received" || r.status === "in_progress").length;

  // Composer: remounted per request via `key` so no state leaks between them.
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKey, setComposerKey] = useState(0);
  const [prefill, setPrefill] = useState<ComposerPrefill>({ section: "other" });
  const openComposer = useCallback((p: ComposerPrefill) => {
    setPrefill(p);
    setComposerKey((k) => k + 1);
    setComposerOpen(true);
  }, []);

  const onCreated = useCallback(
    (req: ChangeRequest) => {
      setReqData({ requests: [req, ...(reqData?.requests ?? []).filter((r) => r.id !== req.id)] });
    },
    [reqData, setReqData]
  );

  // A version bump after first load = PapeX just saved. Flash "Updated just
  // now" and pull fresh request statuses.
  const version = record?.version;
  const prevVersion = useRef<number | undefined>(undefined);
  const [justUpdated, setJustUpdated] = useState(false);
  useEffect(() => {
    if (version === undefined) return;
    const prev = prevVersion.current;
    prevVersion.current = version;
    if (prev === undefined || version <= prev) return;
    setJustUpdated(true);
    void reloadRequests({ quiet: true });
    const t = window.setTimeout(() => setJustUpdated(false), 6000);
    return () => window.clearTimeout(t);
  }, [version, reloadRequests]);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
          Profile
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
          What customers see on your PapeX profile. Want something changed? Send us a request.
        </p>
      </div>
      {!serviceDown && (
        <Button onClick={() => openComposer({ section: "other" })}>
          <PencilLine className="h-4 w-4" strokeWidth={2} />
          Request a change
        </Button>
      )}
    </div>
  );

  let body: React.ReactNode;
  if (loading && !data) {
    body = <LoadingBlock label="Loading your profile…" />;
  } else if (serviceDown) {
    body = (
      <EmptyState
        title="Profile service isn't connected yet"
        message="Your PapeX profile will show up here as soon as it's switched on. Nothing for you to do."
      />
    );
  } else if (error && !data) {
    body = (
      <div className="flex flex-col items-start gap-3">
        <ErrorBanner message={friendlyError(error, "Couldn't load your profile. Try again.")} />
        <Button variant="outline" onClick={() => void reload()}>
          <RefreshCw className="h-4 w-4" strokeWidth={2} />
          Try again
        </Button>
      </div>
    );
  } else if (!data?.merchantId || !record) {
    body = (
      <EmptyState
        title="Your login isn't linked to a store yet"
        message={`Ask PapeX to connect ${user?.email ?? "your email"} to your store. Once it's linked, your profile shows up here.`}
      >
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button onClick={() => openComposer({ section: "other" })}>Send us a note</Button>
          {isAdmin && (
            <Link
              href="/merchant/admin"
              className="inline-flex items-center justify-center rounded-full border border-white/[0.12] px-5 py-2.5 text-sm font-medium text-[#F4F4F4] transition hover:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
            >
              Open Admin
            </Link>
          )}
        </div>
      </EmptyState>
    );
  } else {
    body = (
      <>
        <div className="flex flex-col gap-2">
          <BrandHeaderPreview
            name={record.name}
            logoUrl={record.logoUrl}
            brandColor={record.brandColor}
            brandColorSecondary={record.brandColorSecondary}
            category={record.category}
            blurb={record.blurb}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: T.textMuted }}>
            {record.updatedAt && <span>Last updated {formatDateTime(record.updatedAt)}</span>}
            {mode === "firestore" && (
              <span className="inline-flex items-center gap-1.5" title="Changes from PapeX appear here instantly">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: T.success }} aria-hidden />
                Live
              </span>
            )}
            {justUpdated && (
              <span role="status" className="rounded-full px-2 py-0.5 font-medium" style={{ background: "rgba(16,185,129,0.14)", color: T.success }}>
                Updated just now
              </span>
            )}
            {openCount > 0 && (
              <a
                href="#your-requests"
                className="rounded underline underline-offset-2 transition hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                style={{ color: T.textSecondary }}
              >
                {openCount} open request{openCount === 1 ? "" : "s"}
              </a>
            )}
          </div>
        </div>
        <ProfileSections record={record} onRequest={openComposer} />
      </>
    );
  }

  const showRequests = !!data && !serviceDown;

  return (
    <div className="flex flex-col gap-5">
      {header}
      {body}

      {showRequests && (
        <section id="your-requests" className="flex scroll-mt-24 flex-col gap-3 pt-2" aria-labelledby="your-requests-title">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="your-requests-title" className="font-barlow text-xl font-medium" style={{ color: T.text }}>
              Your requests
            </h2>
            <span className="text-xs" style={{ color: T.textMuted }}>
              {"We'll update the status here."}
            </span>
          </div>
          {requestsState.error && !reqData ? (
            <ErrorBanner message={friendlyError(requestsState.error, "Couldn't load your requests. Try again.")} />
          ) : requestsState.loading && !reqData ? (
            <LoadingBlock label="Loading your requests…" />
          ) : (
            <RequestsList requests={requests} />
          )}
        </section>
      )}

      <Composer
        key={composerKey}
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        record={record}
        prefill={prefill}
        getIdToken={getIdToken}
        onCreated={onCreated}
      />
    </div>
  );
}
