"use client";

// app/merchant/profile/Composer.tsx
//
// "Request a change": the merchant tells PapeX what to change on one section
// of their profile. Opens as a side panel on desktop and a bottom sheet on
// mobile (primitives' Sheet: focus trap, Esc closes).
//
//   - action chips: Update / Add / Remove
//   - list sections (menu, deals, whatsNew): a checklist of that
//     section's items, so "remove these three deals" is 3 ticks + Remove
//   - Brand: two color pickers + an optional logo, with a LIVE mini preview
//     of their app header (the "design it yourself" taste). Only colors that
//     differ from the current ones are sent as proposedColors.
//   - message + picture attachments, checked against CHANGE_REQUEST_LIMITS
//     before upload (no SVG, 5 files, 5 MB each)
//
// The parent remounts this (via `key`) for every new request, so state
// never leaks from one request into the next.

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleCheck, Send, X } from "lucide-react";
import type { MerchantRecord } from "@/lib/merchantProfiles/types";
import {
  CHANGE_REQUEST_LIMITS,
  type ChangeRequest,
  type ChangeRequestAction,
  type ChangeRequestSection,
} from "@/lib/changeRequests/types";
import {
  ApiError,
  IMAGE_ACCEPT,
  MAX_UPLOAD_BYTES_TOTAL,
  checkImageFiles,
  createChangeRequest,
  friendlyError,
  prepareImageForUpload,
  type TokenGetter,
} from "@/lib/merchantProfilesClient";
import { Button, Chip, ColorField, ErrorBanner, FileDrop, Select, Sheet, Spinner, Textarea } from "../ui/primitives";
import { T } from "../ui/tokens";
import { BrandHeaderPreview } from "./BrandHeaderPreview";
import { ACTION_LABEL, LIST_SECTIONS, SECTION_META, isHex, sectionItems } from "./shared";
import type { ComposerPrefill } from "./sections";

const SECTION_ORDER: ChangeRequestSection[] = [
  "brand",
  "about",
  "hours",
  "contact",
  "menu",
  "deals",
  "whatsNew",
  "loyalty",
  "other",
];

const PLACEHOLDER: Record<ChangeRequestSection, string> = {
  brand: "Anything else about your look? For example: use the logo from our sign.",
  about: "What should your description say?",
  hours: "For example: open until 11 PM on Fridays and Saturdays, starting next week.",
  contact: "For example: our new phone number is (555) 123 4567.",
  menu: "For example: add the Blue Dream pre-roll, $12.",
  deals: "For example: Taco Tuesday, 2 for $5, every Tuesday 4 to 7 PM.",
  whatsNew: "For example: we now carry oat milk.",
  loyalty: "For example: 1 point per dollar, free drink at 100 points.",
  other: "Tell us what to change.",
};

const HEIC_PREVIEW = /image\/hei[cf]/i;
const TOO_BIG_TOGETHER = "These pictures are too big together. Try fewer or smaller ones.";

