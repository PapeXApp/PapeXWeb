"use client";

// app/merchant/admin/RequestsInbox.tsx
//
// Every merchant's change requests, for PapeX staff. Default filter is
// "Open" (received + in progress). Each card has the full request, a status
// + note form (PATCH), and "Open in editor", which jumps to that merchant's
// editor with the request pinned alongside.
//
// "Open" and "All" fetch without a status param and filter here; the
// contract's `?status=` takes one status, and the pilot's volume makes one
// unfiltered fetch cheap.

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Check, ExternalLink, Mail, RefreshCw } from "lucide-react";
import type { MerchantSummary } from "@/lib/merchantProfiles/types";
import {
  CHANGE_REQUEST_LIMITS,
  type ChangeRequest,
  type ChangeRequestStatus,
  type ChangeRequestStatusUpdate,
} from "@/lib/changeRequests/types";
import { adminListRequests, adminUpdateRequest, friendlyError, type TokenGetter } from "@/lib/merchantProfilesClient";
import { Button, Card, Chip, EmptyState, ErrorBanner, LoadingBlock, REQUEST_STATUS_LABEL, Select, Spinner, StatusPill, Textarea } from "../ui/primitives";
import { T } from "../ui/tokens";
import { ACTION_LABEL, AppIconTile, Lightbox, SECTION_META, Swatch, Thumb, formatDateTime, relativeTime } from "../profile/shared";

type Filter = "open" | ChangeRequestStatus | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "received", label: "Received" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
  { id: "declined", label: "Declined" },
  { id: "all", label: "All" },
];

const STATUSES: ChangeRequestStatus[] = ["received", "in_progress", "done", "declined"];

function isOpen(r: ChangeRequest) {
  return r.status === "received" || r.status === "in_progress";
}

/** Polite live region: "Saving…" then a brief "Saved" tick. */
function SaveState({ saving, saved, label = "Saved" }: { saving: boolean; saved: boolean; label?: string }) {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: saving ? T.textMuted : T.success }}>
      {saving ? (
        <>
          <Spinner className="h-3 w-3" /> Saving…
        </>
      ) : saved ? (
        <>
          <Check className="h-3 w-3" strokeWidth={2.5} /> {label}
        </>
      ) : null}
    </span>
  );
}

