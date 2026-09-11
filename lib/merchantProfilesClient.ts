// lib/merchantProfilesClient.ts
//
// Browser-side client for the merchant profile + change-request routes
// (server: app/api/merchant/**, contract: lib/merchantProfiles/types.ts and
// lib/changeRequests/types.ts). Typed fetchers, a few hooks the dashboard
// pages share, and the client-side mirror of CHANGE_REQUEST_LIMITS so a
// merchant hears "that file is too big" before an upload, not after.
//
// Every call carries `Authorization: Bearer <idToken>` from
// useMerchantAuth().getIdToken(). Same-origin `/api/...` paths: middleware's
// matcher excludes /api, so these are never host-rewritten.
//
// MOCK ROLE (local design work only). The server treats the header
// `x-merchant-mock-role: admin` as admin when it runs on mock data. The
// client sends it ONLY when all of these hold:
//   - NEXT_PUBLIC_MERCHANT_MOCK === "1"
//   - NODE_ENV !== "production" (same double gate as AuthContext's mock user)
//   - the visitor opened a dashboard URL with `?role=admin` this tab session
//     (persisted in sessionStorage; `?role=merchant` clears it)
// Never otherwise.

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AdminAssetResponse,
  AdminMerchantResponse,
  AdminMerchantUpdate,
  AdminMerchantUpdateResponse,
  MerchantListResponse,
  MerchantRecord,
  ProfileResponse,
} from "@/lib/merchantProfiles/types";
import {
  CHANGE_REQUEST_LIMITS,
  type ChangeRequest,
  type ChangeRequestCreateResponse,
  type ChangeRequestInput,
  type ChangeRequestListResponse,
  type ChangeRequestStatus,
  type ChangeRequestStatusUpdate,
} from "@/lib/changeRequests/types";

export type TokenGetter = () => Promise<string | null>;

// ---- Mock role ---------------------------------------------------------------

const MOCK_ENABLED =
  process.env.NEXT_PUBLIC_MERCHANT_MOCK === "1" && process.env.NODE_ENV !== "production";
const MOCK_ROLE_KEY = "papex.merchantMockRole";

/** Reads `?role=admin|merchant` into sessionStorage. No-op outside mock mode. */
export function syncMockRoleFromUrl(): void {
  if (!MOCK_ENABLED || typeof window === "undefined") return;
  try {
    const role = new URLSearchParams(window.location.search).get("role");
    if (role === "admin") window.sessionStorage.setItem(MOCK_ROLE_KEY, "admin");
    else if (role === "merchant") window.sessionStorage.removeItem(MOCK_ROLE_KEY);
  } catch {
    // sessionStorage can throw in locked-down browsers; mock role just stays off.
  }
}

function mockRoleHeaders(): Record<string, string> {
  if (!MOCK_ENABLED || typeof window === "undefined") return {};
  try {
    return window.sessionStorage.getItem(MOCK_ROLE_KEY) === "admin" ? { "x-merchant-mock-role": "admin" } : {};
  } catch {
    return {};
  }
}

// ---- Errors --------------------------------------------------------------------

export class ApiError extends Error {
  /** HTTP status, or 0 for a network failure. */
  readonly status: number;
  /** The server's `{error}` string, or `http_<status>` / `network_error`. */
  readonly code: string;
  constructor(status: number, code: string) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function toApiError(e: unknown): ApiError {
  return e instanceof ApiError ? e : new ApiError(0, "network_error");
}

export function isServiceNotConfigured(e: unknown): boolean {
  return e instanceof ApiError && (e.code === "profile_service_not_configured" || e.status === 503);
}

/** Plain-language message for an error. `fallback` covers anything unexpected. */
export function friendlyError(e: unknown, fallback: string): string {
  const err = toApiError(e);
  if (isServiceNotConfigured(err)) return "Profile service isn't connected yet.";
  if (err.status === 0) return "Couldn't reach PapeX. Check your connection and try again.";
  if (err.status === 401) return "Your session expired. Sign in again.";
  if (err.status === 403) return "You don't have access to this.";
  if (err.status === 404) return "We couldn't find that.";
  if (err.status === 409) return "Someone else saved first. Reload to see their changes.";
  if (err.status === 413) return "That upload is too big.";
  return fallback;
}

// ---- Transport -----------------------------------------------------------------

async function request<T>(token: string, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  for (const [k, v] of Object.entries(mockRoleHeaders())) headers.set(k, v);
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers, cache: "no-store" });
  } catch {
    throw new ApiError(0, "network_error");
  }
  if (!res.ok) {
    let code = `http_${res.status}`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (body && typeof body.error === "string") code = body.error;
    } catch {
      // non-JSON error body; keep the http_ code
    }
    throw new ApiError(res.status, code);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function authed<T>(getIdToken: TokenGetter, path: string, init?: RequestInit): Promise<T> {
  const token = await getIdToken();
  if (!token) throw new ApiError(401, "not_signed_in");
  return request<T>(token, path, init);
}

