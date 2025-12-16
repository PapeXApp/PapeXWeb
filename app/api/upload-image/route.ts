/**
 * API Route for uploading images to Vercel Blob Storage
 * 
 * This is a server-side route that handles the actual upload
 * since Vercel Blob requires server-side access tokens
 */

import { put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is available
    const token = process.env.BLOB_READ_WRITE_TOKEN
    
    if (!token) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN not configured. Add it in Vercel dashboard or .env.local' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: 'public', // Make images publicly accessible
      addRandomSuffix: false, // Use the filename we provided
      token, // Use the token from environment
    })

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
    })
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

