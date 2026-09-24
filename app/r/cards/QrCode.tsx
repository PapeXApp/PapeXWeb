// app/r/cards/QrCode.tsx
//
// A scannable QR code as inline SVG, drawn from lib/cards/qr.ts's module
// matrix: dark ink on the same white plate as the 1-D barcodes, with the
// 4-module quiet zone the QR spec requires. The value only ever feeds the
// encoder (numbers out) and a text node (escaped by React); no markup is built
// from it. The caller encodes inside CardList's guard, so a value the encoder
// rejects drops the whole card. Server component: no client JS.

import { qrRuns, type QrModules } from "@/lib/cards/qr";
import styles from "./cards.module.css";
import { VOUCHER_INK } from "./shared";

const QUIET_ZONE = 4;

export function QrCode({ qr, text }: { qr: QrModules; text: string }) {
  const side = qr.size + QUIET_ZONE * 2;
  return (
    <div className={`${styles.barcodePlate} px-3 pb-2 pt-3`}>
      <svg
        viewBox={`0 0 ${side} ${side}`}
        shapeRendering="crispEdges"
        className="mx-auto block h-44 w-44"
        role="img"
        aria-label={`QR code ${text}`}
      >
        {qrRuns(qr).map(([x, y, width]) => (
          <rect key={`${x}-${y}`} x={x + QUIET_ZONE} y={y + QUIET_ZONE} width={width} height={1} fill={VOUCHER_INK} />
        ))}
      </svg>
      <p className="mt-1 break-all text-center font-mono text-xs tracking-[2px]" style={{ color: VOUCHER_INK }}>
        {text}
      </p>
    </div>
  );
}