function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// ---- Merchant fetchers ---------------------------------------------------------

export function fetchProfile(getIdToken: TokenGetter, merchantId?: string): Promise<ProfileResponse> {
  const qs = merchantId ? `?merchantId=${encodeURIComponent(merchantId)}` : "";
  return authed<ProfileResponse>(getIdToken, `/api/merchant/profile${qs}`);
}

export function listMyRequests(getIdToken: TokenGetter): Promise<ChangeRequestListResponse> {
  return authed<ChangeRequestListResponse>(getIdToken, "/api/merchant/change-requests");
}

export function createChangeRequest(
  getIdToken: TokenGetter,
  input: ChangeRequestInput,
  files: File[]
): Promise<ChangeRequestCreateResponse> {
  const form = new FormData();
  form.append("payload", JSON.stringify(input));
  for (const f of files) form.append("files", f, f.name);
  // No Content-Type header: the browser sets the multipart boundary.
  return authed<ChangeRequestCreateResponse>(getIdToken, "/api/merchant/change-requests", {
    method: "POST",
    body: form,
  });
}

// ---- Admin fetchers --------------------------------------------------------------

export function adminListRequests(
  getIdToken: TokenGetter,
  params: { status?: ChangeRequestStatus; merchantId?: string } = {}
): Promise<ChangeRequestListResponse> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.merchantId) qs.set("merchantId", params.merchantId);
  const q = qs.toString();
  return authed<ChangeRequestListResponse>(getIdToken, `/api/merchant/admin/change-requests${q ? `?${q}` : ""}`);
}

/** The contract doesn't pin a PATCH response body; accept `{request}` or nothing. */
export async function adminUpdateRequest(
  getIdToken: TokenGetter,
  id: string,
  update: ChangeRequestStatusUpdate
): Promise<ChangeRequest | null> {
  const res = await authed<{ request?: ChangeRequest } | ChangeRequest | undefined>(
    getIdToken,
    `/api/merchant/admin/change-requests/${encodeURIComponent(id)}`,
    jsonInit("PATCH", update)
  );
  if (!res) return null;
  if ("request" in res && res.request) return res.request;
  if ("id" in res && "status" in res) return res as ChangeRequest;
  return null;
}

export function adminListMerchants(getIdToken: TokenGetter): Promise<MerchantListResponse> {
  return authed<MerchantListResponse>(getIdToken, "/api/merchant/admin/merchants");
}

export function adminGetMerchant(getIdToken: TokenGetter, id: string): Promise<AdminMerchantResponse> {
  return authed<AdminMerchantResponse>(getIdToken, `/api/merchant/admin/merchants/${encodeURIComponent(id)}`);
}

export function adminSaveMerchant(
  getIdToken: TokenGetter,
  id: string,
  update: AdminMerchantUpdate
): Promise<AdminMerchantUpdateResponse> {
  return authed<AdminMerchantUpdateResponse>(
    getIdToken,
    `/api/merchant/admin/merchants/${encodeURIComponent(id)}`,
    jsonInit("PUT", update)
  );
}

export function adminUploadAsset(getIdToken: TokenGetter, merchantId: string, file: File): Promise<AdminAssetResponse> {
  const form = new FormData();
  form.append("file", file, file.name);
  return authed<AdminAssetResponse>(getIdToken, `/api/merchant/admin/merchants/${encodeURIComponent(merchantId)}/assets`, {
    method: "POST",
    body: form,
  });
}

