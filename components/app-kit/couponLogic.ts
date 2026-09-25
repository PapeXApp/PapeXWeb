// Coupon presentation logic, PORTED LINE FOR LINE from PapeXV2 (these live
// inside component files, so the sync cannot vendor them whole):
//   deriveDealFigure       components/coupons/CouponArtwork.tsx
//   couponKindChipLabel    components/coupons/CouponRow.tsx
//   describeCouponExpiry   components/coupons/CouponRow.tsx
// Their constants come from the generated rnStyles (couponRow.consts).

import { rn } from '@/lib/app-kit/rnStyles';
import type { KitCoupon } from './sampleData';

const { DAY_MS, RELATIVE_DAY_LIMIT, URGENT_DAY_LIMIT, COUPON_KIND_META } = rn.couponRow.consts;
export { COUPON_KIND_META };

export function deriveDealFigure(coupon: Pick<KitCoupon, 'kind' | 'title'>): string {
  switch (coupon.kind) {
    case 'bogo':
      return 'BOGO';
    case 'freebie':
      return 'FREE';
    case 'percent': {
      const percent = /(\d{1,3})\s*%/.exec(coupon.title);
      return percent ? `${percent[1]}%` : '% OFF';
    }
    case 'dollar': {
      const dollars = /\$\s*(\d[\d,]*(?:\.\d{1,2})?)/.exec(coupon.title);
      if (dollars) return `$${dollars[1]}`;
      const cents = /(\d{1,3})\s*¢/.exec(coupon.title);
      if (cents) return `${cents[1]}¢`;
      return '$ OFF';
    }
  }
}

export function couponKindChipLabel(coupon: Pick<KitCoupon, 'kind' | 'title'>): string {
  const figure = deriveDealFigure(coupon);
  if (coupon.kind === 'percent' || coupon.kind === 'dollar') {
    return /OFF$/.test(figure) ? figure : `${figure} OFF`;
  }
  return figure;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export type CouponExpiryState = 'expired' | 'urgent' | 'normal';

export function describeCouponExpiry(expiresAt: string | undefined, nowMs: number): { text: string; state: CouponExpiryState } | null {
  if (!expiresAt) return null;
  const expiryMs = Date.parse(expiresAt);
  if (Number.isNaN(expiryMs)) return null;
  if (expiryMs <= nowMs) return { text: 'Expired', state: 'expired' };
  const days = Math.round((startOfDay(expiryMs) - startOfDay(nowMs)) / DAY_MS);
  if (days <= 0) return { text: 'Expires today', state: 'urgent' };
  if (days === 1) return { text: 'Expires tomorrow', state: 'urgent' };
  if (days <= URGENT_DAY_LIMIT) return { text: `Expires in ${days} days`, state: 'urgent' };
  if (days <= RELATIVE_DAY_LIMIT) return { text: `Expires in ${days} days`, state: 'normal' };
  // en-US pinned (the app uses the device locale) so server and client render the same text.
  const on = new Date(expiryMs).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { text: `Expires ${on}`, state: 'normal' };
}

/** CouponRow `termsLine`. */
export function couponTermsLine(coupon: KitCoupon): string | null {
  const parts = [
    coupon.code ? `Code ${coupon.code}` : null,
    coupon.inStoreOnly ? 'In-store only' : null,
    coupon.minSpend ? `Min. spend $${coupon.minSpend}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' • ') : null;
}
