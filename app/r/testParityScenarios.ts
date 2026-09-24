// app/r/testParityScenarios.ts
//
// TEST-ONLY. Every URL shape production `/r` (and the demo routes) serves,
// with the upstream answers that drive it. app/r/receiptPage.parity.test.tsx
// holds each one to a golden rendered at the commit BEFORE receipt cards
// reached production `/r`; app/r/receiptPage.cards.test.tsx re-runs them with
// every way the cards call can fail, and requires the same HTML.
//
// The receipt bytes are the committed copies of the real demo blobs
// (lib/__fixtures__/demoBlobs.ts) and the synthetic Star raster
// (lib/mockStarRaster.ts); nothing here is customer data.

import { ELLSWORTH_BLOB, HARTWELLS_BLOB } from "@/lib/__fixtures__/demoBlobs";
import { buildMockStarRasterJob } from "@/lib/mockStarRaster";
import { RDH, SHARED, bytes, json, status, type Upstream } from "./testPageHarness";

export const SID_TEXT = "a1b2c3d4e5f60718";
export const SID_RASTER = "3ea8e69cc7764ad8";
export const SID_UNKNOWN = "0000000000000404";
export const SID_ERROR = "0000000000000500";
export const HARTWELLS = "5ca1e00000000001";
export const ELLSWORTH = "b0de9a0000000001";
export const SUNSET_LEAF = "5371e4f000000001";
export const RID = "receipt_1776344585632_4mrd9txmk";

const SUNSET_TEXT = Uint8Array.from(
  "\x1b@\x1ba\x01SUNSET LEAF\n\x1ba\x00PRE-ROLL 1G           12.00\nTAX                    3.24\nTOTAL                 15.24\n",
  (c) => c.charCodeAt(0),
);

const PARSED_OK = {
  sid: SID_RASTER,
  parseStatus: "ok",
  hasImage: true,
  uploadedAt: "2026-06-02T12:00:05.123Z",
  receipt: {
    merchantName: "Star Clothing Boutique",
    merchantAddress: "123 Star Road, City, State 12345",
    date: null,
    subtotal: 156.95,
    tax: 0,
    total: 156.95,
    lineItems: [
      { name: "PLAIN T-SHIRT", quantity: 1, price: 10.99, sku: "300678566" },
      { name: "BLACK BOOTS", quantity: 1, price: 145.96, sku: "30063847" },
    ],
    paymentMethod: null,
    cardBrand: null,
    cardLast4: null,
    receiptNumber: null,
    confidence: "medium",
    extractorEngine: "gemma-4",
  },
};

const PARSED_RASTER_PENDING = {
  sid: SID_RASTER,
  parseStatus: "ok_raster",
  hasImage: true,
  uploadedAt: "2026-06-02T12:00:05.123Z",
  receipt: null,
};

const SHARED_OK = {
  sid: RID,
  parseStatus: "ok",
  hasImage: false,
  uploadedAt: "2026-04-16T13:03:05.632Z",
  receipt: {
    merchantName: "CASH RECEIPT",
    merchantAddress: null,
    date: "2018-01-01 • 10:35",
    subtotal: null,
    tax: null,
    total: 84.8,
    lineItems: [{ name: "Item", quantity: 1, price: 84.8, sku: null }],
    paymentMethod: null,
    cardBrand: null,
    cardLast4: null,
    receiptNumber: null,
    confidence: null,
    extractorEngine: null,
  },
};

export type PageRoute = "/r" | "/r/demo" | "/demo/r";

export interface Scenario {
  name: string;
  route: PageRoute;
  params: Record<string, string>;
  ua?: "android";
  upstreams: Record<string, Upstream>;
  /**
   * The sid whose cards `/r` may ask for: a well-formed, NON-demo sid on the
   * `/r` sid path without `?demo=1`. Absent: the page must never call
   * `/cards` (demo sids, rid links, the sample, malformed sids, demo routes).
   */
  cardsSid?: string;
  /** The receipt renders (so cards, when there are any, render with it). */
  receiptRenders?: boolean;
}

const receipt = (sid: string) => `${RDH}/receipt/${sid}`;
const parsed = (sid: string) => `${RDH}/receipt/${sid}/parsed`;

