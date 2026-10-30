// lib/merchantReceipts/types.ts
//
// The shapes behind the dashboard's Receipts tab: the merchant card config
// (contracts/cards/v1/merchant-config.schema.json, plus the server-only
// receipt.loyalty.segment rule) as Papex_RDH's merchant-api returns it, and that
// API's responses. Types only.

export const LOYALTY_SEGMENTS = ["first", "returning", "none", "no_points", "unknown"] as const;
export type LoyaltySegment = (typeof LOYALTY_SEGMENTS)[number];

/** The surfaces a real customer sees. */
export const LIVE_SURFACES = ["clip", "web", "app"] as const;
export type LiveSurface = (typeof LIVE_SURFACES)[number];

export type LayoutOrder = "receipt-first" | "cards-first";

export type CodeSpec =
  | { mode: "static"; value: string }
  | { mode: "template"; template: string }
  | { mode: "perSid"; pool: string };

export type ConfigRedemption =
  | { type: "code"; code: CodeSpec; caption?: string }
  | { type: "barcode"; symbology: "code128" | "ean13" | "upca" | "qr"; code: CodeSpec; text?: string; caption?: string };

export interface OfferValidityConfig {
  expiresOn?: string;
  validForDays?: number;
  countdown: boolean;
  hideWhenExpired?: boolean;
}

export interface OfferTemplate {
  kicker?: string;
  valueLabel: string;
  valueSuffix?: string;
  qualifier?: string;
  title: string;
  terms?: string;
  validity: OfferValidityConfig;
  redemption?: ConfigRedemption;
}

export interface LoyaltyRule {
  fact: "receipt.loyalty.segment";
  op: "in";
  value: LoyaltySegment[];
}

/** One entry of `cards`. `when` may be any v1 rule; the editor only writes LoyaltyRule. */
export interface ConfigCard {
  id: string;
  type: string;
  surfaces: string[];
  priority?: number;
  schedule?: { startsAt?: string; endsAt?: string };
  when?: unknown;
  heading?: string;
  offer?: string;
  actions?: { type: "save"; label: string }[];
  compliance?: { licenseLine: string };
  voice?: string;
  [field: string]: unknown;
}

export interface CardConfigMerchant {
  displayName: string;
  timezone: string;
  ageRestricted: boolean;
  partner: boolean;
}

export interface CardConfigCompliance {
  licenseLine: string;
  licenseExpiresOn?: string;
}

/** A config as the dashboard sees it (the API strips PapeX's notes, pools and links). */
export interface CardConfig {
  enabled: boolean;
  merchant: CardConfigMerchant;
  compliance: CardConfigCompliance | null;
  layout: { order: LayoutOrder };
  offers: Record<string, OfferTemplate>;
  cards: ConfigCard[];
}

/** What a publish sends. Everything else comes from the latest version, server side. */
export type CardConfigInput = Pick<CardConfig, "enabled" | "layout" | "offers" | "cards">;

export interface CardConfigVersion {
  version: number;
  configRef: string | null;
  receiptsFrom: string | null;
  publishedAt: string | null;
}

/** GET /merchant/cards/config */
export interface CardConfigResponse {
  merchantId: string;
  /** false: this merchant's offers are managed by PapeX. Read-only here, and the API refuses a publish. */
  editable: boolean;
  /** Which version `config` is; null when PapeX hasn't set this merchant up yet. */
  version: number | null;
  config: CardConfig | null;
  versions: CardConfigVersion[];
  /** Request-time switches, which reach already-printed receipts too. */
  state: { enabled: boolean; revokedCardIds: string[] };
}

export interface CardConfigIssue {
  path: string;
  code: string;
  message: string;
}

/** POST /merchant/cards/publish, or a dry run of it. */
export type CardPublishResult =
  | {
      kind: "ok";
      dryRun: boolean;
      noop: boolean;
      version: number;
      warnings: CardConfigIssue[];
      receiptsFrom?: string;
    }
  | { kind: "invalid"; errors: CardConfigIssue[]; warnings: CardConfigIssue[] }
  | { kind: "stale"; latestVersion?: number }
  | { kind: "not_editable" }
  | { kind: "no_base_config" };

/** GET /merchant/cards/reach: real counts by the cards Lambda's own rule. */
export interface CardReach {
  window: string;
  total: number;
  segments: Record<LoyaltySegment, number>;
}
