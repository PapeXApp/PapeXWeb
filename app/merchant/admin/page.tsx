"use client";

// app/merchant/admin/page.tsx
//
// PapeX staff console for the shared merchant records. Only for logins the
// profile response marks `isAdmin` (the server enforces this on every admin
// route too; this page just doesn't show the tools to anyone else). Tabs:
//   - Requests: every merchant's change requests, status + note, and
//     "Open in editor"
//   - Merchants: every record, open request counts
//   - Editor: one merchant, with an optional pinned request
//
// The tab, merchant and pinned request live in the URL (?tab=&merchant=
// &request=) so a reload or a shared link lands in the same place.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock, RefreshCw } from "lucide-react";
import { useMerchantAuth } from "../AuthContext";
import { useMerchantProfile } from "../profile/ProfileContext";
import { adminListMerchants, friendlyError, isServiceNotConfigured } from "@/lib/merchantProfilesClient";
import type { MerchantSummary } from "@/lib/merchantProfiles/types";
import { Button, Card, EmptyState, ErrorBanner, LoadingBlock, Tabs } from "../ui/primitives";
import { T } from "../ui/tokens";
import { Editor } from "./Editor";
import { MerchantsList } from "./MerchantsList";
import { RequestsInbox } from "./RequestsInbox";

type AdminTab = "requests" | "merchants" | "editor";

function NoAccess() {
  return (
    <Card className="mx-auto flex max-w-md flex-col items-center gap-3 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <Lock className="h-5 w-5" style={{ color: T.textMuted }} strokeWidth={2} />
      </span>
      <h1 className="font-barlow text-lg font-medium" style={{ color: T.text }}>
        {"You don't have access"}
      </h1>
      <p className="max-w-xs text-sm" style={{ color: T.textSecondary }}>
        This page is for the PapeX team.
      </p>
      <Link
        href="/merchant/profile"
        className="mt-1 inline-flex items-center justify-center rounded-full border border-white/[0.12] px-5 py-2.5 text-sm font-medium text-[#F4F4F4] transition hover:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
      >
        Go to your profile
      </Link>
    </Card>
  );
}

function AdminConsole() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getIdToken } = useMerchantAuth();

  const merchantParam = searchParams.get("merchant") ?? "";
  const requestParam = searchParams.get("request") ?? "";
  const rawTab = searchParams.get("tab");
  const tab: AdminTab = rawTab === "merchants" ? "merchants" : rawTab === "editor" && merchantParam ? "editor" : "requests";

  const [merchants, setMerchants] = useState<MerchantSummary[] | null>(null);
  const [merchantsError, setMerchantsError] = useState<string | null>(null);
  const [openCount, setOpenCount] = useState<number | undefined>(undefined);
  const [editorDirty, setEditorDirty] = useState(false);

  const loadMerchants = useCallback(async () => {
    setMerchantsError(null);
    try {
      const res = await adminListMerchants(getIdToken);
      setMerchants(res.merchants);
    } catch (e) {
      setMerchantsError(friendlyError(e, "Couldn't load merchants. Try again."));
    }
  }, [getIdToken]);

  useEffect(() => {
    void loadMerchants();
  }, [loadMerchants]);

  const go = useCallback(
    (params: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(params)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const confirmLeave = useCallback(
    (nextMerchant: string) => {
      if (!editorDirty || !merchantParam || nextMerchant === merchantParam) return true;
      return window.confirm("You have unsaved changes for this merchant. Discard them?");
    },
    [editorDirty, merchantParam]
  );

  const openEditor = useCallback(
    (merchantId: string, requestId?: string) => {
      if (!confirmLeave(merchantId)) return;
      go({ tab: "editor", merchant: merchantId, request: requestId });
    },
    [confirmLeave, go]
  );

  const editorName = merchants?.find((m) => m.id === merchantParam)?.name ?? merchantParam;
  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: "requests", label: "Requests", count: openCount },
    { id: "merchants", label: "Merchants", count: merchants?.length },
  ];
  if (merchantParam) tabs.push({ id: "editor", label: `Editor: ${editorName}` });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
          Admin
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
          Merchant profiles and change requests. Saves go live in the PapeX app right away.
        </p>
      </div>

      <Tabs label="Admin sections" tabs={tabs} value={tab} onChange={(t) => go({ tab: t })} />

      {merchantsError && tab !== "editor" && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <ErrorBanner message={merchantsError} />
          </div>
          <Button variant="outline" onClick={() => void loadMerchants()}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        </div>
      )}

      <div hidden={tab !== "requests"}>
        <RequestsInbox
          getIdToken={getIdToken}
          merchants={merchants ?? []}
          active={tab === "requests"}
          onOpenEditor={openEditor}
          onOpenCount={setOpenCount}
        />
      </div>

      <div hidden={tab !== "merchants"}>
        {merchants === null && !merchantsError ? (
          <LoadingBlock label="Loading merchants…" />
        ) : (
          <MerchantsList merchants={merchants ?? []} onOpen={(id) => openEditor(id)} />
        )}
      </div>

      {merchantParam && (
        <div hidden={tab !== "editor"}>
          <Editor
            key={merchantParam}
            merchantId={merchantParam}
            requestId={requestParam || undefined}
            getIdToken={getIdToken}
            onBack={() => go({ tab: "merchants" })}
            onUnpin={() => go({ request: undefined })}
            onDirtyChange={setEditorDirty}
            onSaved={() => void loadMerchants()}
          />
        </div>
      )}
    </div>
  );
}

function AdminGate() {
  const { data, error, loading, isAdmin } = useMerchantProfile();
  if (loading && !data) return <LoadingBlock label="Checking access…" />;
  if (isServiceNotConfigured(error)) {
    return (
      <EmptyState
        title="Profile service isn't connected yet"
        message="The admin tools work once the merchant profile service is configured on the server."
      />
    );
  }
  if (error && !data) return <ErrorBanner message={friendlyError(error, "Couldn't check your access. Reload to try again.")} />;
  if (!isAdmin) return <NoAccess />;
  return <AdminConsole />;
}

export default function AdminPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<LoadingBlock label="Loading…" />}>
      <AdminGate />
    </Suspense>
  );
}