function InboxCard({
  req,
  merchant,
  getIdToken,
  onChanged,
  onOpenEditor,
}: {
  req: ChangeRequest;
  merchant?: MerchantSummary;
  getIdToken: TokenGetter;
  onChanged: (r: ChangeRequest) => void;
  onOpenEditor: (merchantId: string, requestId: string) => void;
}) {
  const [status, setStatus] = useState<ChangeRequestStatus>(req.status);
  const [note, setNote] = useState(req.adminNote ?? "");
  const [saving, setSaving] = useState<null | "status" | "note">(null);
  const [saved, setSaved] = useState<null | "status" | "note">(null);
  const [err, setErr] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const noteId = useId();
  // Separate syncs: a status save must not wipe a note being typed.
  useEffect(() => setStatus(req.status), [req.status]);
  useEffect(() => setNote(req.adminNote ?? ""), [req.adminNote]);
  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(null), 2500);
    return () => window.clearTimeout(t);
  }, [saved]);

  const noteChanged = note.trim() !== (req.adminNote ?? "").trim();
  const images = req.attachments.map((a) => ({ src: a.url, name: a.name }));
  const merchantName = req.merchantName ?? merchant?.name ?? (req.merchantId ? req.merchantId : "Unlinked login");

  // An absent adminNote keeps the stored note (see the PATCH route), so a
  // status change sends only the status.
  async function send(kind: "status" | "note", update: ChangeRequestStatusUpdate) {
    setSaving(kind);
    setSaved(null);
    setErr(null);
    try {
      const res = await adminUpdateRequest(getIdToken, req.id, update);
      onChanged(
        res ?? {
          ...req,
          status: update.status,
          ...(update.adminNote !== undefined ? { adminNote: update.adminNote || undefined } : {}),
          updatedAt: new Date().toISOString(),
        }
      );
      setSaved(kind);
    } catch (e) {
      if (kind === "status") setStatus(req.status);
      setErr(friendlyError(e, kind === "status" ? "Couldn't change the status. Try again." : "Couldn't save the note. Try again."));
    } finally {
      setSaving(null);
    }
  }

  function changeStatus(next: ChangeRequestStatus) {
    setStatus(next);
    if (next !== req.status) void send("status", { status: next });
  }

  return (
    <Card className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <AppIconTile name={merchantName} logoUrl={merchant?.logoUrl} brandColor={merchant?.brandColor} size={36} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium" style={{ color: T.text }}>
              {merchantName}
            </p>
            <p className="text-xs" style={{ color: T.textMuted }}>
              {(SECTION_META[req.section] ?? SECTION_META.other).label} · {ACTION_LABEL[req.action] ?? req.action}
              <span title={formatDateTime(req.createdAt)}> · {relativeTime(req.createdAt)}</span>
            </p>
          </div>
        </div>
        <StatusPill status={req.status} />
      </div>

      {req.itemLabels.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {req.itemLabels.map((l, i) => (
            <li key={i} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: "rgba(255,255,255,0.06)", color: T.textSecondary }}>
              {req.action === "remove" ? "Remove: " : ""}
              {l}
            </li>
          ))}
        </ul>
      )}

      {req.message && (
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: T.textSecondary }}>
          {req.message}
        </p>
      )}

      {req.proposedColors && (req.proposedColors.primary || req.proposedColors.secondary) && (
        <div className="flex flex-wrap items-center gap-4">
          {req.proposedColors.primary && <Swatch label="Proposed primary" hex={req.proposedColors.primary} />}
          {req.proposedColors.secondary && <Swatch label="Proposed secondary" hex={req.proposedColors.secondary} />}
        </div>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <Thumb key={i} src={img.src} name={img.name} onClick={() => setLightbox(i)} />
          ))}
          <Lightbox images={images} index={lightbox} onIndex={setLightbox} onClose={() => setLightbox(null)} />
        </div>
      )}

      <p className="text-xs" style={{ color: T.textMuted }}>
        <a
          href={`mailto:${req.requesterEmail}`}
          className="inline-flex items-center gap-1 rounded underline-offset-2 transition hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
          style={{ color: T.textSecondary }}
        >
          <Mail className="h-3 w-3" />
          {req.requesterEmail}
        </a>
        <span> · sent {formatDateTime(req.createdAt)}</span>
      </p>

      <div className="flex flex-col gap-2.5 border-t pt-3.5" style={{ borderColor: T.divider }}>
        <div className="grid gap-2.5 sm:grid-cols-[180px_minmax(0,1fr)]">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2 text-xs font-medium" style={{ color: T.textMuted }}>
              Status
              <SaveState saving={saving === "status"} saved={saved === "status"} />
            </span>
            <Select
              value={status}
              onChange={(e) => changeStatus(e.target.value as ChangeRequestStatus)}
              disabled={saving !== null}
              className="cursor-pointer disabled:cursor-wait disabled:opacity-60"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {REQUEST_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            <span className="text-[11px]" style={{ color: T.textMuted }}>
              Saves as soon as you pick.
            </span>
          </label>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={noteId} className="text-xs font-medium" style={{ color: T.textMuted }}>
              Note to the merchant (they see this)
            </label>
            <Textarea
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={CHANGE_REQUEST_LIMITS.maxAdminNoteChars}
              placeholder="Optional. For example: done, it's live in the app."
              className="min-h-[44px]"
            />
          </div>
        </div>
        {err && <ErrorBanner message={err} />}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <SaveState saving={false} saved={saved === "note"} label="Note saved" />
          {req.merchantId && (
            <Button variant="outline" onClick={() => onOpenEditor(req.merchantId!, req.id)}>
              <ExternalLink className="h-4 w-4" /> Open in editor
            </Button>
          )}
          <Button variant={noteChanged ? "primary" : "outline"} onClick={() => void send("note", { status: req.status, adminNote: note.trim() })} disabled={!noteChanged || saving !== null}>
            {saving === "note" && <Spinner className="h-4 w-4 !text-white" />}
            {saving === "note" ? "Saving…" : "Save note"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function RequestsInbox({
  getIdToken,
  merchants,
  active,
  onOpenEditor,
  onOpenCount,
}: {
  getIdToken: TokenGetter;
  merchants: MerchantSummary[];
  /** Refetch whenever the tab becomes visible again. */
  active: boolean;
  onOpenEditor: (merchantId: string, requestId: string) => void;
  onOpenCount?: (n: number) => void;
}) {
  const [filter, setFilter] = useState<Filter>("open");
  const [merchantId, setMerchantId] = useState("");
  const [requests, setRequests] = useState<ChangeRequest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cards whose status was just changed stay put (with their "Saved" tick)
  // even if they no longer match the filter, until the next load or filter change.
  const [justChanged, setJustChanged] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => setJustChanged(new Set()), [filter, merchantId]);

  const serverStatus = filter === "open" || filter === "all" ? undefined : filter;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setJustChanged(new Set());
    try {
      const res = await adminListRequests(getIdToken, { status: serverStatus, merchantId: merchantId || undefined });
      setRequests(res.requests);
    } catch (e) {
      setError(friendlyError(e, "Couldn't load requests. Try again."));
    } finally {
      setLoading(false);
    }
  }, [getIdToken, serverStatus, merchantId]);

  useEffect(() => {
    if (active) void load();
  }, [active, load]);

  const byId = useMemo(() => new Map(merchants.map((m) => [m.id, m])), [merchants]);
  const shown = useMemo(() => {
    const list = (requests ?? []).filter(
      (r) => justChanged.has(r.id) || (filter === "open" ? isOpen(r) : filter === "all" ? true : r.status === filter)
    );
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [requests, filter, justChanged]);

  const openTotal = useMemo(() => (requests ?? []).filter(isOpen).length, [requests]);
  useEffect(() => {
    if (requests && filter === "open" && !merchantId) onOpenCount?.(openTotal);
  }, [requests, filter, merchantId, openTotal, onOpenCount]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Chip key={f.id} selected={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Select aria-label="Merchant" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="max-w-[14rem]">
            <option value="">All merchants</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
          <button
            type="button"
            onClick={() => void load()}
            aria-label="Refresh"
            title="Refresh"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#C4C7CC] transition hover:bg-white/[0.08] hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {requests === null && loading ? (
        <LoadingBlock label="Loading requests…" />
      ) : shown.length === 0 && !error ? (
        <EmptyState
          title={filter === "open" ? "Inbox zero" : "Nothing here"}
          message={filter === "open" ? "No open requests right now." : "No requests match this filter."}
        />
      ) : (
        <div className="grid gap-3 2xl:grid-cols-2">
          {shown.map((r) => (
            <InboxCard
              key={r.id}
              req={r}
              merchant={r.merchantId ? byId.get(r.merchantId) : undefined}
              getIdToken={getIdToken}
              onChanged={(next) => {
                setJustChanged((prev) => new Set(prev).add(next.id));
                setRequests((prev) => (prev ?? []).map((x) => (x.id === next.id ? next : x)));
              }}
              onOpenEditor={onOpenEditor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
