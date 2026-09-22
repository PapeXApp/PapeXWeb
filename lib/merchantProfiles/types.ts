// lib/merchantProfiles/types.ts
//
// THE SHARED MERCHANT RECORD: one document per merchant at
// `merchants/{merchantId}` in the PapeX app's Firebase project (papexv2).
// The PapeX app and the merchant dashboard both read this same document, so
// the two can never drift. Only PapeX staff write it, through this site's
// server routes (firebase-admin); the papexv2 rules already deny every
// client write (PapeXV2/firestore.rules, `match /merchants/{merchantId}`).
//
// The `Store*` shapes below are a MIRROR of PapeXV2/services/coupons/types.ts
// (as of 2026-09-18). That file is the app's contract; keep these field names
// identical so the app can read a document straight into its own `Store`
// type. If the app adds a field, add it here.
//
// NO `Coupon` HERE ON PURPOSE (2026-09-18, matching the app's standing rule:
// nothing invented ships, and a coupon appears on a profile only once a
// shopper EARNS or SCANS it — the merchant never authors one). A merchant's
// own public promotion is a `StoreDeal`; a coupon is per-shopper wallet state
// the app keeps on-device (PapeXV2 services/coupons/earned.ts), never part of
// this shared merchant record. So the dashboard editor offers Deals, not
// Coupons, and `MerchantRecord` carries no `coupons` field.
//
// `merchants/{id}` is PUBLIC READ. Anything private (who can log in, the RDH
// merchant id) lives in `merchantAccounts/{id}` instead, which clients
// cannot read at all.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface StoreHoursInterval {
  day: Weekday;
  /** Local wall clock, 24h "HH:MM". closesAt <= opensAt = runs past midnight. */
  opensAt: string;
  closesAt: string;
}

export interface StoreHours {
  /** IANA zone, e.g. "America/Los_Angeles". */
  timezone?: string;
  intervals: StoreHoursInterval[];
}

export interface StoreUpdate {
  id: string;
  kind: "new-product" | "announcement";
  title: string;
  body?: string;
  menuItemId?: string;
  /** YYYY-MM-DD */
  postedOn?: string;
}

export interface StoreMenuItem {
  id?: string;
  name: string;
  description?: string;
  /** Dollars. */
  price: number;
  imageUrl?: string;
}

export interface StoreMenuCategory {
  category: string;
  items: StoreMenuItem[];
}

export interface StoreDeal {
  id: string;
  title: string;
  description?: string;
  schedule?: string;
  terms?: string;
  imageUrl?: string;
  imageAspectRatio?: number;
  weekdays?: Weekday[];
  daysOfMonth?: number[];
  /** YYYY-MM-DD, inclusive. */
  startsOn?: string;
  endsOn?: string;
  appliesTo?: string;
  category?: string;
  menuItemIds?: string[];
  percentOff?: number;
}

/** Mirror of the app's `Store`. Everything below `name` is optional. */
export interface Store {
  id: string;
  name: string;
  logoUrl?: string;
  heroImageUrl?: string;
  brandColor?: string;
  brandColorSecondary?: string;
  category?: string;
  blurb?: string;
  website?: string;
  address?: string;
  phone?: string;
  hours?: StoreHours;
  description?: string;
  menuCategories?: string[];
  menuUrl?: string;
  menu?: StoreMenuCategory[];
  deals?: StoreDeal[];
  whatsNew?: StoreUpdate[];
}

/** The merchant's points program as a merchant setting (per-user balances are
 *  NOT merchant data and never live here). */
export interface LoyaltyProgram {
  programName?: string;
  nextRewardAt?: number;
  nextRewardLabel?: string;
}

/** `merchants/{merchantId}`. `id` === the document id === the app's store id
 *  (e.g. "store-doobie-nights"). */
export interface MerchantRecord extends Store {
  loyaltyProgram?: LoyaltyProgram;
  /** Bumped by 1 on every write. */
  version: number;
  /** ISO 8601. */
  updatedAt: string;
  /** Email of the PapeX staff member who last wrote it. */
  updatedBy?: string;
}

/** `merchantAccounts/{merchantId}`. PRIVATE (clients can't read it). */
export interface MerchantAccount {
  merchantId: string;
  /** Dashboard (papexweb-aed97) login emails that manage this merchant,
   *  lowercase. How a signed-in merchant is matched to their record. */
  dashboardEmails: string[];
  /** RDH backend `merchant_id` (DynamoDB papex-rdh-merchants), when linked. */
  rdhMerchantId?: string;
}

/** `merchants/{merchantId}/history/{id}`. PRIVATE (subcollection, default-deny). */
export interface MerchantHistoryEntry {
  id: string;
  merchantId: string;
  /** ISO 8601. */
  at: string;
  by: string;
  /** The change request this edit fulfilled, if any. */
  requestId?: string;
  changedFields: string[];
  before: Partial<MerchantRecord>;
  after: Partial<MerchantRecord>;
}

/** Row in the admin merchant list. */
export interface MerchantSummary {
  id: string;
  name: string;
  logoUrl?: string;
  brandColor?: string;
  updatedAt: string;
  openRequests: number;
}

// ── API responses ─────────────────────────────────────────────────────────

/** GET /api/merchant/profile[?merchantId=<id> (admins only)] */
export interface ProfileResponse {
  /** null = this login isn't linked to a merchant record yet. */
  merchantId: string | null;
  profile: MerchantRecord | null;
  isAdmin: boolean;
  /** "mock" = local demo data (NEXT_PUBLIC_MERCHANT_MOCK=1, never production).
   *  "firestore" = the live shared record; the client should subscribe to
   *  `merchants/{merchantId}` on papexv2 for live updates. */
  source: "mock" | "firestore";
}

/** GET /api/merchant/admin/merchants */
export interface MerchantListResponse {
  merchants: MerchantSummary[];
}

/** GET /api/merchant/admin/merchants/[id] */
export interface AdminMerchantResponse {
  record: MerchantRecord;
  account: MerchantAccount | null;
  history: MerchantHistoryEntry[];
}

/** PUT /api/merchant/admin/merchants/[id]
 *  `record` replaces the editable fields (server owns id/version/updatedAt/updatedBy).
 *  If `requestId` is set, the history entry links to it; if `markRequestDone`
 *  is also true, that request's status becomes "done". */
export interface AdminMerchantUpdate {
  record: Omit<MerchantRecord, "version" | "updatedAt" | "updatedBy">;
  account?: Omit<MerchantAccount, "merchantId">;
  requestId?: string;
  markRequestDone?: boolean;
  /** Optimistic concurrency: the version the editor loaded. 409 if stale. */
  expectedVersion: number;
}

/** PUT response. */
export interface AdminMerchantUpdateResponse {
  record: MerchantRecord;
  historyId: string;
}

/** POST /api/merchant/admin/merchants/[id]/assets
 *  Either multipart `file` (one image), or JSON `{ fromAttachment: { requestId, attachmentId } }`
 *  to reuse an image a merchant attached. Returns a stable PUBLIC url for
 *  logoUrl / heroImageUrl / deal or menu images. */
export interface AdminAssetResponse {
  url: string;
}
