// lib/server/merchantData/index.ts
//
// SERVER ONLY. One interface over the merchant profile data, two backends:
//
//   mock       NEXT_PUBLIC_MERCHANT_MOCK=1 and NODE_ENV !== "production".
//              In-memory, seeded from lib/merchantProfiles/seed, kept on
//              globalThis so Next dev hot reloads don't wipe it.
//   firestore  PAPEXV2_SERVICE_ACCOUNT is set. firebase-admin against the
//              papexv2 project (lib/server/firebaseAdminV2.ts).
//
// Mock wins when both are configured (a local .env.local with the mock flag
// is a design session). Neither configured: routes answer 503
// {error: "profile_service_not_configured"}.
//
// Backends are loaded with dynamic import() so mock mode and the unit tests
// never load firebase-admin.

import { NextResponse } from "next/server";
import type {
  AdminMerchantUpdate,
  AdminMerchantUpdateResponse,
  MerchantAccount,
  MerchantHistoryEntry,
  MerchantRecord,
  MerchantSummary,
} from "../../merchantProfiles/types";
import type {
  ChangeRequest,
  ChangeRequestInput,
  ChangeRequestStatus,
  ChangeRequestStatusUpdate,
} from "../../changeRequests/types";
import type { AllowedImageType, ValidatedFile } from "../../changeRequests/validate";
import { MerchantDataError, type StoredChangeRequest } from "./shared";

export { MerchantDataError } from "./shared";

export type ProfileBackendKind = "mock" | "firestore";

export function isMerchantMockMode(): boolean {
  if (process.env.NEXT_PUBLIC_MERCHANT_MOCK !== "1") return false;
  if (process.env.NODE_ENV !== "production") return true;
  // DEMO BRANCH ONLY (preview/merchant-profile-demo, never merged): a Vercel
  // PREVIEW build may run on test data. VERCEL_ENV is set by Vercel itself and
  // is "production" on the live deploy, so this can't switch on there.
  return process.env.MERCHANT_PREVIEW_DEMO === "1" && process.env.VERCEL_ENV === "preview";
}

export function profileBackendKind(): ProfileBackendKind | null {
  if (isMerchantMockMode()) return "mock";
  if (process.env.PAPEXV2_SERVICE_ACCOUNT?.trim()) return "firestore";
  return null;
}

/** Public assets (logos, banners) are shown on Android and the web too: no HEIC. */
export const ASSET_IMAGE_TYPES: readonly AllowedImageType[] = ["image/png", "image/jpeg", "image/webp"];

export interface RequesterIdentity {
  uid: string;
  email: string;
}

export type AssetSource = { file: ValidatedFile } | { fromAttachment: { requestId: string; attachmentId: string } };

export interface ListRequestsFilter {
  status?: ChangeRequestStatus;
  /** A merchant id, or null for requests from logins not linked to any merchant. */
  merchantId?: string | null;
}

export interface MerchantData {
  readonly kind: ProfileBackendKind;
  getRecord(merchantId: string): Promise<MerchantRecord | null>;
  /** Every merchant, with openRequests = received + in_progress. */
  listSummaries(): Promise<MerchantSummary[]>;
  getAccount(merchantId: string): Promise<MerchantAccount | null>;
  /** Newest first. */
  listHistory(merchantId: string, limit: number): Promise<MerchantHistoryEntry[]>;
  /** The merchant whose account lists this dashboard email, or null. */
  findMerchantIdForEmail(email: string): Promise<string | null>;
  /**
   * Transactional: 409 on expectedVersion mismatch, version + 1, updatedAt,
   * updatedBy, a history entry, the account if given, and the linked
   * request marked done if asked. expectedVersion 0 on a missing merchant
   * creates it (version 1). Throws MerchantDataError.
   */
  updateRecord(merchantId: string, update: AdminMerchantUpdate, byEmail: string): Promise<AdminMerchantUpdateResponse>;
  createRequest(
    requester: RequesterIdentity,
    merchantId: string | null,
    input: ChangeRequestInput,
    files: ValidatedFile[]
  ): Promise<ChangeRequest>;
  getRequest(requestId: string): Promise<ChangeRequest | null>;
  /** Newest first. */
  listRequestsForUser(uid: string): Promise<ChangeRequest[]>;
  /** Newest first. */
  listAllRequests(filter: ListRequestsFilter): Promise<ChangeRequest[]>;
  updateRequestStatus(requestId: string, update: ChangeRequestStatusUpdate): Promise<ChangeRequest>;
  /** Fills in attachment URLs (15 min signed URLs, or data URLs in mock mode). */
  resolveAttachmentUrls(stored: StoredChangeRequest): Promise<ChangeRequest>;
  /** Stores a public image and returns its stable URL. */
  uploadAsset(merchantId: string, source: AssetSource): Promise<string>;
}

export async function getMerchantData(): Promise<MerchantData | null> {
  const kind = profileBackendKind();
  if (kind === "mock") return (await import("./mock")).createMockMerchantData();
  if (kind === "firestore") return (await import("./firestore")).createFirestoreMerchantData();
  return null;
}

/** The configured backend, or the 503 every route answers without one. */
export async function requireMerchantData(): Promise<MerchantData | NextResponse> {
  const data = await getMerchantData();
  if (data) return data;
  return NextResponse.json(
    { error: "profile_service_not_configured", message: "The merchant profile service is not set up yet." },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}

/** Maps a thrown error to a JSON response. Unknown errors are logged, never echoed. */
export function dataErrorResponse(err: unknown, context: string): NextResponse {
  if (err instanceof MerchantDataError) {
    return NextResponse.json(err.userMessage ? { error: err.code, message: err.userMessage } : { error: err.code }, {
      status: err.status,
      headers: { "Cache-Control": "no-store" },
    });
  }
  console.error(`[merchant-profile] ${context} failed:`, err instanceof Error ? err.message : err);
  return NextResponse.json(
    { error: "profile_service_error", message: "Something went wrong. Please try again." },
    { status: 500, headers: { "Cache-Control": "no-store" } }
  );
}
