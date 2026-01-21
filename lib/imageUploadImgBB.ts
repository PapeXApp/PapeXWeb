/**
 * ImgBB Free Image Hosting API
 * 
 * Completely free, no account required
 * Simple REST API
 */

import imageCompression from 'browser-image-compression'

/**
 * Compresses an image file before upload
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: file.type,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.warn('Image compression failed, using original:', error)
    return file
  }
}

/**
 * Converts File to base64 for ImgBB API
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] // Remove data:image/...;base64, prefix
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads an image to ImgBB (free image hosting)
 * 
 * Note: You'll need to get a free API key from https://api.imgbb.com/
 * It's free and takes 2 minutes to get
 */
export async function uploadImageToImgBB(
  file: File,
  apiKey?: string
): Promise<string> {
  try {
    // Compress image first
    const compressedFile = await compressImage(file)
    
    // Convert to base64
    const base64 = await fileToBase64(compressedFile)

    // Get API key from environment or parameter
    const imgbbApiKey = apiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY
    console.log('IMGBB KEY:', process.env.NEXT_PUBLIC_IMGBB_API_KEY)

    
    if (!imgbbApiKey) {
      throw new Error('ImgBB API key not found. Get one free at https://api.imgbb.com/')
    }

    console.log('Uploading image to ImgBB...')

    // Upload to ImgBB
    const formData = new FormData()
    formData.append('key', imgbbApiKey)
    formData.append('image', base64)

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`ImgBB upload failed: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success || !data.data?.url) {
      throw new Error('ImgBB upload failed: Invalid response')
    }

    console.log('Image uploaded successfully to ImgBB:', data.data.url)
    return data.data.url
  } catch (error) {
    console.error('Error uploading image to ImgBB:', error)
    throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Uploads a base64 image to ImgBB
 */
export async function uploadBase64ToImgBB(
  base64: string,
  apiKey?: string
): Promise<string> {
  try {
    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64

    const imgbbApiKey = apiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY
    
    if (!imgbbApiKey) {
      throw new Error('ImgBB API key not found')
    }

    const formData = new FormData()
    formData.append('key', imgbbApiKey)
    formData.append('image', base64Data)

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`ImgBB upload failed: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.success || !data.data?.url) {
      throw new Error('ImgBB upload failed: Invalid response')
    }

    return data.data.url
  } catch (error) {
    console.error('Error uploading base64 image to ImgBB:', error)
    throw error
  }
}

