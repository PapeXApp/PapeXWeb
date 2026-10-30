"use client";

// app/merchant/receipts/OfferEditor.tsx
//
// One offer. Each control writes one field of the config's offer template or
// card (lib/merchantReceipts/draft.ts); there's nothing here the server
// wouldn't store. Codes other than a single static one (per-receipt templates,
// pools) are set up by PapeX and show as read-only.

import { useId, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Trash2 } from "lucide-react";
import { Button, Card, Chip, Input, Select, Textarea } from "../ui/primitives";
import { T } from "../ui/tokens";
import { offerName, type OfferDraft } from "@/lib/merchantReceipts/draft";
import type { PlainIssue } from "@/lib/merchantReceipts/plainLanguage";
import { LIVE_SURFACES, type ConfigRedemption, type LiveSurface, type OfferTemplate } from "@/lib/merchantReceipts/types";
import { SURFACE_COPY } from "./copy";
import { Field, FieldError, Switch } from "./controls";

type RedemptionKind = "code" | "qr" | "code128" | "none" | "other";

function kindOf(r: ConfigRedemption | undefined): RedemptionKind {
  if (!r) return "none";
  if (r.type === "code") return "code";
  if (r.symbology === "qr" || r.symbology === "code128") return r.symbology;
  return "other";
}

function staticValue(r: ConfigRedemption | undefined): string {
  return r?.code.mode === "static" ? r.code.value : "";
}

function withKind(template: OfferTemplate, kind: RedemptionKind): OfferTemplate {
  const value = staticValue(template.redemption) || "SAVE10";
  const caption = template.redemption?.caption;
  const common = { code: { mode: "static" as const, value }, ...(caption ? { caption } : {}) };
  if (kind === "none") {
    const rest = { ...template };
    delete rest.redemption;
    return rest;
  }
  if (kind === "code") return { ...template, redemption: { type: "code", ...common } };
  if (kind === "qr" || kind === "code128") {
    return { ...template, redemption: { type: "barcode", symbology: kind, text: value, ...common } };
  }
  return template;
}

function withCode(template: OfferTemplate, value: string): OfferTemplate {
  const r = template.redemption;
  if (!r) return template;
  const next = { ...r, code: { mode: "static" as const, value } } as ConfigRedemption;
  // The text under a QR or barcode is the code itself.
  if (next.type === "barcode") next.text = value;
  return { ...template, redemption: next };
}

