/**
 * Storage Configuration
 * 
 * Choose your storage provider by setting STORAGE_PROVIDER environment variable:
 * - 'vercel' - Vercel Blob Storage (recommended, free tier: 1GB storage, 100GB bandwidth)
 * - 'imgbb' - ImgBB API (completely free, requires API key)
 * - 'base64' - Optimized base64 in Firestore (100% free, zero setup)
 * 
 * Default: 'base64' (works immediately, no setup needed)
 */

export type StorageProvider = 'vercel' | 'imgbb' | 'base64'

export const STORAGE_PROVIDER: StorageProvider = 
  (process.env.NEXT_PUBLIC_STORAGE_PROVIDER as StorageProvider) || 'vercel'

