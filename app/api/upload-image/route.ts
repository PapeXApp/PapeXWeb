/**
 * API Route for uploading blog images to Vercel Blob Storage
 *
 * Server-side because Vercel Blob needs the BLOB_READ_WRITE_TOKEN secret.
 * Locked down: the caller must be a signed-in blog admin (Firebase ID token of
 * papexweb-aed97, see lib/blogUploadAuth.ts), the file must be a raster image
 * (JPEG/PNG/WebP/GIF/AVIF, checked by magic bytes, never SVG) of at most
 * MAX_UPLOAD_BYTES, and the stored pathname is built here, not taken verbatim
 * from the client.
 */

import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { BlogUploadAuthError, requireBlogUploader } from '@/lib/blogUploadAuth'

export const runtime = 'nodejs'

/** Below Vercel's 4.5MB function body cap; the client compresses to ~0.5MB. */
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

type AllowedType = { mime: string; ext: string }

/** Identify the image by its bytes; the client's File.type is not trusted. */
function sniffImageType(b: Uint8Array): AllowedType | null {
  const at = (offset: number, sig: number[]) => sig.every((v, i) => b[offset + i] === v)
  const ascii = (offset: number, s: string) => at(offset, [...s].map((c) => c.charCodeAt(0)))
  if (at(0, [0xff, 0xd8, 0xff])) return { mime: 'image/jpeg', ext: 'jpg' }
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: 'image/png', ext: 'png' }
  if (ascii(0, 'GIF87a') || ascii(0, 'GIF89a')) return { mime: 'image/gif', ext: 'gif' }
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP')) return { mime: 'image/webp', ext: 'webp' }
  if (ascii(4, 'ftyp') && (ascii(8, 'avif') || ascii(8, 'avis'))) return { mime: 'image/avif', ext: 'avif' }
  return null
}

/** `blog-images/<safe-stem>.<ext>`: fixed prefix, no traversal, extension matches the bytes. */
function buildPathname(requested: string | null, fallbackName: string, ext: string): string {
  const base = (requested || fallbackName || 'image').split('/').pop() ?? 'image'
  const stem = base.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 100) || 'image'
  return `blog-images/${stem}.${ext}`
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: NextRequest) {
  try {
    // Auth first: before reading the body or revealing any config state.
    const uploader = await requireBlogUploader(request.headers.get('authorization'))

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return jsonError(500, 'BLOB_READ_WRITE_TOKEN not configured. Add it in Vercel dashboard or .env.local')
    }

    const declaredLength = Number(request.headers.get('content-length') ?? '0')
    if (declaredLength > MAX_UPLOAD_BYTES + 64 * 1024) {
      return jsonError(413, `Image too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`)
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const filename = formData.get('filename')

    if (!(file instanceof File) || file.size === 0) {
      return jsonError(400, 'No file provided')
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError(413, `Image too large (max ${MAX_UPLOAD_BYTES / 1024 / 1024}MB).`)
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const type = sniffImageType(bytes)
    if (!type) {
      return jsonError(415, 'Unsupported file type. Upload a JPEG, PNG, WebP, GIF or AVIF image (no SVG).')
    }

    const pathname = buildPathname(typeof filename === 'string' ? filename : null, file.name, type.ext)
    const blob = await put(pathname, Buffer.from(bytes), {
      access: 'public',
      addRandomSuffix: true, // unguessable, never collides with or overwrites an existing blob
      contentType: type.mime,
      token,
    })

    console.log('upload-image: stored', blob.pathname, 'for', uploader.email)
    return NextResponse.json({ url: blob.url, pathname: blob.pathname })
  } catch (error) {
    if (error instanceof BlogUploadAuthError) {
      return jsonError(error.status, error.message)
    }
    console.error('Error uploading to Vercel Blob:', error)
    return jsonError(500, 'Failed to upload image')
  }
}
