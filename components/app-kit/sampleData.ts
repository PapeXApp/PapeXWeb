// DEMO DATA for the app-kit mockups. Everything here is INVENTED: no real
// merchant, person, logo, domain or statistic. Field names follow PapeXV2's own
// types (`services/coupons/types.ts` Store/Coupon, `services/receiptDisplay.ts`
// DisplayReceipt) so the vendored helpers (storeTheme, brandContrast,
// receiptOrigin) read them unchanged.
//
// Copy rules this data follows (Nico, 2026-09): coupons are LIVE — a partner
// store can hand you one when you tap its PapeX device; everywhere else you
// scan the coupon you were given. Nothing is seeded onto a profile, and every
// coupon below is one the demo shopper has earned or scanned.

/** The demo "now": fixed so server and browser render identical expiry text. */
export const DEMO_NOW = Date.parse('2026-09-24T12:00:00');

export const DEMO_LABEL = 'Demo data — invented merchants and people';

export type ReceiptSource = 'rdh' | 'scanned' | 'email' | 'manual' | 'clover';

export interface KitLineItem {
  name: string;
  quantity: number;
  price: number;
}

export interface KitReceipt {
  id: string;
  merchantName: string;
  /** Logo image URL; null = the app's fallback (the PapeX mark). */
  logoUrl: string | null;
  amount: number | null;
  dateLabel: string;
  category: string;
  source: ReceiptSource;
  /** Provenance line, as `buildReceiptOriginSummary` words it. */
  originDetail: string;
  isSharedWithCurrentUser: boolean;
  isSharedByCurrentUser: boolean;
  /** false = unreviewed (orange top-left rim + orange dot). */
  reviewed: boolean;
  checked?: boolean;
  /** Date section this row sits under on the Receipts list. */
  section: string;
  // --- detail screen ---
  address?: string;
  dateTime?: string;
  items?: KitLineItem[];
  subtotal?: number;
  tax?: number;
  payment?: string;
  sharedWith?: string[];
  /** Shared group this receipt is in (Shared Group card). */
  sharedGroup?: string;
}

export interface KitStore {
  id: string;
  name: string;
  logoUrl?: string;
  brandColor?: string;
  brandColorSecondary?: string;
  category?: string;
  blurb?: string;
  description?: string;
  /** Partner merchant (services/coupons/partners.ts): full profile, points, email join. */
  partner?: boolean;
  openNow?: boolean;
  hours?: { day: string; text: string }[];
  loyalty?: { programName?: string; nextRewardLabel: string; points: number; goal: number };
}

export interface KitCoupon {
  id: string;
  storeId: string;
  kind: 'bogo' | 'percent' | 'dollar' | 'freebie';
  title: string;
  subtitle?: string;
  body?: string;
  terms?: string;
  code?: string;
  barcode?: string;
  expiresAt?: string;
  inStoreOnly?: boolean;
  minSpend?: number;
  /** How the shopper got it — the only two ways a coupon reaches the wallet. */
  via: 'tap' | 'scan';
}

/** An invented monogram "logo" (a letter on a brand-colour disc), as an SVG data URI. */
function monogram(letter: string, bg: string, fg = '#FFFFFF'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${bg}"/><text x="40" y="53" font-family="Georgia,serif" font-size="40" font-weight="700" text-anchor="middle" fill="${fg}">${letter}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export const demoStores: KitStore[] = [
  {
    id: 'demo-nook-cafe',
    name: 'Nook Cafe',
    logoUrl: monogram('N', '#6B3E26'),
    brandColor: '#6B3E26',
    brandColorSecondary: '#C9894B',
    category: 'Cafe',
    blurb: 'Coffee, pastries and a window seat.',
    description: 'A neighbourhood coffee bar. Tap your phone on the PapeX device at the counter to get your receipt.',
    partner: true,
    openNow: true,
    hours: [
      { day: 'Mon–Fri', text: '7:00 AM – 6:00 PM' },
      { day: 'Sat–Sun', text: '8:00 AM – 4:00 PM' },
    ],
    loyalty: { programName: 'Nook Rewards', nextRewardLabel: 'a free drink', points: 60, goal: 100 },
  },
  {
    id: 'demo-copperpeg-hardware',
    name: 'Copperpeg Hardware',
    logoUrl: monogram('C', '#B5532C'),
    brandColor: '#B5532C',
    brandColorSecondary: '#3E4A52',
    category: 'Hardware',
  },
  {
    id: 'demo-mossbrook-pharmacy',
    name: 'Mossbrook Pharmacy',
    category: 'Pharmacy',
  },
  {
    id: 'demo-quillbrook-market',
    name: 'Quillbrook Market',
    logoUrl: monogram('Q', '#2F6B3F'),
    brandColor: '#2F6B3F',
    category: 'Grocery',
  },
];

