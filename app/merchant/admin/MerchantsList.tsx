"use client";

// app/merchant/admin/MerchantsList.tsx
//
// Every merchant record, for PapeX staff: logo, name, last updated, open
// request count. A row opens that merchant's editor.

import { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { MerchantSummary } from "@/lib/merchantProfiles/types";
import { Card, EmptyState, Input } from "../ui/primitives";
import { T } from "../ui/tokens";
import { AppIconTile, formatDateTime, relativeTime } from "../profile/shared";

export function MerchantsList({ merchants, onOpen }: { merchants: MerchantSummary[]; onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? merchants.filter((m) => m.name.toLowerCase().includes(needle) || m.id.toLowerCase().includes(needle)) : merchants;
    return [...list].sort((a, b) => b.openRequests - a.openRequests || a.name.localeCompare(b.name));
  }, [merchants, q]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: T.textMuted }} />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search merchants" aria-label="Search merchants" className="w-full pl-9" />
      </div>

      {shown.length === 0 ? (
        <EmptyState title={q ? "No matches" : "No merchants yet"} message={q ? "Try a different name or id." : "Merchant records show up here once they exist."} />
      ) : (
        <Card className="overflow-hidden !p-0">
          <ul>
            {shown.map((m) => (
              <li key={m.id} className="border-b last:border-0" style={{ borderColor: T.divider }}>
                <button
                  type="button"
                  onClick={() => onOpen(m.id)}
                  className="flex w-full items-center gap-3.5 px-4 py-3 text-left transition hover:bg-white/[0.04] active:bg-white/[0.06] outline-none focus-visible:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FB8500]/70 md:px-5"
                >
                  <AppIconTile name={m.name} logoUrl={m.logoUrl} brandColor={m.brandColor} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium" style={{ color: T.text }}>
                      {m.name}
                    </span>
                    <span className="block truncate text-xs" style={{ color: T.textMuted }}>
                      <span className="font-mono">{m.id}</span>
                      <span title={formatDateTime(m.updatedAt)}> · updated {relativeTime(m.updatedAt) || "never"}</span>
                    </span>
                  </span>
                  {m.openRequests > 0 ? (
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" style={{ background: T.orangeDim, color: T.orange }}>
                      {m.openRequests} open
                    </span>
                  ) : (
                    <span className="hidden shrink-0 text-xs sm:inline" style={{ color: T.textMuted }}>
                      No open requests
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 shrink-0" style={{ color: T.textMuted }} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
