/**
 * Optimized Base64 Storage
 * 
 * This keeps images as base64 in Firestore but with aggressive compression
 * to minimize document size. This is the simplest free option with zero setup.
 */

import imageCompression from 'browser-image-compression'

/**
 * Aggressively compresses an image for base64 storage
 * Target: < 200KB to stay well under Firestore 1MB limit
 */
export async function compressImageForBase64(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.2, // Maximum 200KB (aggressive compression)
    maxWidthOrHeight: 1200, // Smaller max size for base64
    useWebWorker: true,
    fileType: file.type,
    initialQuality: 0.7, // Lower quality for smaller size
  }

  try {
    const compressedFile = await imageCompression(file, options)
    console.log('Image compressed for base64:', {
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
 * Converts File to optimized base64
 */
export async function fileToOptimizedBase64(file: File): Promise<string> {
  // Compress first
  const compressedFile = await compressImageForBase64(file)
  
  // Convert to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(compressedFile)
  })
}

/**
 * Detects if an image URL is base64
 */
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/')
}

/**
 * Detects if an image URL is a regular URL
 */
export function isUrlImage(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
}

