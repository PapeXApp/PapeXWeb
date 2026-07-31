import { cn } from "@/lib/utils";
import type { ReceiptData } from "./content";
import styles from "./customer.module.css";

interface ReceiptCardProps {
  data: ReceiptData;
  /** Loop the 5.2s materialize/hold/dismiss cycle (hero + how-it-works only render it once, statically). */
  loop?: boolean;
  showActions?: boolean;
  className?: string;
}

/**
 * The Blue Bottle Coffee receipt — the core visual motif, reused inside the
 * hero phone and the "how it works" pinned sequence. Styled in real detail
 * per the design spec (not a placeholder).
 */
export function ReceiptCard({ data, loop = false, showActions = false, className }: ReceiptCardProps) {
  return (
    <div
      className={cn("rounded-2xl bg-white", loop && styles.receiptCard, className)}
      style={{
        padding: "18px 16px",
        boxShadow: "0 10px 30px rgba(0,18,29,.1)",
      }}
    >
      <div
        className="flex items-baseline justify-between"
        style={{ borderBottom: "1.5px dashed #d8d8d8", paddingBottom: 11, marginBottom: 12 }}
      >
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--navy)" }}>
            {data.merchant}
          </div>
          <div style={{ fontSize: 10.5, color: "#9a9a9a", marginTop: 2 }}>{data.dateLabel}</div>
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--orange)",
            border: "1px solid var(--orange)",
            borderRadius: 5,
            padding: "3px 6px",
            letterSpacing: ".04em",
          }}
        >
          {data.statusChip}
        </div>
      </div>
      {data.items.map((item) => (
        <div
          key={item.label}
          className="flex justify-between"
          style={{ fontSize: 12, color: "#4a4a4a", marginBottom: 8 }}
        >
          <span>{item.label}</span>
          <span>{item.amount}</span>
        </div>
      ))}
      <div
        className="flex justify-between"
        style={{
          borderTop: "1.5px solid var(--navy)",
          paddingTop: 11,
          marginTop: 4,
          fontWeight: 700,
          fontSize: 15,
          color: "var(--navy)",
        }}
      >
        <span>Total</span>
        <span>{data.total}</span>
      </div>
      {showActions ? (
        <div className="flex" style={{ marginTop: 14, gap: 8 }}>
          <div
            className="flex-1 text-center"
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--orange)",
              background: "rgba(235,113,0,.1)",
              borderRadius: 8,
              padding: "7px 0",
            }}
          >
            Save
          </div>
          <div
            className="flex-1 text-center"
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#4a4a4a",
              background: "#f0f0f0",
              borderRadius: 8,
              padding: "7px 0",
            }}
          >
            Share
          </div>
        </div>
      ) : null}
    </div>
  );
}
