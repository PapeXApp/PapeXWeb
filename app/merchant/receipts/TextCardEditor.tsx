"use client";

// app/merchant/receipts/TextCardEditor.tsx
//
// One of the store's notes: a card in the merchant's own words, like an About
// or a Coming soon. Each control writes one field of the config's text card
// (lib/merchantReceipts/draft.ts TextDraft); its icon and where it sits are set
// by PapeX and kept as they are. The limits are the schema's.

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, Input, Textarea } from "../ui/primitives";
import { T } from "../ui/tokens";
import type { TextDraft } from "@/lib/merchantReceipts/draft";
import type { PlainIssue } from "@/lib/merchantReceipts/plainLanguage";
import { Field, Switch } from "./controls";

export function TextCardEditor({
  note,
  issues,
  disabled,
  onChange,
}: {
  note: TextDraft;
  issues: PlainIssue[];
  disabled: boolean;
  onChange: (next: TextDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  const baseId = useId();
  const errorFor = (field: string) => issues.find((i) => i.field === field)?.text;
  const name = note.heading.trim() || note.title.trim() || "A note from your store";

  return (
    <Card className="flex flex-col gap-4 !p-4 sm:!p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`${baseId}-body`}
          className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:underline"
        >
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} style={{ color: T.textMuted }} strokeWidth={2} />
          <span className="min-w-0">
            <span className="font-barlow block truncate text-base font-medium" style={{ color: note.on ? T.text : T.textMuted }}>
              {name}
            </span>
            {issues.length > 0 && !open && (
              <span className="block text-xs" style={{ color: "#FCA5A5" }}>
                Needs a fix before publishing
              </span>
            )}
          </span>
        </button>
        <Switch checked={note.on} disabled={disabled} label={`${name} on or off`} onChange={(on) => onChange({ ...note, on })} />
      </div>

      {open && (
        <div id={`${baseId}-body`} className="flex flex-col gap-4">
          <Field label="Heading above the card" htmlFor={`${baseId}-heading`} error={errorFor("heading")}>
            <Input id={`${baseId}-heading`} disabled={disabled} maxLength={60} value={note.heading} onChange={(e) => onChange({ ...note, heading: e.target.value })} />
          </Field>
          <Field label="Title" htmlFor={`${baseId}-title`} error={errorFor("title")}>
            <Input id={`${baseId}-title`} disabled={disabled} maxLength={120} value={note.title} onChange={(e) => onChange({ ...note, title: e.target.value })} />
          </Field>
          <Field label="Message" htmlFor={`${baseId}-body-text`} hint="Up to 500 characters." error={errorFor("body")}>
            <Textarea
              id={`${baseId}-body-text`}
              disabled={disabled}
              rows={4}
              maxLength={500}
              value={note.body}
              onChange={(e) => onChange({ ...note, body: e.target.value })}
            />
          </Field>
        </div>
      )}
    </Card>
  );
}
