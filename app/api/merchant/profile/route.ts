// app/api/merchant/profile/route.ts
//
// GET -> ProfileResponse: the signed-in merchant's shared record
// (merchants/{id} on papexv2). The merchant is found from the login's email
// via merchantAccounts.dashboardEmails; `?merchantId=` is honored only for
// PapeX admins (and 404s if that merchant doesn't exist). A login that isn't
// linked yet gets merchantId null, profile null.

import { NextResponse, type NextRequest } from "next/server";
import { isValidMerchantId } from "@/lib/changeRequests/validate";
import type { ProfileResponse } from "@/lib/merchantProfiles/types";
import { jsonError, requireMerchant } from "@/lib/server/merchantAuth";
import { dataErrorResponse, requireMerchantData } from "@/lib/server/merchantData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireMerchant(req);
  if (who instanceof NextResponse) return who;

  try {
    const requested = req.nextUrl.searchParams.get("merchantId");
    const adminLookup = Boolean(requested) && who.isAdmin;
    let merchantId: string | null;
    if (adminLookup) {
      if (!isValidMerchantId(requested)) return jsonError(400, "invalid_merchant_id", "That merchant id is not valid.");
      merchantId = requested;
    } else {
      merchantId = await data.findMerchantIdForEmail(who.email);
    }
    const profile = merchantId ? await data.getRecord(merchantId) : null;
    if (adminLookup && !profile) return jsonError(404, "merchant_not_found", "This merchant does not exist.");

    const body: ProfileResponse = { merchantId, profile, isAdmin: who.isAdmin, source: data.kind };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "GET profile");
  }
}
