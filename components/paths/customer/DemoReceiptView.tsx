import type { ReceiptLine } from "@/lib/escpos";
import {
  detectPaymentMethod,
  extractLastFour,
  hasStructure,
  PAYMENT_METHOD_STYLES,
  type ReceiptSummary,
} from "@/lib/receiptSummary";
import { demoContent } from "./content";
import styles from "./customer.module.css";

/**
 * Renders a decoded `ReceiptSummary` (see lib/receiptSummary.ts) inside the
 * hero's live demo, styled in the App Clip's OWN theme — deliberately not
 * this site's palette (navy card / orange). Verbatim App Clip tokens (see
 * design-prototype/NOTES.md → "It uses the app's palette, not the site's"):
 *   background #181A20   accent #FB8500   brand-blue #2B7FC6
 *   text #F4F4F4   secondary #C4C7CC   muted #9AA1A8
 * All values live in customer.module.css's `.ac*` rules — never hardcode a
 * hex here, and never swap these for --navy/--orange.
 *
 * `summary` is the output of `summarizeReceipt(parseEscPos(bytes).lines)` —
 * both real functions from this repo's lib/, not a re-implementation.
 */
export function DemoReceiptView({ summary }: { summary: ReceiptSummary }) {
  const money = (n: number) => (n < 0 ? "-$" : "$") + Math.abs(n).toFixed(2);

  const network = summary.paymentLine ? detectPaymentMethod(summary.paymentLine) : null;
  const lastFour = summary.paymentLine ? extractLastFour(summary.paymentLine) : null;
  const paymentStyle = network ? PAYMENT_METHOD_STYLES[network] : null;

  const taxLabel = (() => {
    if (summary.tax == null) return "Tax";
    if (!summary.subtotal) return "Tax";
    const rate = (summary.tax / summary.subtotal) * 100;
    if (Number.isFinite(rate) && rate > 0 && rate < 100) {
      return `Tax (${rate.toFixed(2).replace(/\.?0+$/, "")}%)`;
    }
    return "Tax";
  })();

  const monogram = (summary.merchantName || "?").trim().charAt(0).toUpperCase();

  return (
    <>
      {(summary.merchantName || summary.addressLines.length > 0) && (
        <div className={styles.acCard}>
          <div className={styles.acMerchant}>
            <span aria-hidden="true" className={styles.acMonoBadge}>
              {monogram}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              {summary.merchantName && <div className={styles.acMname}>{summary.merchantName}</div>}
              {summary.addressLines.map((line) => (
                <div key={line} className={styles.acMaddr}>
                  {line}
                </div>
              ))}
              {summary.dateline && <div className={styles.acMdate}>{summary.dateline}</div>}
              <div className={styles.acMsrc}>{demoContent.sourceLabel}</div>
            </div>
          </div>
        </div>
      )}

      {summary.items.length > 0 && (
        <div className={styles.acCard}>
          <div className={styles.acSectionTitle}>{demoContent.sectionTitles.items}</div>
          {summary.items.map((item, i) => (
            <div key={`${item.name}-${i}`} className={styles.acItem}>
              <div style={{ minWidth: 0 }}>
                <div className={styles.acItemName}>{item.name}</div>
                {item.qty > 1 && <div className={styles.acItemQty}>Qty {item.qty}</div>}
              </div>
              <div className={styles.acItemPrice}>{money(item.amount)}</div>
            </div>
          ))}
        </div>
      )}

      {(summary.subtotal != null || summary.tax != null || summary.total != null || summary.paymentLine) && (
        <div className={styles.acCard}>
          {summary.subtotal != null && (
            <div className={styles.acTrow}>
              <span className={styles.acTlabel}>Subtotal</span>
              <span className={`${styles.acTval} ${styles.acTvalBrand}`}>{money(summary.subtotal)}</span>
            </div>
          )}
          {summary.tax != null && (
            <div className={styles.acTrow}>
              <span className={styles.acTlabel}>{taxLabel}</span>
              <span className={styles.acTval}>{money(summary.tax)}</span>
            </div>
          )}
          {summary.tip != null && (
            <div className={styles.acTrow}>
              <span className={styles.acTlabel}>Tip</span>
              <span className={styles.acTval}>{money(summary.tip)}</span>
            </div>
          )}
          {summary.discount != null && (
            <div className={styles.acTrow}>
              <span className={styles.acTlabel}>Discount</span>
              <span className={styles.acTval}>{money(-Math.abs(summary.discount))}</span>
            </div>
          )}
          {summary.total != null && (
            <>
              <div className={styles.acTrule} />
              <div className={styles.acTrow}>
                <span className={styles.acGrandLabel}>Total</span>
                <span className={styles.acGrandVal}>{money(summary.total)}</span>
              </div>
            </>
          )}
          {summary.paymentLine && (
            <div className={styles.acTrow}>
              <span className={styles.acTlabel}>Payment</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {paymentStyle && (
                  <span
                    className={styles.acChip}
                    style={{ background: paymentStyle.bg, color: paymentStyle.textColor }}
                  >
                    {paymentStyle.label}
                  </span>
                )}
                {lastFour && <span className={styles.acTval}>•••• {lastFour}</span>}
                {!paymentStyle && !lastFour && <span className={styles.acTval}>{summary.paymentLine}</span>}
              </span>
            </div>
          )}
        </div>
      )}

      <div className={styles.acCard}>
        <div className={styles.acSectionTitle}>{demoContent.sectionTitles.info}</div>
        {summary.dateline && (
          <div className={styles.acInforow}>
            <span className={styles.acInfolabel}>Date</span>
            <span className={styles.acInfoval}>{summary.dateline}</span>
          </div>
        )}
        <div className={styles.acInforow}>
          <span className={styles.acInfolabel}>Source</span>
          <span className={styles.acInfoval}>{demoContent.infoSourceLabel}</span>
        </div>
      </div>

      <div className={styles.acCard}>
        <details className={styles.acOrig} open={!hasStructure(summary)}>
          <summary>
            <span>{demoContent.sectionTitles.original}</span>
            <span aria-hidden="true" className={styles.acChev}>
              ▾
            </span>
          </summary>
          <div className={styles.acBody}>
            {summary.bodyLines.map((l, i) => (
              <div key={i} className={lineClassName(l)}>
                {l.text.length ? l.text : " "}
              </div>
            ))}
          </div>
        </details>
      </div>
    </>
  );
}

// One size class only — mirrors the else-if chain in PapeXWeb/app/r/ui.tsx's
// styleClasses(), a deliberate duplication for this differently-styled render
// target (never additive: doubleHeight+doubleWidth wins over fontB, etc).
function lineClassName(line: ReceiptLine): string {
  const classes = [styles.acLine];
  const st = line.style;
  if (st.doubleHeight && st.doubleWidth) classes.push(styles.acLineLg);
  else if (st.doubleHeight || st.doubleWidth) classes.push(styles.acLineMd);
  else if (st.fontB) classes.push(styles.acLineFb);
  if (st.bold) classes.push(styles.acLineB);
  if (st.underline) classes.push(styles.acLineU);
  if (line.align === "center") classes.push(styles.acAlCenter);
  else if (line.align === "right") classes.push(styles.acAlRight);
  return classes.join(" ");
}
