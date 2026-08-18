"use client";

// app/merchant/devices/page.tsx
//
// Device health (PRD §5.5) — "merchants' biggest fear with the box is
// silent failure; this is cheap reassurance." Per-device last-upload-seen
// timestamp + an OK / stale / never-uploaded indicator. All fields already
// exist on `.meta` per the PRD's "what exists today" table, so this is a
// thin read, not new backend surface.

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { useMerchantAuth } from "../AuthContext";
import { listDevices, type MerchantDevice } from "@/lib/merchantApi";
import { Card, DeviceStatusPill, LoadingBlock, ErrorBanner, EmptyState } from "../ui/primitives";
import { T } from "../ui/tokens";

function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DevicesPage() {
  const { getIdToken } = useMerchantAuth();
  const [devices, setDevices] = useState<MerchantDevice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      const token = await getIdToken();
      if (!token) return;
      try {
        const d = await listDevices(token);
        if (!cancelled) setDevices(d);
      } catch {
        if (!cancelled) setError("Couldn't load devices. Try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getIdToken]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-barlow text-2xl font-medium" style={{ color: T.text }}>
          Devices
        </h1>
        <p className="mt-1 text-sm" style={{ color: T.textSecondary }}>
          Your RDH boxes and when they last checked in.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      {devices === null && !error ? (
        <LoadingBlock label="Checking devices…" />
      ) : devices && devices.length === 0 ? (
        <EmptyState title="No devices registered" message="Contact PapeX support to link an RDH device to your account." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {devices?.map((d) => (
            <Card key={d.deviceId} className="flex items-center gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: T.orangeDim }}
              >
                <Radio className="h-5 w-5" style={{ color: T.orange }} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate font-barlow text-base font-medium" style={{ color: T.text }}>
                    {d.label}
                  </h2>
                  <DeviceStatusPill status={d.status} />
                </div>
                <p className="mt-0.5 text-xs" style={{ color: T.textMuted }}>
                  {d.deviceId} · last upload {relativeTime(d.lastUploadAt)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
