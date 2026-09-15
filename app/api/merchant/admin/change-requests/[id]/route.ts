// app/api/merchant/admin/change-requests/[id]/route.ts
//
// PATCH ChangeRequestStatusUpdate (JSON) -> { request: ChangeRequest }.
// `adminNote: ""` clears the note; leaving it out keeps it. Admins only.

import { NextResponse, type NextRequest } from "next/server";
import { isValidOpaqueId, validateStatusUpdate } from "@/lib/changeRequests/validate";
import { jsonError, requireAdmin } from "@/lib/server/merchantAuth";
import { dataErrorResponse, requireMerchantData } from "@/lib/server/merchantData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireAdmin(req);
  if (who instanceof NextResponse) return who;

  const { id } = await params;
  if (!isValidOpaqueId(id)) return jsonError(404, "request_not_found", "That change request no longer exists.");

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "The update must be JSON.");
  }
  const update = validateStatusUpdate(raw);
  if (!update.ok) return jsonError(update.status, update.error, update.message);

  try {
    const request = await data.updateRequestStatus(id, update.value);
    return NextResponse.json({ request }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "PATCH admin change-request");
  }
}
