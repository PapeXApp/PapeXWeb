"use client";

// app/merchant/profile/RequestsList.tsx
//
// "Your requests": every change request this login has sent, newest first,
// with its status, what it was about, a message excerpt, thumbnails, and
// PapeX's note when there is one.

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import type { ChangeRequest } from "@/lib/changeRequests/types";
import { Card, StatusPill } from "../ui/primitives";
import { T } from "../ui/tokens";
import { ACTION_LABEL, Lightbox, SECTION_META, Swatch, Thumb, formatDate, relativeTime } from "./shared";

const EXCERPT = 180;
const MAX_LABELS = 6;

function RequestRow({ req }: { req: ChangeRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const long = req.message.length > EXCERPT;
  const labels = req.itemLabels ?? [];
  const images = (req.attachments ?? []).map((a) => ({ src: a.url, name: a.name }));
  const section = SECTION_META[req.section] ?? SECTION_META.other;

  return (
    <li className="flex flex-col gap-2.5 border-b py-4 first:pt-0 last:border-0 last:pb-0" style={{ borderColor: T.divider }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <StatusPill status={req.status} />
          <span className="text-sm font-medium" style={{ color: T.text }}>
            {section.label}
          </span>
          <span className="text-sm" style={{ color: T.textMuted }}>
            · {ACTION_LABEL[req.action] ?? req.action}
          </span>
        </div>
        <time dateTime={req.createdAt} title={formatDate(req.createdAt)} className="text-xs" style={{ color: T.textMuted }}>
          Sent {relativeTime(req.createdAt)}
        </time>
      </div>

      {labels.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {labels.slice(0, MAX_LABELS).map((l, i) => (
            <li key={i} className="rounded-full px-2.5 py-0.5 text-xs" style={{ background: "rgba(255,255,255,0.06)", color: T.textSecondary }}>
              {l}
            </li>
          ))}
          {labels.length > MAX_LABELS && (
            <li className="px-1 py-0.5 text-xs" style={{ color: T.textMuted }}>
              +{labels.length - MAX_LABELS} more
            </li>
          )}
        </ul>
      )}

      {req.message && (
        <div className="text-sm leading-relaxed" style={{ color: T.textSecondary }}>
          <p className="whitespace-pre-line break-words">{expanded || !long ? req.message : `${req.message.slice(0, EXCERPT).trimEnd()}…`}</p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 rounded text-xs font-medium underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-[#FB8500]/70"
              style={{ color: T.textSecondary }}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {req.proposedColors && (req.proposedColors.primary || req.proposedColors.secondary) && (
        <div className="flex flex-wrap gap-4">
          {req.proposedColors.primary && <Swatch label="New primary" hex={req.proposedColors.primary} />}
          {req.proposedColors.secondary && <Swatch label="New secondary" hex={req.proposedColors.secondary} />}
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

      {req.adminNote && (
        <div className="flex gap-2.5 rounded-2xl border px-3.5 py-2.5" style={{ borderColor: "rgba(251,133,0,0.25)", background: "rgba(251,133,0,0.06)" }}>
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" style={{ color: T.orange }} strokeWidth={2} />
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: T.orange }}>
              Note from PapeX
            </p>
            <p className="mt-0.5 whitespace-pre-line break-words text-sm" style={{ color: T.text }}>
              {req.adminNote}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}

export function RequestsList({ requests }: { requests: ChangeRequest[] }) {
  if (requests.length === 0) {
    return (
      <Card>
        <p className="text-sm" style={{ color: T.textSecondary }}>
          No requests yet. Use Request a change on any section and it will show up here.
        </p>
      </Card>
    );
  }
  const sorted = [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <Card>
      <ul className="flex flex-col">
        {sorted.map((r) => (
          <RequestRow key={r.id} req={r} />
        ))}
      </ul>
    </Card>
  );
}