export const demoStore = (id: string): KitStore => {
  const s = demoStores.find((x) => x.id === id);
  if (!s) throw new Error(`no demo store ${id}`);
  return s;
};

export const demoReceipts: KitReceipt[] = [
  {
    id: 'r1',
    merchantName: 'Nook Cafe',
    logoUrl: demoStores[0].logoUrl!,
    amount: 12.4,
    dateLabel: 'Sep 24',
    category: 'Dining',
    source: 'rdh',
    originDetail: 'Tapped by you',
    isSharedWithCurrentUser: false,
    isSharedByCurrentUser: false,
    reviewed: false,
    section: 'Today',
    address: '14 Alder Lane, Springvale',
    dateTime: 'Sep 24, 2026 · 8:42 AM',
    items: [
      { name: 'Oat latte', quantity: 1, price: 5.25 },
      { name: 'Almond croissant', quantity: 1, price: 4.75 },
      { name: 'Extra shot', quantity: 1, price: 1.25 },
    ],
    subtotal: 11.25,
    tax: 1.15,
    payment: 'Visa •••• 4417',
    sharedWith: [],
  },
  {
    id: 'r2',
    merchantName: 'Copperpeg Hardware',
    logoUrl: demoStores[1].logoUrl!,
    amount: 38.17,
    dateLabel: 'Sep 23',
    category: 'Home',
    source: 'scanned',
    originDetail: 'Scanned by you • Home Crew',
    isSharedWithCurrentUser: false,
    isSharedByCurrentUser: true,
    reviewed: true,
    section: 'Yesterday',
    address: '220 Foundry Street, Springvale',
    dateTime: 'Sep 23, 2026 · 5:16 PM',
    items: [
      { name: 'Wood screws, 100 ct', quantity: 2, price: 6.49 },
      { name: 'Sanding sheets', quantity: 1, price: 8.99 },
      { name: 'Painter’s tape', quantity: 2, price: 5.99 },
    ],
    subtotal: 33.95,
    tax: 4.22,
    payment: 'Mastercard •••• 2280',
    sharedWith: ['Priya'],
    sharedGroup: 'Home Crew',
  },
  {
    id: 'r3',
    merchantName: 'Mossbrook Pharmacy',
    logoUrl: null,
    amount: 21.6,
    dateLabel: 'Sep 23',
    category: 'Health',
    source: 'email',
    originDetail: 'Shared by Priya in Home Crew',
    isSharedWithCurrentUser: true,
    isSharedByCurrentUser: false,
    reviewed: true,
    section: 'Yesterday',
  },
  {
    id: 'r4',
    merchantName: 'Quillbrook Market',
    logoUrl: demoStores[3].logoUrl!,
    amount: 54.82,
    dateLabel: 'Sep 22',
    category: 'Groceries',
    source: 'rdh',
    originDetail: 'Tapped by you',
    isSharedWithCurrentUser: false,
    isSharedByCurrentUser: false,
    reviewed: true,
    section: 'September 22, 2026',
  },
  {
    id: 'r5',
    merchantName: 'Nook Cafe',
    logoUrl: demoStores[0].logoUrl!,
    amount: 6.5,
    dateLabel: 'Sep 22',
    category: 'Dining',
    source: 'rdh',
    originDetail: 'Tapped by you',
    isSharedWithCurrentUser: false,
    isSharedByCurrentUser: false,
    reviewed: true,
    section: 'September 22, 2026',
  },
];

export const demoCoupons: KitCoupon[] = [
  {
    id: 'c1',
    storeId: 'demo-nook-cafe',
    kind: 'freebie',
    title: 'Free pastry with any drink',
    subtitle: 'Given when you tapped at the counter',
    terms: 'One per visit. Not valid with other offers.',
    code: 'NOOK-7Q2',
    expiresAt: '2026-09-26T23:59:00',
    inStoreOnly: true,
    via: 'tap',
  },
  {
    id: 'c2',
    storeId: 'demo-copperpeg-hardware',
    kind: 'dollar',
    title: '$5 off your next visit',
    terms: 'Excludes gift cards.',
    barcode: '4021870025',
    expiresAt: '2026-10-31T23:59:00',
    minSpend: 25,
    via: 'scan',
  },
  {
    id: 'c3',
    storeId: 'demo-quillbrook-market',
    kind: 'percent',
    title: '15% off fresh produce',
    expiresAt: '2026-10-12T23:59:00',
    via: 'scan',
  },
];