export function adminAssetFromAttachment(
  getIdToken: TokenGetter,
  merchantId: string,
  requestId: string,
  attachmentId: string
): Promise<AdminAssetResponse> {
  return authed<AdminAssetResponse>(
    getIdToken,
    `/api/merchant/admin/merchants/${encodeURIComponent(merchantId)}/assets`,
    jsonInit("POST", { fromAttachment: { requestId, attachmentId } })
  );
}

// ---- Client-side file checks (mirror of CHANGE_REQUEST_LIMITS) -------------------

const HEIC_EXT = /\.(heic|heif)$/i;
const SVG = /svg/i;

function mb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/**
 * Filters `incoming` against the limits, given `current` already accepted.
 * Returns the files to add plus one friendly message per problem.
 * HEIC from some browsers arrives with an empty `type`; it is re-typed from
 * its extension so the server's allowlist sees what it expects.
 */
export function checkImageFiles(
  current: File[],
  incoming: File[],
  maxFiles: number = CHANGE_REQUEST_LIMITS.maxFiles
): { accepted: File[]; errors: string[] } {
  const allowed = CHANGE_REQUEST_LIMITS.allowedTypes as readonly string[];
  const accepted: File[] = [];
  const errors: string[] = [];
  let room = maxFiles - current.length;
  for (const raw of incoming) {
    let f = raw;
    if (!f.type && HEIC_EXT.test(f.name)) {
      f = new File([f], f.name, { type: f.name.toLowerCase().endsWith(".heif") ? "image/heif" : "image/heic", lastModified: f.lastModified });
    }
    const dupe = [...current, ...accepted].some((c) => c.name === f.name && c.size === f.size && c.lastModified === f.lastModified);
    if (dupe) continue;
    if (SVG.test(f.type) || /\.svg$/i.test(f.name)) {
      errors.push(`${f.name}: SVG files aren't supported. Use PNG, JPG, WebP or HEIC.`);
      continue;
    }
    if (!allowed.includes(f.type)) {
      errors.push(`${f.name}: only PNG, JPG, WebP or HEIC pictures.`);
      continue;
    }
    if (f.size > CHANGE_REQUEST_LIMITS.maxFileBytes) {
      errors.push(`${f.name} is over ${mb(CHANGE_REQUEST_LIMITS.maxFileBytes)}. Try a smaller picture.`);
      continue;
    }
    if (room <= 0) {
      errors.push(`You can attach up to ${maxFiles} picture${maxFiles === 1 ? "" : "s"}.`);
      break;
    }
    accepted.push(f);
    room -= 1;
  }
  return { accepted, errors };
}

export const IMAGE_ACCEPT = (CHANGE_REQUEST_LIMITS.allowedTypes as readonly string[]).join(",") + ",.heic,.heif";

// ---- Upload preparation (Vercel rejects request bodies over 4.5 MB) ---------------

/** Server (and Vercel) reject bodies over 4.5 MB; stay well under that. */
export const MAX_UPLOAD_BYTES_TOTAL = 4_000_000;

const PREPARE_SKIP_BYTES = 800 * 1024;
const PREPARE_MAX_DIMENSION = 2000;
const PREPARE_STEP_QUALITIES = [0.85, 0.75, 0.65] as const;

type Decoded = ImageBitmap | HTMLImageElement;

function decodedSize(d: Decoded): { width: number; height: number } {
  if (d instanceof HTMLImageElement) return { width: d.naturalWidth || d.width, height: d.naturalHeight || d.height };
  return { width: d.width, height: d.height };
}

function decodeViaImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_decode_failed"));
    };
    img.src = url;
  });
}

async function decodeImage(file: File): Promise<Decoded> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Falls through to the <img> path (older Safari, some HEIC sources).
    }
  }
  return decodeViaImageElement(file);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

/** Encodes at each quality in turn, stopping as soon as the result fits. Returns the last try if none fit. */
async function encodeStepped(canvas: HTMLCanvasElement, type: string, maxBytes: number): Promise<Blob | null> {
  let last: Blob | null = null;
  for (const q of PREPARE_STEP_QUALITIES) {
    const blob = await canvasToBlob(canvas, type, q);
    if (!blob) return last;
    last = blob;
    if (blob.size <= maxBytes) return blob;
  }
  return last;
}

