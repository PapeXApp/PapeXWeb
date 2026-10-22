// app/r/cards/ExpiredNote.tsx
//
// "Expired <date>", drawn in the place an expired offer's code/barcode/QR
// would have been. Server-safe (no directive) so both OfferCard (server) and
// the ExpiringRedemption island can use it.

import { formatExpired } from "@/lib/cards/countdown";
import { VOUCHER_INK_SOFT } from "./shared";

export function ExpiredNote({ expiresAt }: { expiresAt: string }) {
  return (
    <p className="mt-4 text-sm font-semibold" style={{ color: VOUCHER_INK_SOFT }}>
      {formatExpired(expiresAt)}
    </p>
  );
}
