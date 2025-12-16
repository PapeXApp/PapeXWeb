/**
 * Vercel Blob Storage Upload Utility
 * 
 * Free tier: 1GB storage, 100GB bandwidth/month
 * Perfect for blog images!
 */

import { put } from '@vercel/blob'
import imageCompression from 'browser-image-compression'

/**
 * Compresses an image file before upload
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5, // Maximum file size in MB (500KB)
    maxWidthOrHeight: 1920, // Maximum width or height
    useWebWorker: true,
    fileType: file.type,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    console.log('Image compressed:', {
      original: `${(file.size / 1024).toFixed(2)} KB`,
      compressed: `${(compressedFile.size / 1024).toFixed(2)} KB`,
      reduction: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
    })
    return compressedFile
  } catch (error) {
    console.warn('Image compression failed, using original:', error)
    return file
  }
}

/**
 * Uploads an image to Vercel Blob Storage
 * Returns the public URL
 */
export async function uploadImageToVercelBlob(
  file: File,
  path: string = 'blog-images'
): Promise<string> {
  try {
    // Compress image before upload
    const compressedFile = await compressImage(file)
    
    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${path}/${timestamp}-${sanitizedFileName}`

    console.log('Uploading image to Vercel Blob Storage...', fileName)
    
    // Upload to Vercel Blob
    // Note: This requires a server-side API route or server action
    // We'll create an API route for this
    const formData = new FormData()
    formData.append('file', compressedFile)
    formData.append('filename', fileName)

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Image uploaded successfully:', data.url)
    
    return data.url
  } catch (error) {
    console.error('Error uploading image to Vercel Blob:', error)
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Uploads a base64 image to Vercel Blob Storage
 * Used during migration of existing blog posts
 */
export async function uploadBase64ToVercelBlob(
  base64: string,
  filename: string = 'migrated-image.jpg',
  path: string = 'blog-images'
): Promise<string> {
  try {
    // Convert base64 to File
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image format')
    }

    const mimeType = matches[1]
    const base64Data = matches[2]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })
    const file = new File([blob], filename, { type: mimeType })

    return await uploadImageToVercelBlob(file, path)
  } catch (error) {
    console.error('Error uploading base64 image to Vercel Blob:', error)
    throw error
  }
}