function blobToFile(blob: Blob, originalName: string, ext: string): File {
  const stem = (originalName.replace(/\.[^./\\]+$/, "") || "image").trim();
  return new File([blob], `${stem}.${ext}`, { type: blob.type, lastModified: Date.now() });
}

/**
 * Downscales + re-encodes an oversized image so it clears Vercel's ~4.5 MB
 * request body ceiling. Files already small enough are returned untouched;
 * decode failures (e.g. HEIC in Chrome) also return the original file, since
 * the server still accepts it as-is.
 */
export async function prepareImageForUpload(
  file: File,
  opts: { maxBytes?: number; maxDimension?: number } = {}
): Promise<File> {
  const maxBytes = opts.maxBytes ?? PREPARE_SKIP_BYTES;
  const maxDimension = opts.maxDimension ?? PREPARE_MAX_DIMENSION;
  const type = file.type.toLowerCase();
  const isPng = type === "image/png";
  const isJpeg = type === "image/jpeg";
  const isWebp = type === "image/webp";

  if (file.size <= maxBytes && (isPng || isJpeg || isWebp)) return file;

  try {
    const decoded = await decodeImage(file);
    try {
      const { width, height } = decodedSize(decoded);
      if (!width || !height) return file;
      const longEdge = Math.max(width, height);
      const scale = longEdge > maxDimension ? maxDimension / longEdge : 1;
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.drawImage(decoded as CanvasImageSource, 0, 0, targetW, targetH);

      if (isPng) {
        const pngBlob = await canvasToBlob(canvas, "image/png");
        if (pngBlob && pngBlob.size <= maxBytes) return blobToFile(pngBlob, file.name, "png");
      }

      const webpProbe = await canvasToBlob(canvas, "image/webp", PREPARE_STEP_QUALITIES[0]);
      if (webpProbe && webpProbe.type === "image/webp") {
        const webpBlob = webpProbe.size <= maxBytes ? webpProbe : (await encodeStepped(canvas, "image/webp", maxBytes)) ?? webpProbe;
        return blobToFile(webpBlob, file.name, "webp");
      }

      const jpegBlob = await encodeStepped(canvas, "image/jpeg", maxBytes);
      if (jpegBlob) return blobToFile(jpegBlob, file.name, "jpg");
      return file;
    } finally {
      if (!(decoded instanceof HTMLImageElement) && typeof decoded.close === "function") decoded.close();
    }
  } catch {
    return file;
  }
}

// ---- URL safety (record values are merchant data) ---------------------------------

/** http(s) URL as a normalized string, else null. For <a href>. */
export function safeHttpUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(candidate);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

/** Image src allowlist: http(s), blob: previews, and data:image (mock attachments). */
export function safeImageSrc(value: string | undefined | null): string | null {
  if (!value) return null;
  const v = value.trim();
  if (/^data:image\/(png|jpe?g|webp|gif|heic|heif);/i.test(v)) return v;
  if (v.startsWith("blob:")) return v;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:" ? u.href : null;
  } catch {
    return null;
  }
}

// ---- Firestore normalization -----------------------------------------------------

function isTimestampLike(v: unknown): v is { toDate: () => Date } {
  return typeof v === "object" && v !== null && typeof (v as { toDate?: unknown }).toDate === "function";
}

/**
 * The server writes ISO strings, but a Firestore console edit (or a future
 * writer) can leave a Timestamp. Convert any top-level Timestamp so the UI
 * only ever sees the contract's string shape.
 */
function normalizeRecord(data: Record<string, unknown>, id: string): MerchantRecord {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) out[k] = isTimestampLike(v) ? v.toDate().toISOString() : v;
  out.id = typeof out.id === "string" && out.id ? out.id : id;
  out.version = typeof out.version === "number" ? out.version : Number(out.version) || 0;
  if (typeof out.updatedAt !== "string") out.updatedAt = "";
  if (typeof out.name !== "string") out.name = "";
  return out as unknown as MerchantRecord;
}

// ---- Hooks -------------------------------------------------------------------------

export interface LoadState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  /** `quiet` keeps the current data and swallows errors (background refresh). */
  reload: (opts?: { quiet?: boolean }) => Promise<void>;
}