function useObjectUrls(files: File[]): Map<File, string> {
  const [urls, setUrls] = useState<Map<File, string>>(() => new Map());
  useEffect(() => {
    const next = new Map<File, string>();
    for (const f of files) next.set(f, URL.createObjectURL(f));
    setUrls(next);
    return () => next.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);
  return urls;
}

function prettyBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function Composer({
  open,
  onClose,
  record,
  prefill,
  getIdToken,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  record: MerchantRecord | null;
  prefill: ComposerPrefill;
  getIdToken: TokenGetter;
  onCreated: (req: ChangeRequest) => void;
}) {
  const initialPrimary = isHex(record?.brandColor) ? record!.brandColor!.toUpperCase() : undefined;
  const initialSecondary = isHex(record?.brandColorSecondary) ? record!.brandColorSecondary!.toUpperCase() : undefined;
  const [section, setSection] = useState<ChangeRequestSection>(prefill.section);
  const [action, setAction] = useState<ChangeRequestAction>(prefill.action ?? "update");
  const [itemIds, setItemIds] = useState<string[]>(prefill.itemIds ?? []);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [logo, setLogo] = useState<File | null>(null);
  const [primary, setPrimary] = useState<string | undefined>(initialPrimary);
  const [secondary, setSecondary] = useState<string | undefined>(initialSecondary);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<ChangeRequest | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const keepEditingRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmDiscard) keepEditingRef.current?.focus();
  }, [confirmDiscard]);

  const items = useMemo(() => sectionItems(record, section), [record, section]);
  const isList = LIST_SECTIONS.has(section);
  const showChecklist = isList && action !== "add" && items.length > 0;
  const isBrand = section === "brand";
  const noun = SECTION_META[section].noun;

  const logoList = useMemo(() => (logo ? [logo] : []), [logo]);
  const fileUrls = useObjectUrls(files);
  const logoUrls = useObjectUrls(logoList);
  const logoPreview = logo ? logoUrls.get(logo) : undefined;

  const maxAttachments = CHANGE_REQUEST_LIMITS.maxFiles - (logo ? 1 : 0);

  const proposedColors = useMemo(() => {
    if (!isBrand) return undefined;
    const out: { primary?: string; secondary?: string } = {};
    if (isHex(primary) && primary.toUpperCase() !== (record?.brandColor ?? "").toUpperCase()) out.primary = primary.toUpperCase();
    if (isHex(secondary) && secondary.toUpperCase() !== (record?.brandColorSecondary ?? "").toUpperCase()) out.secondary = secondary.toUpperCase();
    return out.primary || out.secondary ? out : undefined;
  }, [isBrand, primary, secondary, record?.brandColor, record?.brandColorSecondary]);

  const effectiveItemIds = showChecklist ? itemIds.filter((id) => items.some((i) => i.id === id)) : [];
  const tooLong = message.length > CHANGE_REQUEST_LIMITS.maxMessageChars;
  const hasContent =
    message.trim().length > 0 || effectiveItemIds.length > 0 || !!proposedColors || files.length > 0 || !!logo;
  const canSend = hasContent && !tooLong && !submitting && !preparing;

  // Anything the merchant typed, ticked, picked or attached (section and
  // action alone don't count).
  const prefillIds = prefill.itemIds ?? [];
  const unsaved =
    message.trim().length > 0 ||
    files.length > 0 ||
    !!logo ||
    !!proposedColors ||
    itemIds.length !== prefillIds.length ||
    itemIds.some((id) => !prefillIds.includes(id));

  /** Esc, backdrop, X and Cancel all land here. A second Esc/backdrop while asking = keep editing. */
  function requestClose() {
    if (confirmDiscard) {
      setConfirmDiscard(false);
      return;
    }
    if (unsaved) setConfirmDiscard(true);
    else onClose();
  }

  function changeSection(next: ChangeRequestSection) {
    setSection(next);
    setItemIds([]);
    setError(null);
  }

  function toggleItem(id: string) {
    setItemIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= CHANGE_REQUEST_LIMITS.maxItems) return prev;
      return [...prev, id];
    });
  }

  function addFiles(incoming: File[]) {
    const { accepted, errors } = checkImageFiles(files, incoming, maxAttachments);
    setFileErrors(errors);
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
  }

  function pickLogo(incoming: File[]) {
    const { accepted, errors } = checkImageFiles(files, incoming.slice(0, 1), CHANGE_REQUEST_LIMITS.maxFiles);
    setFileErrors(errors);
    if (accepted[0]) setLogo(accepted[0]);
  }

  async function submit() {
    if (!canSend) return;
    setError(null);
    try {
      const selected = [...files];
      if (logo) selected.unshift(new File([logo], `logo-${logo.name}`, { type: logo.type, lastModified: logo.lastModified }));

      setPreparing(true);
      let outgoing: File[];
      try {
        outgoing = await Promise.all(selected.map((f) => prepareImageForUpload(f)));
      } finally {
        setPreparing(false);
      }

      const totalBytes = outgoing.reduce((sum, f) => sum + f.size, 0);
      if (totalBytes > MAX_UPLOAD_BYTES_TOTAL) {
        setError(TOO_BIG_TOGETHER);
        return;
      }

      setSubmitting(true);
      const res = await createChangeRequest(
        getIdToken,
        {
          section,
          action,
          itemIds: effectiveItemIds,
          message: message.trim(),
          ...(proposedColors ? { proposedColors } : {}),
        },
        outgoing
      );
      setSent(res.request);
      onCreated(res.request);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 413 ? TOO_BIG_TOGETHER : friendlyError(e, "Couldn't send your request. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSent(null);
    setAction("update");
    setItemIds([]);
    setMessage("");
    setFiles([]);
    setLogo(null);
    setFileErrors([]);
    setError(null);
  }

  // ---- Success ----------------------------------------------------------------
  if (sent) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title="Request sent"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={reset}>
              Send another
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
          <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(16,185,129,0.14)" }}>
            <CircleCheck className="h-7 w-7" style={{ color: T.success }} strokeWidth={2} />
          </span>
          <h3 className="font-barlow text-xl font-medium" style={{ color: T.text }}>
            We got it.
          </h3>
          <p className="max-w-xs text-sm" style={{ color: T.textSecondary }}>
            {"We'll update the status under Your requests, and your profile changes as soon as we make the edit."}
          </p>
        </div>
      </Sheet>
    );
  }

  // ---- Form ---------------------------------------------------------------------
  const selectedCount = effectiveItemIds.length;
  let lastGroup: string | undefined;

  return (
    <Sheet
      open={open}
      onClose={requestClose}
      title="Request a change"
      description="Tell us what to change. Add pictures if it helps."
      footer={
        confirmDiscard ? (
          <div
            role="alertdialog"
            aria-labelledby="composer-discard-title"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5"
            style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)" }}
          >
            <div className="min-w-0">
              <p id="composer-discard-title" className="text-sm font-medium" style={{ color: T.text }}>
                Discard this request?
              </p>
              <p className="text-xs" style={{ color: T.textMuted }}>
                What you wrote and picked will be lost.
              </p>
            </div>
            <div className="ml-auto flex shrink-0 gap-2">
              <button
                ref={keepEditingRef}
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium text-[#C4C7CC] transition hover:bg-white/5 hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDiscard(false);
                  onClose();
                }}
                className="inline-flex items-center justify-center rounded-full bg-[#EF4444]/[0.18] px-4 py-2 text-sm font-medium text-[#FCA5A5] transition hover:bg-[#EF4444]/[0.28] hover:text-white outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444]/70"
              >
                Discard
              </button>
            </div>
          </div>
        ) : (
        <div className="flex flex-col gap-2.5">
          {error && <ErrorBanner message={error} />}
          <div className="flex items-center justify-between gap-3">
            {/* The hint is desktop-only: at phone widths it wrapped to 3 lines beside the buttons. */}
            <span className="hidden text-xs sm:block" style={{ color: T.textMuted }}>
              {hasContent ? "" : isBrand ? "Pick a color, add a logo, or write a note." : "Write a note, tick items, or add a picture."}
            </span>
            <div className="ml-auto flex shrink-0 gap-2">
              <Button variant="ghost" onClick={requestClose}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={!canSend}>
                {submitting || preparing ? <Spinner className="h-4 w-4 !text-white" /> : <Send className="h-4 w-4" strokeWidth={2} />}
                {preparing ? "Preparing pictures…" : submitting ? "Sending…" : "Send request"}
              </Button>
            </div>
          </div>
        </div>
        )
      }
    >
      <div className="flex flex-col gap-5">
        {/* Section */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: T.textMuted }}>
            Section
          </span>
          <Select value={section} onChange={(e) => changeSection(e.target.value as ChangeRequestSection)}>
            {SECTION_ORDER.map((s) => (
              <option key={s} value={s}>
                {SECTION_META[s].label}
              </option>
            ))}
          </Select>
        </label>

        {/* Action */}
        <fieldset className="flex min-w-0 flex-col gap-1.5">
          <legend className="mb-1.5 text-xs font-medium" style={{ color: T.textMuted }}>
            What kind of change?
          </legend>
          <div className="flex flex-wrap gap-2">
            {(["update", "add", "remove"] as ChangeRequestAction[]).map((a) => (
              <Chip key={a} selected={action === a} onClick={() => setAction(a)}>
                {ACTION_LABEL[a]}
              </Chip>
            ))}
          </div>
        </fieldset>

        {/* Checklist */}
        {showChecklist && (
          // min-w-0: a fieldset defaults to min-width: min-content, which let long rows push the list past the column.
          <fieldset className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <legend className="text-xs font-medium" style={{ color: T.textMuted }}>
                {action === "remove" ? `Which ${noun} should we remove?` : `Which ${noun}?`}
                {selectedCount > 0 && <span style={{ color: T.orange }}> {selectedCount} selected</span>}
              </legend>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setItemIds(items.slice(0, CHANGE_REQUEST_LIMITS.maxItems).map((i) => i.id))}
                  className="rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-white/[0.06] outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                  style={{ color: T.textSecondary }}
                >
                  Select all
                </button>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setItemIds([])}
                    className="rounded-lg px-2 py-1 text-xs font-medium transition hover:bg-white/[0.06] outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                    style={{ color: T.textSecondary }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div
              className="max-h-64 overflow-y-auto rounded-2xl border p-1"
              style={{ borderColor: T.glassBorder, background: "rgba(255,255,255,0.02)" }}
            >
              {items.map((item) => {
                const checked = itemIds.includes(item.id);
                const header = item.group && item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <div key={item.id}>
                    {header && (
                      <p className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide" style={{ color: T.textMuted }}>
                        {header}
                      </p>
                    )}
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.05] focus-within:bg-white/[0.05] ${
                        checked ? "bg-[#FB8500]/[0.08]" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item.id)}
                        className="h-4 w-4 shrink-0 cursor-pointer rounded accent-[#FB8500]"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm" style={{ color: T.text }}>
                        {item.label}
                      </span>
                      {item.sub && (
                        <span className="max-w-[40%] shrink-0 truncate text-xs" style={{ color: T.textMuted }}>
                          {item.sub}
                        </span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* Brand designer */}
        {isBrand && (
          <div className="flex flex-col gap-4 rounded-2xl border p-4" style={{ borderColor: T.glassBorder, background: "rgba(255,255,255,0.02)" }}>
            <BrandHeaderPreview
              compact
              caption="Live preview"
              name={record?.name ?? ""}
              category={record?.category}
              blurb={record?.blurb}
              logoUrl={logoPreview ?? record?.logoUrl}
              brandColor={primary}
              brandColorSecondary={secondary}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField label="Primary color" value={primary} onChange={setPrimary} />
              <ColorField
                label="Secondary color"
                value={secondary}
                onChange={setSecondary}
                // Only once they've picked something new; Clear puts back what's live.
                onClear={secondary !== initialSecondary ? () => setSecondary(initialSecondary) : undefined}
                fallback={primary ?? "#FB8500"}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: T.textMuted }}>
                New logo (optional)
              </span>
              {logo ? (
                <div className="flex items-center gap-3 rounded-2xl border px-3 py-2.5" style={{ borderColor: T.glassBorder }}>
                  {logoPreview && !HEIC_PREVIEW.test(logo.type) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local blob: preview
                    <img src={logoPreview} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg text-[10px]" style={{ background: "rgba(255,255,255,0.06)", color: T.textMuted }}>
                      HEIC
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm" style={{ color: T.text }}>
                    {logo.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setLogo(null)}
                    aria-label="Remove logo"
                    className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/[0.08] outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                    style={{ color: T.textSecondary }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <FileDrop compact multiple={false} accept={IMAGE_ACCEPT} onFiles={pickLogo} title="Choose a logo" hint="A square PNG or JPG looks best." />
              )}
            </div>
            {(primary !== initialPrimary || secondary !== initialSecondary) && (
              <button
                type="button"
                onClick={() => {
                  setPrimary(initialPrimary);
                  setSecondary(initialSecondary);
                }}
                className="self-start rounded-lg px-2 py-1 text-xs font-medium underline underline-offset-2 transition hover:bg-white/[0.06] outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                style={{ color: T.textSecondary }}
              >
                Back to current colors
              </button>
            )}
          </div>
        )}

        {/* Message */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between text-xs font-medium" style={{ color: T.textMuted }}>
            Message
            {message.length > CHANGE_REQUEST_LIMITS.maxMessageChars - 400 && (
              <span className="tabular-nums" style={{ color: tooLong ? T.error : T.textMuted }}>
                {message.length} / {CHANGE_REQUEST_LIMITS.maxMessageChars}
              </span>
            )}
          </span>
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={PLACEHOLDER[section]} rows={4} />
        </label>

        {/* Attachments */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: T.textMuted }}>
            Pictures{" "}
            <span className="font-normal">
              ({files.length} of {maxAttachments}, up to 5 MB each)
            </span>
          </span>
          {files.length < maxAttachments && (
            <FileDrop accept={IMAGE_ACCEPT} onFiles={addFiles} hint="PNG, JPG, WebP or HEIC." />
          )}
          {fileErrors.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs" style={{ color: "#FCA5A5" }} role="alert">
              {fileErrors.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
          {files.length > 0 && (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {files.map((f, i) => {
                const url = fileUrls.get(f);
                return (
                  <li key={`${f.name}-${f.size}-${i}`} className="relative overflow-hidden rounded-xl border" style={{ borderColor: T.glassBorder }}>
                    {url && !HEIC_PREVIEW.test(f.type) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local blob: preview
                      <img src={url} alt={f.name} className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center text-[10px]" style={{ background: "rgba(255,255,255,0.05)", color: T.textMuted }}>
                        HEIC
                      </div>
                    )}
                    <span className="block truncate px-1.5 py-1 text-[10px]" style={{ color: T.textMuted }}>
                      {prettyBytes(f.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((x) => x !== f))}
                      aria-label={`Remove ${f.name}`}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  );
}
