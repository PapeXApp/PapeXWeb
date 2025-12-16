/**
 * Blog Service with Free Storage Options
 * 
 * Supports multiple free storage providers:
 * - Vercel Blob Storage (recommended)
 * - ImgBB API
 * - Optimized Base64 (current approach, improved)
 */

import { db } from '@/firebase/firebaseConfig'
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { STORAGE_PROVIDER } from './storageConfig'
import { uploadImageToVercelBlob, uploadBase64ToVercelBlob } from './imageUploadVercel'
import { uploadImageToImgBB, uploadBase64ToImgBB } from './imageUploadImgBB'
import { fileToOptimizedBase64, isBase64Image, isUrlImage } from './imageUploadOptimized'

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  image: string
  slug: string
  readTime: string
  createdAt: any
  published: boolean
  imageProvider?: 'vercel' | 'imgbb' | 'base64' // Track which provider was used
}

export interface CreateBlogPost {
  title: string
  excerpt: string
  content: string
  image?: File | string
  readTime: string
  published: boolean
}

const COLLECTION_NAME = 'blogs'

/**
 * Uploads an image using the configured storage provider
 */
async function uploadImage(file: File): Promise<string> {
  switch (STORAGE_PROVIDER) {
    case 'vercel':
      return await uploadImageToVercelBlob(file)
    
    case 'imgbb':
      return await uploadImageToImgBB(file)
    
    case 'base64':
    default:
      return await fileToOptimizedBase64(file)
  }
}

/**
 * Uploads a base64 image using the configured storage provider
 */
async function uploadBase64Image(base64: string, filename?: string): Promise<string> {
  switch (STORAGE_PROVIDER) {
    case 'vercel':
      return await uploadBase64ToVercelBlob(base64, filename)
    
    case 'imgbb':
      return await uploadBase64ToImgBB(base64)
    
    case 'base64':
    default:
      // Already base64, just return it
      return base64
  }
}

/**
 * Detects the format of an existing image URL
 */
function detectImageFormat(url: string): 'vercel' | 'imgbb' | 'base64' | 'local' | 'unknown' {
  if (url.startsWith('https://') && url.includes('blob.vercel-storage.com')) {
    return 'vercel'
  }
  if (url.startsWith('https://') && url.includes('i.ibb.co')) {
    return 'imgbb'
  }
  if (isBase64Image(url)) {
    return 'base64'
  }
  if (url.startsWith('/')) {
    return 'local'
  }
  return 'unknown'
}

export const blogService = {
  async createBlog(blogData: CreateBlogPost): Promise<string> {
    try {
      console.log('Starting blog creation...', blogData.title)
      console.log('Storage provider:', STORAGE_PROVIDER)
      
      let imageUrl = ''
      
      // Upload image if provided
      if (blogData.image) {
        if (typeof blogData.image === 'string') {
          // String provided - could be base64, URL, or local path
          if (isBase64Image(blogData.image)) {
            console.log('Using provided base64 image')
            imageUrl = blogData.image
          } else if (isUrlImage(blogData.image) || blogData.image.startsWith('/')) {
            console.log('Using provided image URL/path')
            imageUrl = blogData.image
          } else {
            console.warn('Unknown image format, using default')
            imageUrl = '/blog/blog_image.png'
          }
        } else {
          // New file upload - use configured storage provider
          console.log('Uploading new image...', blogData.image.name)
          try {
            imageUrl = await uploadImage(blogData.image)
            console.log('Image uploaded successfully:', imageUrl.substring(0, 50) + '...')
          } catch (uploadError) {
            console.error('Upload failed, using default:', uploadError)
            imageUrl = '/blog/blog_image.png'
          }
        }
      } else {
        // Use default image when no image is provided
        imageUrl = '/blog/blog_image.png'
      }

      // Generate slug from title
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const blogDoc = {
        title: blogData.title,
        excerpt: blogData.excerpt,
        content: blogData.content,
        image: imageUrl,
        slug,
        readTime: blogData.readTime,
        published: blogData.published,
        createdAt: serverTimestamp(),
        imageProvider: STORAGE_PROVIDER
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), blogDoc)
      console.log('Blog created successfully with ID:', docRef.id)

      return docRef.id
    } catch (error) {
      console.error('Error creating blog:', error)
      throw error
    }
  },

  async getBlogs(): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[]
    } catch (error) {
      console.error('Error getting blogs:', error)
      return []
    }
  },

  async getPublishedBlogs(): Promise<BlogPost[]> {
    try {
      const blogs = await this.getBlogs()
      return blogs.filter(blog => blog.published)
    } catch (error) {
      console.error('Error getting published blogs:', error)
      return []
    }
  },

  async getBlogById(id: string): Promise<BlogPost | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as BlogPost
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting blog by ID:', error)
      return null
    }
  },

  async updateBlog(id: string, blogData: Partial<CreateBlogPost>): Promise<void> {
    try {
      console.log('Starting blog update...', id)
      
      const existingBlog = await this.getBlogById(id)
      let imageUrl: string | undefined = undefined
      
      // Handle image update if provided
      if (blogData.image !== undefined) {
        if (typeof blogData.image === 'string') {
          // String provided
          if (isBase64Image(blogData.image)) {
            imageUrl = blogData.image
          } else if (isUrlImage(blogData.image) || blogData.image.startsWith('/')) {
            imageUrl = blogData.image
          } else {
            imageUrl = existingBlog?.image || '/blog/blog_image.png'
          }
        } else {
          // New file upload
          try {
            imageUrl = await uploadImage(blogData.image)
          } catch (uploadError) {
            console.error('Upload failed, keeping existing image:', uploadError)
            imageUrl = existingBlog?.image
          }
        }
      } else if (blogData.image === null || (existingBlog && !existingBlog.image)) {
        imageUrl = '/blog/blog_image.png'
      }

      let updateData: any = { ...blogData }
      
      if (blogData.title) {
        updateData.slug = blogData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }

      if (imageUrl !== undefined) {
        updateData.image = imageUrl
        updateData.imageProvider = STORAGE_PROVIDER
      }

      updateData.updatedAt = serverTimestamp()

      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, updateData)
      console.log('Blog updated successfully:', id)
    } catch (error) {
      console.error('Error updating blog:', error)
      throw error
    }
  }
}