function useLoader<T>(load: () => Promise<T>, deps: unknown[], enabled = true): LoadState<T> & { setData: (d: T | null) => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(enabled);
  const seq = useRef(0);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async (opts?: { quiet?: boolean }) => {
    const id = ++seq.current;
    if (!opts?.quiet) {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await loadRef.current();
      if (seq.current === id) {
        setData(res);
        setError(null);
      }
    } catch (e) {
      if (seq.current === id && !opts?.quiet) setError(toApiError(e));
    } finally {
      if (seq.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    reload();
    // Not a DOM ref: bumping the counter on cleanup is how an in-flight
    // response from a previous run gets ignored.
    const counter = seq;
    return () => {
      counter.current++;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reload, ...deps]);

  return { data, error, loading, reload, setData };
}

/** GET /api/merchant/profile. `merchantId` only works for admins. */
export function useProfile(getIdToken: TokenGetter, merchantId?: string) {
  return useLoader(
    () => {
      syncMockRoleFromUrl();
      return fetchProfile(getIdToken, merchantId);
    },
    [getIdToken, merchantId]
  );
}

/** GET /api/merchant/change-requests, refreshed quietly on window focus. */
export function useMyRequests(getIdToken: TokenGetter, enabled = true) {
  const state = useLoader(() => listMyRequests(getIdToken), [getIdToken], enabled);
  const { reload } = state;
  useEffect(() => {
    if (!enabled) return;
    const onFocus = () => void reload({ quiet: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [enabled, reload]);
  return state;
}

export type LiveMode = "firestore" | "polling" | "off";

const POLL_MS = 15_000;
const MIN_REFETCH_GAP_MS = 2_000;

/**
 * Keeps the merchant's record current without a manual reload.
 *   source "firestore": onSnapshot on papexv2 `merchants/{merchantId}`
 *     (public read). If the listener errors (rules, offline, blocked), it
 *     falls back to polling rather than silently going stale.
 *   source "mock": refetch via `refetch` on window focus and every 15s
 *     (only while the tab is visible).
 * Returns whichever of snapshot / fetched record has the higher version.
 */
export function useLiveMerchantRecord(
  resp: ProfileResponse | null,
  refetch: () => void
): { record: MerchantRecord | null; mode: LiveMode } {
  const merchantId = resp?.merchantId ?? null;
  const source = resp?.source ?? null;
  const [snap, setSnap] = useState<MerchantRecord | null>(null);
  const [mode, setMode] = useState<LiveMode>("off");
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  });

  useEffect(() => {
    setSnap(null);
    if (!merchantId || !source) {
      setMode("off");
      return;
    }
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    let stopPolling: (() => void) | null = null;
    let last = 0;

    const kick = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - last < MIN_REFETCH_GAP_MS) return;
      last = now;
      refetchRef.current();
    };

    const startPolling = () => {
      if (cancelled || stopPolling) return;
      setMode("polling");
      const interval = window.setInterval(kick, POLL_MS);
      window.addEventListener("focus", kick);
      document.addEventListener("visibilitychange", kick);
      stopPolling = () => {
        window.clearInterval(interval);
        window.removeEventListener("focus", kick);
        document.removeEventListener("visibilitychange", kick);
      };
    };

    if (source === "firestore") {
      (async () => {
        try {
          const [{ doc, onSnapshot }, { getPapexV2Firestore }] = await Promise.all([
            import("firebase/firestore"),
            import("./firebaseClientApp"),
          ]);
          if (cancelled) return;
          const db = await getPapexV2Firestore();
          if (cancelled) return;
          unsubscribe = onSnapshot(
            doc(db, "merchants", merchantId),
            (s) => {
              if (cancelled || !s.exists()) return;
              setSnap(normalizeRecord(s.data() as Record<string, unknown>, merchantId));
              setMode("firestore");
            },
            () => {
              unsubscribe?.();
              unsubscribe = null;
              startPolling();
            }
          );
        } catch {
          startPolling();
        }
      })();
    } else {
      startPolling();
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
      stopPolling?.();
    };
  }, [merchantId, source]);

  const base = resp?.profile ?? null;
  const record = snap && base ? (snap.version >= base.version ? snap : base) : (snap ?? base);
  return { record, mode };
}