export function OfferEditor({
  offer,
  issues,
  disabled,
  index,
  count,
  initiallyOpen,
  onChange,
  onMove,
  onDelete,
}: {
  offer: OfferDraft;
  issues: PlainIssue[];
  disabled: boolean;
  index: number;
  count: number;
  initiallyOpen: boolean;
  onChange: (next: OfferDraft) => void;
  onMove: (delta: number) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const baseId = useId();
  const t = offer.template;
  const setTemplate = (patch: Partial<OfferTemplate>) => onChange({ ...offer, template: { ...t, ...patch } });
  const errorFor = (field: string) => issues.find((i) => i.field === field)?.text;
  const kind = kindOf(t.redemption);
  const codeEditable = kind === "none" || t.redemption?.code.mode === "static";
  const usesDays = t.validity.expiresOn === undefined;
  const hasIssue = issues.length > 0;
  const code = staticValue(t.redemption);
  const summary = [offerName(offer), code || (kind === "none" ? "No code" : "Unique codes")].join(" · ");

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
            <span className="font-barlow block truncate text-base font-medium" style={{ color: offer.on ? T.text : T.textMuted }}>
              {summary}
            </span>
            {hasIssue && !open && (
              <span className="block text-xs" style={{ color: "#FCA5A5" }}>
                Needs a fix before publishing
              </span>
            )}
          </span>
        </button>
        <Switch checked={offer.on} disabled={disabled} label={`${offerName(offer)} on or off`} onChange={(on) => onChange({ ...offer, on })} />
      </div>

      {open && (
        <div id={`${baseId}-body`} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="The deal" htmlFor={`${baseId}-value`} hint="Set large on the voucher." error={errorFor("valueLabel")}>
              <Input id={`${baseId}-value`} disabled={disabled} value={t.valueLabel} onChange={(e) => setTemplate({ valueLabel: e.target.value })} />
            </Field>
            <Field label="Word after the deal" htmlFor={`${baseId}-suffix`} error={errorFor("valueSuffix")}>
              <Input id={`${baseId}-suffix`} disabled={disabled} value={t.valueSuffix ?? ""} onChange={(e) => setTemplate({ valueSuffix: e.target.value })} />
            </Field>
            <Field label="Label above the deal" htmlFor={`${baseId}-kicker`} error={errorFor("kicker")}>
              <Input id={`${baseId}-kicker`} disabled={disabled} value={t.kicker ?? ""} onChange={(e) => setTemplate({ kicker: e.target.value })} />
            </Field>
            <Field label="Line under the deal" htmlFor={`${baseId}-qualifier`} error={errorFor("qualifier")}>
              <Input id={`${baseId}-qualifier`} disabled={disabled} value={t.qualifier ?? ""} onChange={(e) => setTemplate({ qualifier: e.target.value })} />
            </Field>
          </div>

          <Field label="Heading above the voucher" htmlFor={`${baseId}-heading`} error={errorFor("heading")}>
            <Input id={`${baseId}-heading`} disabled={disabled} value={offer.heading} onChange={(e) => onChange({ ...offer, heading: e.target.value })} />
          </Field>
          <Field label="Offer description" htmlFor={`${baseId}-title`} error={errorFor("title")}>
            <Textarea id={`${baseId}-title`} disabled={disabled} rows={2} className="!min-h-[64px]" value={t.title} onChange={(e) => setTemplate({ title: e.target.value })} />
          </Field>
          <Field label="Terms" htmlFor={`${baseId}-terms`} error={errorFor("terms")}>
            <Textarea id={`${baseId}-terms`} disabled={disabled} rows={3} value={t.terms ?? ""} onChange={(e) => setTemplate({ terms: e.target.value })} />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="How they redeem it" htmlFor={`${baseId}-kind`}>
              <Select
                id={`${baseId}-kind`}
                disabled={disabled || !codeEditable}
                value={kind}
                onChange={(e) => onChange({ ...offer, template: withKind(t, e.target.value as RedemptionKind) })}
              >
                <option value="code">Code to show</option>
                <option value="qr">QR code</option>
                <option value="code128">Barcode</option>
                <option value="none">No code</option>
                {kind === "other" && <option value="other">Set up by PapeX</option>}
              </Select>
            </Field>
            {kind !== "none" && (
              <Field label="The code" htmlFor={`${baseId}-code`} error={errorFor("code")}>
                {codeEditable ? (
                  <Input id={`${baseId}-code`} disabled={disabled} value={code} className="font-mono" onChange={(e) => onChange({ ...offer, template: withCode(t, e.target.value) })} />
                ) : (
                  <p className="py-2.5 text-sm" style={{ color: T.textSecondary }}>
                    Each receipt gets its own code, set up by PapeX.
                  </p>
                )}
              </Field>
            )}
          </div>
          {t.redemption && (
            <Field label="Instruction above the code" htmlFor={`${baseId}-caption`} error={errorFor("redemption/caption")}>
              <Input
                id={`${baseId}-caption`}
                disabled={disabled}
                value={t.redemption.caption ?? ""}
                onChange={(e) => setTemplate({ redemption: { ...t.redemption!, caption: e.target.value } })}
              />
            </Field>
          )}
          <p className="-mt-2 text-xs leading-relaxed" style={{ color: T.textMuted }}>
            PapeX shows this code to the customer. Set the same promotion up on your register so it accepts it.
          </p>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium" style={{ color: T.textSecondary }}>
              When it ends
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                selected={usesDays}
                disabled={disabled}
                onClick={() => setTemplate({ validity: { countdown: t.validity.countdown, hideWhenExpired: t.validity.hideWhenExpired, validForDays: t.validity.validForDays ?? 30 } })}
              >
                Days after purchase
              </Chip>
              <Chip
                selected={!usesDays}
                disabled={disabled}
                onClick={() => {
                  const d = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
                  setTemplate({ validity: { countdown: t.validity.countdown, hideWhenExpired: t.validity.hideWhenExpired, expiresOn: t.validity.expiresOn ?? d } });
                }}
              >
                On a date
              </Chip>
              {usesDays ? (
                <Input
                  aria-label="Days valid after purchase"
                  type="number"
                  min={1}
                  max={366}
                  disabled={disabled}
                  className="!w-24"
                  value={t.validity.validForDays ?? ""}
                  onChange={(e) => setTemplate({ validity: { ...t.validity, validForDays: e.target.value === "" ? 0 : Number(e.target.value) } })}
                />
              ) : (
                <Input
                  aria-label="Last valid day"
                  type="date"
                  disabled={disabled}
                  style={{ colorScheme: "dark" }}
                  value={t.validity.expiresOn ?? ""}
                  onChange={(e) => setTemplate({ validity: { ...t.validity, expiresOn: e.target.value } })}
                />
              )}
            </div>
            {errorFor("expiry") && <FieldError>{errorFor("expiry")}</FieldError>}
            <label className="mt-1 flex items-center gap-2 text-sm" style={{ color: T.textSecondary }}>
              <input
                type="checkbox"
                disabled={disabled}
                className="h-4 w-4 accent-[#FB8500]"
                checked={t.validity.countdown}
                onChange={(e) => setTemplate({ validity: { ...t.validity, countdown: e.target.checked } })}
              />
              Show a days-left chip on the voucher
            </label>
            <p className="text-xs" style={{ color: T.textMuted }}>
              Once it ends, the code disappears from the receipt.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium" style={{ color: T.textSecondary }}>
              Where it shows
            </span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Where it shows">
              {LIVE_SURFACES.map((s: LiveSurface) => (
                <Chip
                  key={s}
                  disabled={disabled || !offer.on}
                  selected={offer.surfaces.includes(s)}
                  onClick={() => onChange({ ...offer, surfaces: offer.surfaces.includes(s) ? offer.surfaces.filter((x) => x !== s) : [...offer.surfaces, s] })}
                >
                  {SURFACE_COPY[s].label}
                </Chip>
              ))}
            </div>
            {errorFor("audience") && <FieldError>{errorFor("audience")}</FieldError>}
          </div>

          {issues.filter((i) => !i.field).map((i) => (
            <FieldError key={i.text}>{i.text}</FieldError>
          ))}

          {!disabled && (
            <div className="flex flex-wrap items-center gap-1 border-t pt-3" style={{ borderColor: T.divider }}>
              <Button variant="ghost" className="!px-3 !py-1.5" disabled={index === 0} onClick={() => onMove(-1)}>
                <ArrowUp className="h-4 w-4" strokeWidth={2} />
                Show earlier
              </Button>
              <Button variant="ghost" className="!px-3 !py-1.5" disabled={index === count - 1} onClick={() => onMove(1)}>
                <ArrowDown className="h-4 w-4" strokeWidth={2} />
                Show later
              </Button>
              <Button variant="ghost" className="!px-3 !py-1.5 sm:ml-auto" onClick={onDelete}>
                <Trash2 className="h-4 w-4" strokeWidth={2} />
                Delete
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
