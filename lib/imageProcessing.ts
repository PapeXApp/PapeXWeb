interface ProcessedImage {
  previewUrl: string
  base64Data: string
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Simply converts a File to a base64 data URL without enforcing a specific size.
 * This keeps the original image dimensions/aspect ratio intact.
 */
export async function fileToBase64(file: File): Promise<ProcessedImage> {
  const processedDataUrl = await readFileAsDataURL(file)
  return {
    previewUrl: processedDataUrl,
    base64Data: processedDataUrl,
  }
}

