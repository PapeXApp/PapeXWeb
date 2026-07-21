// app/r/ui.tsx
//
// Presentational pieces for the RDH receipt web fallback. Plain Tailwind
// (slate + the site's orange accent) matching the established pattern for
// this repo's other single-purpose linked pages (see
// app/invite/[token]/page.tsx) rather than the unwired shadcn primitives in
// components/ui/* (those reference bg-card/bg-muted CSS vars that aren't
// defined in app/globals.css or tailwind.config.ts).
//
// All server components — no interactivity here except RetryButton, which
// is its own "use client" island.

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import type { ReceiptLine } from "@/lib/escpos";

const APP_STORE_URL = "https://apps.apple.com/us/app/papex/id6754945242";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center gap-2 px-5 pb-2 pt-6">
        <span className="font-barlow text-lg font-medium tracking-tight text-slate-900">
          papex
        </span>
        <span className="h-[7px] w-[7px] rounded-sm bg-orange" aria-hidden />
        <span className="ml-auto text-xs font-medium uppercase tracking-wide text-slate-400">
          Receipt
        </span>
      </header>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-2">{children}</div>
    </main>
  );
}

export function StateCard({
  icon,
  title,
  message,
  children,
}: {
  icon: "warning" | "clock";
  title: string;
  message: string;
  children?: ReactNode;
}) {
  const Icon = icon === "clock" ? Clock : AlertTriangle;
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Icon className="h-6 w-6 text-slate-400" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 max-w-xs text-sm text-slate-500">{message}</p>
      {children}
    </div>
  );
}

export function AppCta({ isAndroid }: { isAndroid: boolean }) {
  if (isAndroid) {
    return (
      <p className="mt-10 text-center text-xs text-slate-400">
        PapeX for Android isn&apos;t available yet.{" "}
        <Link href="/waitlist" className="font-medium text-orange underline underline-offset-2">
          Join the waitlist
        </Link>{" "}
        to hear when it lands.
      </p>
    );
  }
  return (
    <p className="mt-10 text-center text-xs text-slate-400">
      <Link href={APP_STORE_URL} className="font-medium text-orange underline underline-offset-2">
        Get the PapeX app
      </Link>{" "}
      to save every receipt automatically.
    </p>
  );
}

function styleClasses(style: ReceiptLine["style"]): string {
  const classes: string[] = [];
  if (style.doubleHeight && style.doubleWidth) classes.push("text-lg");
  else if (style.doubleHeight || style.doubleWidth) classes.push("text-base");
  else if (style.fontB) classes.push("text-[11px]");
  else classes.push("text-[13px]");
  if (style.bold) classes.push("font-bold");
  if (style.underline) classes.push("underline underline-offset-2");
  return classes.join(" ");
}

function alignClass(align: ReceiptLine["align"]): string {
  switch (align) {
    case "center":
      return "text-center";
    case "right":
      return "text-right";
    default:
      return "text-left";
  }
}

export function ReceiptCard({
  lines,
  merchantName,
}: {
  lines: ReceiptLine[];
  merchantName?: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-slate-900">
          {merchantName ?? "Your receipt"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s the receipt from your tap.
        </p>
      </div>
      <div className="flex-1 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="font-mono leading-relaxed text-slate-700">
          {lines.map((line, i) => (
            <div key={i} className={`whitespace-pre ${alignClass(line.align)} ${styleClasses(line.style)}`}>
              {line.text.length === 0 ? " " : line.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
