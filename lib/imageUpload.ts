import { storage } from '@/firebase/firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
// @ts-ignore - browser-image-compression doesn't have perfect TypeScript support
import imageCompression from 'browser-image-compression'

/**
 * Detects if an image URL is a base64 data URL
 */
export function isBase64Image(url: string): boolean {
  return url.startsWith('data:image/')
}

/**
 * Detects if an image URL is a Firebase Storage URL
 */
export function isStorageUrl(url: string): boolean {
  return url.startsWith('https://firebasestorage.googleapis.com/') ||
         url.startsWith('https://storage.googleapis.com/')
}

/**
 * Detects if an image URL is a local path (static asset)
 */
export function isLocalPath(url: string): boolean {
  return url.startsWith('/')
}

/**
 * Compresses an image file before upload
 * Maintains aspect ratio and reduces file size
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5, // Maximum file size in MB (500KB)
    maxWidthOrHeight: 1920, // Maximum width or height
    useWebWorker: true, // Use web worker for better performance
    fileType: file.type, // Preserve original file type
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
    return file // Return original if compression fails
  }
}

/**
 * Uploads an image file to Firebase Storage
 * Returns the public download URL
 */
export async function uploadImageToStorage(
  file: File,
  path: string = 'blog-images'
): Promise<string> {
  try {
    // Compress image before upload
    const compressedFile = await compressImage(file)
    
    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${sanitizedFileName}`
    const imageRef = ref(storage, `${path}/${fileName}`)

    // Upload to Firebase Storage
    console.log('Uploading image to Firebase Storage...', fileName)
    const snapshot = await uploadBytes(imageRef, compressedFile)
    
    // Get public download URL
    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log('Image uploaded successfully:', downloadURL)
    
    return downloadURL
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error)
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Converts a base64 data URL to a File object
 * Used for migrating existing base64 images to Storage
 */
export function base64ToFile(base64: string, filename: string = 'image.jpg'): File {
  // Extract base64 data and mime type
  const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image format')
  }

  const mimeType = matches[1]
  const base64Data = matches[2]
  
  // Convert base64 to binary
  const byteCharacters = atob(base64Data)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  
  // Create File object
  const blob = new Blob([byteArray], { type: mimeType })
  return new File([blob], filename, { type: mimeType })
}

/**
 * Uploads a base64 image to Firebase Storage
 * Used during migration of existing blog posts
 */
export async function uploadBase64ToStorage(
  base64: string,
  filename: string = 'migrated-image.jpg',
  path: string = 'blog-images'
): Promise<string> {
  try {
    const file = base64ToFile(base64, filename)
    return await uploadImageToStorage(file, path)
  } catch (error) {
    console.error('Error uploading base64 image to Storage:', error)
    throw error
  }
}

