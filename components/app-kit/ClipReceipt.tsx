// ClipReceipt — the App Clip's receipt screen.
//
// Mirrors Papex_AppClip Sources/AppClip/ReceiptView.swift (loaded state), with
// every colour / spacing / radius / font face from the generated `clip`
// namespace (PapeXTheme.swift → lib/app-kit/tokens.ts → tokens.css
// [data-app-kit-clip]):
//   PapeXBackground      navy + two orange radial glows (--akc-background)
//   TopBar               44pt back circle · PapeX lockup capsule (22pt, 18pt
//                        side padding) · 44pt ••• circle; padding h sm, top xs
//   content              VStack spacing md, padding h md, top Chrome.top (74),
//                        bottom Chrome.bottom (132)
//   MerchantHeaderView   glassCard(padding 22, edge standardOutline): 62/56pt
//                        orange-ringed monogram + name 24 medium; hairline
//                        white .10; address 14 secondary; dateline 13 orange
//   SectionHeader        20 medium orange
//   ItemsCard            glassCard(padding 0, edge standardOutline), rows 14 v
//                        padding, hairline between rows
//   TotalsCardView       glassCard(padding 0, edge orange): Subtotal / Tax /
//                        2pt orange .48 rule / Total 24 bold orange + 28 medium /
//                        Payment
//   FooterCTA            bubble(r 34) padding 14: "Save to PapeX" 52pt capsule
//                        (F5851C→orange) + 52pt share circle; subtext 12 muted
// The SwiftUI LAYOUT literals (62, 56, 22, 17, 14, 52, 34, 74, 132…) live in
// ReceiptView.swift's view bodies, not in PapeXTheme, so they are ported by
// hand here and cited; the TOKENS are generated.

import type { CSSProperties, ReactNode } from 'react';
import { clip } from '@/lib/app-kit/tokens';
import s from './appKit.module.css';
import { StatusBar } from './primitives';
import { pt } from './rnStyle';

export interface ClipReceiptData {
  merchantName: string;
  addressLines?: string[];
  dateline?: string;
  items: { label: string; quantity: number; amount: number; sku?: string }[];
  subtotal?: number;
  tax?: number;
  total: number;
  payment?: string;
}

const money = (v: number) => (v < 0 ? `-$${Math.abs(v).toFixed(2)}` : `$${v.toFixed(2)}`); // PXFormat.money
const W: Record<string, number> = { regular: 400, medium: 500, semibold: 600, bold: 700 };
const f = (size: number, weight: keyof typeof W = 'regular'): CSSProperties => ({ fontFamily: 'var(--akc-font)', fontSize: pt(size), fontWeight: W[weight], lineHeight: 1.2 });
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ');

/** `.glassCard(padding:, edge:)` — GlassCardModifier. */
function ClipCard({ children, padding, edge = clip.color.orange, style }: { children: ReactNode; padding: number; edge?: string; style?: CSSProperties }) {
  return (
    <div style={{ position: 'relative', padding: pt(padding), borderRadius: 'var(--akc-radius-card)', background: 'var(--akc-card-fill)', ...style }}>
      {children}
      <div className={s.maskRing} style={{ padding: `max(1px, var(--akc-rim-width))`, background: 'var(--akc-rim)', ['--akc-rim-rgb' as string]: hexRgb(edge) } as CSSProperties} />
    </div>
  );
}

