// app/api/merchant/change-requests/route.ts
//
// GET  -> ChangeRequestListResponse: the caller's own requests, newest first.
// POST multipart (field `payload` = JSON ChangeRequestInput, field `files` =
//      0..5 images) -> 201 ChangeRequestCreateResponse.
//
// The merchant is resolved server-side from the login's email (may be null
// for a login not linked yet; the request is still saved for PapeX to see).
// Staff are emailed after the response is sent (lib/server/notify.ts).

import { after, NextResponse, type NextRequest } from "next/server";
import type { ChangeRequestCreateResponse, ChangeRequestListResponse } from "@/lib/changeRequests/types";
import { CHANGE_REQUEST_LIMITS } from "@/lib/changeRequests/types";
import { validateChangeRequestInput, validateUploadFiles } from "@/lib/changeRequests/validate";
import { jsonError, requireMerchant } from "@/lib/server/merchantAuth";
import { dataErrorResponse, requireMerchantData } from "@/lib/server/merchantData";
import { notifyNewChangeRequest } from "@/lib/server/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Every file at max size plus room for the payload and multipart framing. */
const MAX_BODY_BYTES = CHANGE_REQUEST_LIMITS.maxFiles * CHANGE_REQUEST_LIMITS.maxFileBytes + 256 * 1024;

export async function GET(req: NextRequest) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireMerchant(req);
  if (who instanceof NextResponse) return who;
  try {
    const body: ChangeRequestListResponse = { requests: await data.listRequestsForUser(who.uid) };
    return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "GET change-requests");
  }
}

export async function POST(req: NextRequest) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireMerchant(req);
  if (who instanceof NextResponse) return who;

  const declaredLength = Number(req.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) return jsonError(413, "request_too_large", "Those images are too large to send together.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "invalid_multipart", "Send the request as multipart form data.");
  }

  const payloadField = form.get("payload");
  if (typeof payloadField !== "string") return jsonError(400, "invalid_payload", "The request is missing its payload.");
  let payload: unknown;
  try {
    payload = JSON.parse(payloadField);
  } catch {
    return jsonError(400, "invalid_payload", "The request payload must be JSON.");
  }

  const fileEntries = form.getAll("files").filter((f): f is File => typeof f !== "string");
  if (fileEntries.length > CHANGE_REQUEST_LIMITS.maxFiles) {
    return jsonError(400, "too_many_files", `Attach at most ${CHANGE_REQUEST_LIMITS.maxFiles} images.`);
  }
  const incoming = await Promise.all(
    fileEntries.map(async (f) => ({ name: f.name, declaredType: f.type, bytes: new Uint8Array(await f.arrayBuffer()) }))
  );
  const files = validateUploadFiles(incoming);
  if (!files.ok) return jsonError(files.status, files.error, files.message);
  const input = validateChangeRequestInput(payload, files.value.length);
  if (!input.ok) return jsonError(input.status, input.error, input.message);

  try {
    const merchantId = await data.findMerchantIdForEmail(who.email);
    const request = await data.createRequest({ uid: who.uid, email: who.email }, merchantId, input.value, files.value);
    after(() => notifyNewChangeRequest(request));
    const body: ChangeRequestCreateResponse = { request };
    return NextResponse.json(body, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "POST change-requests");
  }
}
