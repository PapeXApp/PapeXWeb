// app/api/merchant/admin/merchants/[id]/assets/route.ts
//
// POST -> AdminAssetResponse { url }: stores a PUBLIC image (logo, banner,
// deal or menu shot) for a merchant and returns a stable URL to put in the
// record. Either multipart with one `file`, or JSON
// `{ fromAttachment: { requestId, attachmentId } }` to reuse an image a
// merchant attached to a change request. PNG, JPEG or WebP only (HEIC does
// not render on Android or most browsers). Admins only.

import { NextResponse, type NextRequest } from "next/server";
import { isValidMerchantId, isValidOpaqueId, validateUploadFiles } from "@/lib/changeRequests/validate";
import type { AdminAssetResponse } from "@/lib/merchantProfiles/types";
import { jsonError, requireAdmin } from "@/lib/server/merchantAuth";
import { ASSET_IMAGE_TYPES, dataErrorResponse, requireMerchantData, type AssetSource } from "@/lib/server/merchantData";
import { CHANGE_REQUEST_LIMITS } from "@/lib/changeRequests/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const data = await requireMerchantData();
  if (data instanceof NextResponse) return data;
  const who = await requireAdmin(req);
  if (who instanceof NextResponse) return who;

  const { id } = await params;
  if (!isValidMerchantId(id)) return jsonError(400, "invalid_merchant_id", "That merchant id is not valid.");

  let source: AssetSource;
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    if (Number(req.headers.get("content-length") ?? "0") > CHANGE_REQUEST_LIMITS.maxFileBytes + 64 * 1024) {
      return jsonError(413, "file_too_large", "The image must be under 5 MB.");
    }
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return jsonError(400, "invalid_multipart", "Send the image as multipart form data.");
    }
    const file = form.get("file");
    if (!file || typeof file === "string") return jsonError(400, "missing_file", "Attach one image as `file`.");
    const files = validateUploadFiles([{ name: file.name, declaredType: file.type, bytes: new Uint8Array(await file.arrayBuffer()) }], {
      maxFiles: 1,
      allowedTypes: ASSET_IMAGE_TYPES,
    });
    if (!files.ok) {
      if (files.error === "unsupported_file_type") {
        return jsonError(415, "unsupported_asset_type", "Logos and banners must be PNG, JPEG or WebP.");
      }
      return jsonError(files.status, files.error, files.message);
    }
    source = { file: files.value[0] };
  } else {
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return jsonError(400, "invalid_json", "Send either an image file or a fromAttachment reference.");
    }
    const ref = (raw as { fromAttachment?: { requestId?: unknown; attachmentId?: unknown } } | null)?.fromAttachment;
    if (!ref || !isValidOpaqueId(ref.requestId) || !isValidOpaqueId(ref.attachmentId)) {
      return jsonError(400, "invalid_attachment_ref", "fromAttachment needs a requestId and an attachmentId.");
    }
    source = { fromAttachment: { requestId: ref.requestId, attachmentId: ref.attachmentId } };
  }

  try {
    const body: AdminAssetResponse = { url: await data.uploadAsset(id, source) };
    return NextResponse.json(body, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return dataErrorResponse(err, "POST admin merchant asset");
  }
}
