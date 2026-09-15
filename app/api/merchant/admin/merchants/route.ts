// app/api/merchant/admin/merchants/route.ts
//
// GET -> MerchantListResponse: every merchant record with its open request
// count (received + in_progress). Admins only.

import { NextResponse, type NextRequest } from "next/server";
import type { MerchantListResponse } from "@/lib/merchantProfiles/types";
import { requireAdmin } from "@/lib/server/merchantAuth";
import { dataErrorResponse, requireMerchantData } from "@/lib/server/merchantData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireAdmin(req);
  if (who instanceof NextResponse) return who;
  try {
    const body: MerchantListResponse = { merchants: await data.listSummaries() };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "GET admin merchants");
  }
}
