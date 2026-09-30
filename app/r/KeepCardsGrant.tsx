"use client";

// app/r/KeepCardsGrant.tsx (a client island, so it lives beside ReceiptUpgrade, not among the server-only card views)
//
// 1.7.1 (PapeX #27): renders nothing. Once, after mount, hands the RDH tap
// grant this render received to app/api/r/[sid]/cards-grant, which stores it
// in an httpOnly /r cookie. Only rendered when /r actually drew cards AND the
// cards service minted a NEW grant (the receipt is inside its tap window), so
// the person who tapped keeps their offer on a reload later today. Failure is
// silent: the offer is still on screen now, and nothing else depends on it.

import { useEffect } from "react";

export function KeepCardsGrant({ sid, grant }: { sid: string; grant: string }) {
  useEffect(() => {
    void fetch(`/api/r/${encodeURIComponent(sid)}/cards-grant`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant }),
      keepalive: true,
    }).catch(() => {});
  }, [sid, grant]);
  return null;
}