export const SCENARIOS: Scenario[] = [
  // ---- /r?sid= -----------------------------------------------------------------
  {
    name: "sid-text",
    route: "/r",
    params: { sid: SID_TEXT },
    upstreams: { [receipt(SID_TEXT)]: bytes(HARTWELLS_BLOB.bytes), [parsed(SID_TEXT)]: status(404) },
    cardsSid: SID_TEXT,
    receiptRenders: true,
  },
  {
    name: "sid-text-android",
    route: "/r",
    params: { sid: SID_TEXT },
    ua: "android",
    upstreams: { [receipt(SID_TEXT)]: bytes(ELLSWORTH_BLOB.bytes), [parsed(SID_TEXT)]: status(404) },
    cardsSid: SID_TEXT,
    receiptRenders: true,
  },
  {
    name: "sid-raster-pending",
    route: "/r",
    params: { sid: SID_RASTER },
    upstreams: { [receipt(SID_RASTER)]: bytes(buildMockStarRasterJob()), [parsed(SID_RASTER)]: json(200, PARSED_RASTER_PENDING) },
    cardsSid: SID_RASTER,
    receiptRenders: true,
  },
  {
    name: "sid-raster-parsed",
    route: "/r",
    params: { sid: SID_RASTER },
    upstreams: { [receipt(SID_RASTER)]: bytes(buildMockStarRasterJob()), [parsed(SID_RASTER)]: json(200, PARSED_OK) },
    cardsSid: SID_RASTER,
    receiptRenders: true,
  },
  {
    name: "sid-raster-parsed-error",
    route: "/r",
    params: { sid: SID_RASTER },
    upstreams: { [receipt(SID_RASTER)]: bytes(buildMockStarRasterJob()), [parsed(SID_RASTER)]: status(502) },
    cardsSid: SID_RASTER,
    receiptRenders: true,
  },
  {
    name: "sid-unknown",
    route: "/r",
    params: { sid: SID_UNKNOWN },
    upstreams: { [receipt(SID_UNKNOWN)]: status(404), [parsed(SID_UNKNOWN)]: status(404) },
    cardsSid: SID_UNKNOWN,
  },
  {
    name: "sid-backend-error",
    route: "/r",
    params: { sid: SID_ERROR },
    upstreams: { [receipt(SID_ERROR)]: status(500), [parsed(SID_ERROR)]: status(500) },
    cardsSid: SID_ERROR,
  },
  { name: "sid-malformed", route: "/r", params: { sid: "NOT-A-SID" }, upstreams: {} },
  { name: "bare", route: "/r", params: {}, upstreams: {} },
  { name: "demo-flag", route: "/r", params: { demo: "1" }, upstreams: {} },
  { name: "demo-flag-with-sid", route: "/r", params: { sid: SID_TEXT, demo: "1" }, upstreams: {} },

  // ---- /r?rid= (the 4adb368 fix) and sid+rid --------------------------------------
  {
    name: "rid-ok",
    route: "/r",
    params: { rid: RID },
    upstreams: { [`${SHARED}/sharedReceipt?rid=${RID}`]: json(200, SHARED_OK) },
  },
  {
    name: "rid-not-found",
    route: "/r",
    params: { rid: RID },
    upstreams: { [`${SHARED}/sharedReceipt?rid=${RID}`]: status(404) },
  },
  { name: "rid-malformed", route: "/r", params: { rid: "has space" }, upstreams: {} },
  {
    name: "sid-and-rid",
    route: "/r",
    params: { sid: SID_TEXT, rid: RID },
    upstreams: {
      [receipt(SID_TEXT)]: bytes(HARTWELLS_BLOB.bytes),
      [parsed(SID_TEXT)]: status(404),
      [`${SHARED}/sharedReceipt?rid=${RID}`]: json(200, SHARED_OK),
    },
    cardsSid: SID_TEXT,
    receiptRenders: true,
  },

  // ---- demo sids on production /r: the receipt, no Save, never /cards ---------------
  {
    name: "r-hartwells",
    route: "/r",
    params: { sid: HARTWELLS },
    upstreams: { [receipt(HARTWELLS)]: bytes(HARTWELLS_BLOB.bytes), [parsed(HARTWELLS)]: status(404) },
  },
  {
    name: "r-ellsworth",
    route: "/r",
    params: { sid: ELLSWORTH },
    upstreams: { [receipt(ELLSWORTH)]: bytes(ELLSWORTH_BLOB.bytes), [parsed(ELLSWORTH)]: status(404) },
  },
  {
    name: "r-sunset-leaf",
    route: "/r",
    params: { sid: SUNSET_LEAF },
    upstreams: { [receipt(SUNSET_LEAF)]: bytes(SUNSET_TEXT), [parsed(SUNSET_LEAF)]: status(404) },
  },

  // ---- the demo routes (value layer from the compiled registry) ----------------------
  { name: "r-demo-hartwells", route: "/r/demo", params: { sid: HARTWELLS }, upstreams: { [receipt(HARTWELLS)]: bytes(HARTWELLS_BLOB.bytes) } },
  { name: "r-demo-ellsworth", route: "/r/demo", params: { sid: ELLSWORTH }, upstreams: { [receipt(ELLSWORTH)]: bytes(ELLSWORTH_BLOB.bytes) } },
  { name: "r-demo-sunset-leaf", route: "/r/demo", params: { sid: SUNSET_LEAF }, upstreams: { [receipt(SUNSET_LEAF)]: bytes(SUNSET_TEXT) } },
  { name: "demo-r-hartwells", route: "/demo/r", params: { sid: HARTWELLS }, upstreams: { [receipt(HARTWELLS)]: bytes(HARTWELLS_BLOB.bytes) } },
  { name: "demo-r-ellsworth", route: "/demo/r", params: { sid: ELLSWORTH }, upstreams: { [receipt(ELLSWORTH)]: bytes(ELLSWORTH_BLOB.bytes) } },
  { name: "r-demo-non-demo-sid", route: "/r/demo", params: { sid: SID_TEXT }, upstreams: {} },
];

/** generateMetadata cases: the Smart App Banner rules. */
export const METADATA_CASES: { name: string; params: Record<string, string>; ridBannerEnv?: "1" }[] = [
  { name: "sid", params: { sid: SID_TEXT } },
  { name: "sid-demo-sid", params: { sid: HARTWELLS } },
  { name: "sid-malformed", params: { sid: "NOT-A-SID" } },
  { name: "rid-flag-off", params: { rid: RID } },
  { name: "rid-flag-on", params: { rid: RID }, ridBannerEnv: "1" },
  { name: "sid-and-rid", params: { sid: SID_TEXT, rid: RID } },
  { name: "bare", params: {} },
  { name: "demo-flag", params: { demo: "1" } },
];
