// app/r/cards/Barcode.tsx
//
// A scannable barcode as inline SVG, drawn from lib/cards/barcode.ts's module
// row. The value only ever feeds the encoder (numbers out) and a text node
// (escaped by React); no markup is built from it. The caller encodes (inside
// CardList's guard), so a value the encoder rejects drops the whole card
// rather than leaving a voucher with a hole where its barcode was.

import { barRuns, type BarcodeModules } from "@/lib/cards/barcode";
import styles from "./cards.module.css";
import { VOUCHER_INK } from "./shared";

const BAR_HEIGHT = 56;

export function Barcode({ barcode, text }: { barcode: BarcodeModules; text: string }) {
  const { modules } = barcode;
  const runs = barRuns(modules);
  return (
    <div className={`${styles.barcodePlate} px-3 pb-2 pt-3`}>
      <svg
        viewBox={`0 0 ${modules.length} ${BAR_HEIGHT}`}
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="block h-16 w-full"
        role="img"
        aria-label={`Barcode ${text}`}
      >
        {runs.map(([x, width]) => (
          <rect key={x} x={x} y={0} width={width} height={BAR_HEIGHT} fill={VOUCHER_INK} />
        ))}
      </svg>
      <p className="mt-1 text-center font-mono text-xs tracking-[2px]" style={{ color: VOUCHER_INK }}>
        {text}
      </p>
    </div>
  );
}
