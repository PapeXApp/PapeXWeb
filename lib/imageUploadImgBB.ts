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
    fileType: file.type || 'image/jpeg'
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
      const base64 = (reader.result as string).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Uploads an image to ImgBB (free image hosting)
 */
export async function uploadImageToImgBB(
  file: File,
  apiKey?: string
): Promise<string> {
  try {
    const compressedFile = await compressImage(file)
    const base64 = await fileToBase64(compressedFile)

    const imgbbApiKey =
      apiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY

    if (!imgbbApiKey) {
      throw new Error('ImgBB API key not found')
    }

    const formData = new FormData()
    formData.append('key', imgbbApiKey)
    formData.append('image', base64)

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    const url =
      data?.data?.url ||
      data?.data?.display_url ||
      data?.data?.image?.url

    if (!url) {
      console.error('ImgBB response:', data)
      throw new Error('ImgBB upload failed: No valid URL returned')
    }

    return url
  } catch (error) {
    console.error('Error uploading image to ImgBB:', error)
    throw new Error(
      `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'
      }`
    )
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
    const base64Data = base64.includes(',')
      ? base64.split(',')[1]
      : base64

    const imgbbApiKey =
      apiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY

    if (!imgbbApiKey) {
      throw new Error('ImgBB API key not found')
    }

    const formData = new FormData()
    formData.append('key', imgbbApiKey)
    formData.append('image', base64Data)

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    })

    const data = await response.json()

    const url =
      data?.data?.url ||
      data?.data?.display_url ||
      data?.data?.image?.url

    if (!url) {
      console.error('ImgBB response:', data)
      throw new Error('ImgBB upload failed: No valid URL returned')
    }

    return url
  } catch (error) {
    console.error('Error uploading base64 image to ImgBB:', error)
    throw error
  }
}
