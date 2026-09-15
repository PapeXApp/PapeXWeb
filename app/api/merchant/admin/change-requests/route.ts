// app/api/merchant/admin/change-requests/route.ts
//
// GET [?status=received|in_progress|done|declined][&merchantId=<id>|unlinked]
//   -> ChangeRequestListResponse, every merchant's requests, newest first.
// PapeX admins only.

import { NextResponse, type NextRequest } from "next/server";
import type { ChangeRequestListResponse, ChangeRequestStatus } from "@/lib/changeRequests/types";
import { CHANGE_REQUEST_STATUSES, isValidMerchantId } from "@/lib/changeRequests/validate";
import { jsonError, requireAdmin } from "@/lib/server/merchantAuth";
import { dataErrorResponse, requireMerchantData, type ListRequestsFilter } from "@/lib/server/merchantData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireAdmin(req);
  if (who instanceof NextResponse) return who;

  const params = req.nextUrl.searchParams;
  const filter: ListRequestsFilter = {};
  const status = params.get("status");
  if (status) {
    if (!CHANGE_REQUEST_STATUSES.includes(status as ChangeRequestStatus)) {
      return jsonError(400, "invalid_status", "Status must be received, in_progress, done or declined.");
    }
    filter.status = status as ChangeRequestStatus;
  }
  const merchantId = params.get("merchantId");
  if (merchantId) {
    if (merchantId === "unlinked") filter.merchantId = null;
    else if (isValidMerchantId(merchantId)) filter.merchantId = merchantId;
    else return jsonError(400, "invalid_merchant_id", "That merchant id is not valid.");
  }

  try {
    const body: ChangeRequestListResponse = { requests: await data.listAllRequests(filter) };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "GET admin change-requests");
  }
}
