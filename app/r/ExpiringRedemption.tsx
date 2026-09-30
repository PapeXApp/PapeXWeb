"use client";

// app/r/ExpiringRedemption.tsx (a client island, beside KeepCardsGrant: the
// card views under app/r/cards stay server-only)
//
// An offer's redemption (code / barcode / QR) is live only until
// validity.expiresAt. The server already strips it once expired; this island
// covers a page that stays open past the deadline. It re-checks the device
// clock on mount, on a timer set to the expiry instant, and whenever the page
// returns to view, and swaps the redemption for "Expired <date>". The
// redemption is REMOVED from the DOM, not hidden. Before any check (and in
// static markup) it renders its children unchanged, byte for byte.

import { useEffect, useState, type ReactNode } from "react";
import { isExpired, parseExpiresAt } from "@/lib/cards/countdown";
import { ExpiredNote } from "./cards/ExpiredNote";

const MAX_TIMEOUT_MS = 2_147_483_647;

export function ExpiringRedemption({ expiresAt, children }: { expiresAt: string; children: ReactNode }) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = () => {
      if (timer) clearTimeout(timer);
      if (isExpired(expiresAt, new Date())) {
        setExpired(true);
        return;
      }
      const exp = parseExpiresAt(expiresAt);
      if (exp == null) return;
      // nowSec > exp first holds 1s after expiresAt; +250ms of slack.
      const wait = Math.min(exp * 1000 + 1250 - Date.now(), MAX_TIMEOUT_MS);
      timer = setTimeout(check, Math.max(wait, 50));
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", check);
    window.addEventListener("focus", check);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", check);
      window.removeEventListener("focus", check);
    };
  }, [expiresAt]);
  return expired ? <ExpiredNote expiresAt={expiresAt} /> : <>{children}</>;
}
