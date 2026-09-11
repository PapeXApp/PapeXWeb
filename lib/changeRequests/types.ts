// lib/changeRequests/types.ts
//
// A merchant asking PapeX to change something on their shared merchant record
// (see lib/merchantProfiles/types.ts). Stored at `merchantChangeRequests/{id}`
// in papexv2 Firestore, written and read ONLY through this site's server
// routes (firebase-admin); no client rule allows access. Attachments live in
// the papexv2 Storage bucket under `merchant-requests/{merchantId}/{requestId}/`
// and are handed out as short-lived signed URLs, never public ones.

export type ChangeRequestSection =
  | "brand"
  | "about"
  | "hours"
  | "contact"
  | "menu"
  | "deals"
  | "coupons"
  | "whatsNew"
  | "loyalty"
  | "other";

export type ChangeRequestAction = "update" | "add" | "remove";

export type ChangeRequestStatus = "received" | "in_progress" | "done" | "declined";

export const CHANGE_REQUEST_LIMITS = {
  maxFiles: 5,
  maxFileBytes: 5 * 1024 * 1024,
  /** No SVG on purpose (script-capable). */
  allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"],
  maxMessageChars: 4000,
  maxItems: 50,
  maxAdminNoteChars: 2000,
} as const;

/** What the merchant sends. POST /api/merchant/change-requests as multipart:
 *  field `payload` = JSON of this, field `files` = 0..maxFiles images.
 *  Valid when `message` is non-empty OR `itemIds` is non-empty OR
 *  `proposedColors` has a value OR at least one file is attached. */
export interface ChangeRequestInput {
  section: ChangeRequestSection;
  action: ChangeRequestAction;
  /** Ids of the deals / menu items / coupons / updates the request is about. */
  itemIds: string[];
  message: string;
  /** Brand requests: hex "#RRGGBB". */
  proposedColors?: { primary?: string; secondary?: string };
}

export interface ChangeRequestAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  /** Resolved at read time (signed URL, or a data URL in mock mode). */
  url: string;
}

export interface ChangeRequest extends ChangeRequestInput {
  id: string;
  /** null = the requester's login isn't linked to a merchant record yet. */
  merchantId: string | null;
  merchantName?: string;
  /** Server-resolved titles for `itemIds`, same order, so the inbox reads
   *  "Remove: Thursday Doobie Deals" without looking the record up. */
  itemLabels: string[];
  requesterUid: string;
  requesterEmail: string;
  attachments: ChangeRequestAttachment[];
  status: ChangeRequestStatus;
  /** Visible to the merchant. */
  adminNote?: string;
  /** History entry id of the record edit that fulfilled it. */
  appliedHistoryId?: string;
  /** ISO 8601. */
  createdAt: string;
  updatedAt: string;
}

/** GET /api/merchant/change-requests (own) and
 *  GET /api/merchant/admin/change-requests[?status=&merchantId=] (all). */
export interface ChangeRequestListResponse {
  requests: ChangeRequest[];
}

/** POST response. */
export interface ChangeRequestCreateResponse {
  request: ChangeRequest;
}

/** PATCH /api/merchant/admin/change-requests/[id] (JSON). */
export interface ChangeRequestStatusUpdate {
  status: ChangeRequestStatus;
  adminNote?: string;
}
