/**
 * API Route for uploading blog images to Vercel Blob Storage
 *
 * Server-side because Vercel Blob requires the read/write token. Blobs are
 * public, so the route only accepts blog admins (verified Firebase ID token in
 * `Authorization: Bearer`), raster images up to MAX_UPLOAD_BYTES, and always
 * writes under blog-images/ - see lib/uploadImageGuard.ts.
 */

import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import {
  MAX_UPLOAD_BYTES,
  buildBlobPathname,
  sniffImageType,
  verifyAdminRequest,
} from '@/lib/uploadImageGuard'

export async function POST(request: NextRequest) {
  try {
    // Only blog admins may write public blobs - check before anything else
    const auth = await verifyAdminRequest(request.headers.get('authorization'))
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    // Check if BLOB_READ_WRITE_TOKEN is available
    const token = process.env.BLOB_READ_WRITE_TOKEN

    if (!token) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN not configured. Add it in Vercel dashboard or .env.local' },
        { status: 500 }
      )
    }

    // Reject oversized bodies before buffering them (multipart overhead is
    // small; the per-file check below is the real limit)
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (contentLength > MAX_UPLOAD_BYTES + 64 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const filename = formData.get('filename')

    if (!(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const image = sniffImageType(bytes)
    if (!image) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, GIF and WebP images are allowed' },
        { status: 415 }
      )
    }

    const pathname = buildBlobPathname(typeof filename === 'string' ? filename : null, image)

    // Upload to Vercel Blob Storage
    const blob = await put(pathname, Buffer.from(bytes), {
      access: 'public', // Make images publicly accessible
      addRandomSuffix: true, // Unguessable, never collides with an existing blob
      allowOverwrite: false,
      contentType: image.contentType, // From the sniffed bytes, not the client
      token, // Use the token from environment
    })

    console.log('Blog image uploaded', { uid: auth.uid, pathname: blob.pathname })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    })
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