/** `.bubble(shape)` — iOS 26 `.glassEffect(.clear)`; web approximation. */
function Bubble({ children, radius, style }: { children: ReactNode; radius: number | string; style?: CSSProperties }) {
  return (
    <div className={s.liquid} style={{ borderRadius: typeof radius === 'number' ? pt(radius) : radius, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      {children}
    </div>
  );
}

export function ClipReceipt({ data, statusBar = true, footer = true, style }: { data: ClipReceiptData; statusBar?: boolean; footer?: boolean; style?: CSSProperties }) {
  const c = clip.color;
  const sp = clip.spacing;
  const insetTop = 59; // device safe area (iPhone 15/16)
  const subtotal = data.subtotal ?? data.items.reduce((sum, i) => sum + i.amount * i.quantity, 0);
  const taxLabel = data.tax && subtotal > 0 ? `Tax (${((data.tax / subtotal) * 100).toFixed(1)}%)` : 'Tax';
  const initial = data.merchantName.trim().charAt(0).toUpperCase() || 'P';
  return (
    <div data-app-kit-clip="" className={s.screen} style={{ background: 'var(--akc-background)', color: c.textPrimary, ...style }}>
      {/* content */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: pt(insetTop + 74), padding: `0 ${pt(sp.md)}`, display: 'flex', flexDirection: 'column', gap: pt(sp.md) }}>
        <ClipCard padding={22} edge={c.standardOutline}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: pt(17) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: pt(sp.sm) }}>
              <div style={{ position: 'relative', width: pt(62), height: pt(62), borderRadius: '50%', background: c.orange, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: pt(56), height: pt(56), borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.navy, ...f(26, 'bold') }}>{initial}</div>
              </div>
              <div style={{ ...f(24, 'medium'), color: c.textPrimary }}>{data.merchantName}</div>
            </div>
            {data.dateline || data.addressLines?.length ? (
              <>
                <div style={{ height: 'max(1px, calc(1 * var(--pt)))', background: 'rgba(255,255,255,0.10)' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: pt(sp.xs), textAlign: 'center' }}>
                  {data.addressLines?.length ? <div style={{ ...f(14), color: c.textSecondary }}>{data.addressLines.join(', ')}</div> : null}
                  {data.dateline ? <div style={{ ...f(13), color: c.orange }}>{data.dateline}</div> : null}
                </div>
              </>
            ) : null}
          </div>
        </ClipCard>

        <div style={{ ...f(20, 'medium'), color: c.orange }}>Items Purchased</div>
        <ClipCard padding={0} edge={c.standardOutline} style={{ padding: `0 ${pt(sp.md - 2)}` }}>
          {data.items.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: pt(sp.sm), padding: `${pt(14)} 0`, borderBottom: i < data.items.length - 1 ? `max(1px, calc(1 * var(--pt))) solid ${c.hairline}` : undefined }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...f(16), color: c.textPrimary }}>{it.label}</div>
                {it.sku ? <div style={{ ...f(12), color: c.textMuted }}>{it.sku}</div> : null}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: pt(4) }}>
                {it.quantity > 1 ? <div style={{ ...f(12), color: c.textMuted }}>×{it.quantity}</div> : null}
                <div style={{ ...f(16, 'medium'), color: c.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{money(it.amount)}</div>
              </div>
            </div>
          ))}
        </ClipCard>

        <ClipCard padding={0} edge={c.orange} style={{ padding: `${pt(6)} ${pt(sp.md)} ${pt(6 + sp.sm)}` }}>
          {[
            ['Subtotal', money(subtotal), c.textSecondary],
            ...(data.tax ? [[taxLabel, money(data.tax), c.textPrimary]] : []),
          ].map(([label, value, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: `${pt(sp.xs)} 0` }}>
              <span style={{ ...f(16), color: c.textSecondary }}>{label}</span>
              <span style={{ ...f(16, 'medium'), color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            </div>
          ))}
          <div style={{ height: pt(2), borderRadius: pt(1), background: `rgba(${hexRgb(c.orange)}, 0.48)`, margin: `${pt(4)} 0` }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${pt(sp.sm)} 0` }}>
            <span style={{ ...f(24, 'bold'), color: c.orange }}>Total</span>
            <span style={{ ...f(28, 'medium'), color: c.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{money(data.total)}</span>
          </div>
          {data.payment ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: pt(6) }}>
              <span style={{ ...f(16), color: c.textSecondary }}>Payment</span>
              <span style={{ ...f(16), color: c.textPrimary }}>{data.payment}</span>
            </div>
          ) : null}
        </ClipCard>
      </div>

      {/* TopBar */}
      <div style={{ position: 'absolute', left: pt(sp.sm), right: pt(sp.sm), top: pt(insetTop + sp.xs), display: 'flex', alignItems: 'center', gap: pt(sp.xs), zIndex: 5 }}>
        <Bubble radius="50%" style={{ width: pt(44), height: pt(44) }}>
          <Chevron />
        </Bubble>
        <div style={{ flex: 1 }} />
        <Bubble radius={999} style={{ height: pt(44), padding: `0 ${pt(18)}` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/app/kit/clip/papex-logo.png" alt="PapeX" style={{ height: pt(22), width: 'auto', display: 'block' }} />
        </Bubble>
        <div style={{ flex: 1 }} />
        <Bubble radius="50%" style={{ width: pt(44), height: pt(44) }}>
          <svg viewBox="0 0 24 24" style={{ width: pt(24), height: pt(24) }} aria-hidden>
            {[5, 12, 19].map((x) => (
              <circle key={x} cx={x} cy={12} r={1.8} fill={c.textPrimary} />
            ))}
          </svg>
        </Bubble>
      </div>

      {footer ? (
        <div style={{ position: 'absolute', left: pt(sp.sm), right: pt(sp.sm), bottom: pt(34 + sp.xs), zIndex: 5 }}>
          <Bubble radius={34} style={{ flexDirection: 'column', gap: pt(10), padding: pt(14) }}>
            <div style={{ display: 'flex', gap: pt(10), width: '100%' }}>
              <div style={{ flex: 1, height: pt(52), borderRadius: pt(26), background: `linear-gradient(180deg, #F5851C, ${c.orange})`, boxShadow: `0 ${pt(5)} ${pt(10)} rgba(${hexRgb(c.orange)}, 0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', ...f(18, 'semibold') }}>Save to PapeX</div>
              <div style={{ width: pt(52), height: pt(52), borderRadius: '50%', background: 'rgba(255,255,255,0.10)', border: `max(1px, calc(1 * var(--pt))) solid rgba(255,255,255,0.14)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box' }}>
                <ShareGlyph color={c.textPrimary} />
              </div>
            </div>
            <div style={{ ...f(12), color: c.textMuted, textAlign: 'center' }}>Get the app to save and organize every receipt</div>
          </Bubble>
        </div>
      ) : null}
      {statusBar ? <StatusBar color={c.textPrimary} /> : null}
    </div>
  );
}

/** SF Symbol `chevron.left` (24pt, medium) — system glyph, drawn as a path. */
function Chevron() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: pt(24), height: pt(24) }} aria-hidden>
      <path d="M15 5 L8 12 L15 19" fill="none" stroke={clip.color.textPrimary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
/** SF Symbol `square.and.arrow.up` (17pt) — system glyph, drawn as a path. */
function ShareGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: pt(19), height: pt(19) }} aria-hidden>
      <path d="M12 3v11M8 7l4-4 4 4M6 11H5v10h14V11h-1" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Invented demo receipt for the gallery (Nook Cafe — not a real merchant). */
export const demoClipReceipt: ClipReceiptData = {
  merchantName: 'Nook Cafe',
  addressLines: ['14 Alder Lane', 'Springvale'],
  dateline: 'Sep 24, 2026 · 8:42 AM',
  items: [
    { label: 'Oat latte', quantity: 1, amount: 5.25 },
    { label: 'Almond croissant', quantity: 1, amount: 4.75 },
    { label: 'Extra shot', quantity: 1, amount: 1.25 },
  ],
  subtotal: 11.25,
  tax: 1.15,
  total: 12.4,
  payment: 'Visa •••• 4417',
};
