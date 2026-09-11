// app/api/merchant/admin/merchants/[id]/route.ts
//
// GET -> AdminMerchantResponse (record, private account, newest 20 history entries).
// PUT AdminMerchantUpdate -> AdminMerchantUpdateResponse. 409 when
//     expectedVersion is stale; expectedVersion 0 on a missing merchant
//     creates it. Admins only.

import { NextResponse, type NextRequest } from "next/server";
import { isValidMerchantId, MAX_RECORD_JSON_BYTES, validateMerchantRecordUpdate } from "@/lib/changeRequests/validate";
import type { AdminMerchantResponse, AdminMerchantUpdateResponse } from "@/lib/merchantProfiles/types";
import { jsonError, requireAdmin } from "@/lib/server/merchantAuth";
import { dataErrorResponse, requireMerchantData } from "@/lib/server/merchantData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HISTORY_LIMIT = 20;
/** Mock mode stores uploaded images inline as data: URLs, so its records run larger. */
const MOCK_MAX_JSON_BYTES = 20 * 1024 * 1024;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireAdmin(req);
  if (who instanceof NextResponse) return who;

  const { id } = await params;
  if (!isValidMerchantId(id)) return jsonError(404, "merchant_not_found", "This merchant does not exist.");
  try {
    const [record, account, history] = await Promise.all([
      data.getRecord(id),
      data.getAccount(id),
      data.listHistory(id, HISTORY_LIMIT),
    ]);
    if (!record) return jsonError(404, "merchant_not_found", "This merchant does not exist.");
    const body: AdminMerchantResponse = { record, account, history };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "GET admin merchant");
  }
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireAdmin(req);
  if (who instanceof NextResponse) return who;

  const { id } = await params;
  if (!isValidMerchantId(id)) return jsonError(400, "invalid_merchant_id", "That merchant id is not valid.");

  const maxJsonBytes = data.kind === "mock" ? MOCK_MAX_JSON_BYTES : MAX_RECORD_JSON_BYTES;
  const text = await req.text();
  // Record limit plus room for account/requestId; the precise check is on `record` below.
  if (text.length > maxJsonBytes + 64 * 1024) {
    return jsonError(413, "record_too_large", "This profile is too large to save. Remove some content or use smaller images.");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return jsonError(400, "invalid_json", "The update must be JSON.");
  }
  const update = validateMerchantRecordUpdate(raw, id, { allowDataImageUrls: data.kind === "mock", maxJsonBytes });
  if (!update.ok) return jsonError(update.status, update.error, update.message);

  try {
    const body: AdminMerchantUpdateResponse = await data.updateRecord(id, update.value, who.email);
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "PUT admin merchant");
  }
}
