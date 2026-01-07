import { db } from '@/firebase/firebaseConfig'
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore'
import { uploadImageToImgBB } from './imageUploadImgBB'
import { 
  isBase64Image, 
  isStorageUrl, 
  isLocalPath 
} from './imageUpload'
import { fileToBase64 } from './imageProcessing'

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
  imageMigrated?: boolean // Flag to track if image was migrated from base64
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

export const blogService = {
  async createBlog(blogData: CreateBlogPost): Promise<string> {
    try {
      console.log('Starting blog creation...', blogData.title)
      let imageUrl = ''
      
      // Upload image if provided
      if (blogData.image) {
        // If image is already a string (Storage URL or local path), use it directly
        if (typeof blogData.image === 'string') {
          // Check if it's base64 (should not be used - exceeds Firestore limit)
          if (isBase64Image(blogData.image)) {
            console.warn('Base64 image detected - this may exceed Firestore 1MB limit. Using default image instead.')
            // Don't use base64 - it exceeds Firestore's 1MB limit
            // Instead, use default placeholder or attempt to upload to Storage
            imageUrl = '/blog/blog_image.png'
          } else if (isStorageUrl(blogData.image) || isLocalPath(blogData.image)) {
            console.log('Using provided image URL')
            imageUrl = blogData.image
          } else {
            console.warn('Unknown image format, using default')
            imageUrl = '/blog/blog_image.png'
          }
        } else {
          // New file upload - use ImgBB (free image hosting)
          console.log('Uploading new image to ImgBB...', blogData.image.name)
          try {
            imageUrl = await uploadImageToImgBB(blogData.image)
            console.log('Image uploaded to ImgBB successfully:', imageUrl)
          } catch (uploadError) {
            console.error('ImgBB upload failed:', uploadError)
            // Use default placeholder image instead of failing
            console.warn('Using default placeholder image due to upload failure')
            imageUrl = '/blog/blog_image.png'
            // Optionally throw error to notify user:
            // throw new Error('Failed to upload image. Please check your ImgBB API key and try again.')
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

      console.log('Generated slug:', slug)

      const blogDoc = {
        title: blogData.title,
        excerpt: blogData.excerpt,
        content: blogData.content,
        image: imageUrl,
        slug,
        readTime: blogData.readTime,
        published: blogData.published,
        createdAt: serverTimestamp(),
        // Mark as migrated if it's a Storage URL
        imageMigrated: isStorageUrl(imageUrl)
      }

      console.log('Creating document in Firestore...', blogDoc)
      const docRef = await addDoc(collection(db, COLLECTION_NAME), blogDoc)
      console.log('Blog created successfully with ID:', docRef.id)

      return docRef.id
    } catch (error) {
      console.error('Detailed error creating blog:', error)
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
      // Return empty array instead of throwing - let the UI handle fallback
      return []
    }
  },

  async getPublishedBlogs(): Promise<BlogPost[]> {
    try {
      const blogs = await this.getBlogs()
      return blogs.filter(blog => blog.published)
    } catch (error) {
      console.error('Error getting published blogs:', error)
      // Return empty array instead of throwing - let the UI handle fallback
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
      console.log('Starting blog update...', id, blogData.title)
      
      // Get existing blog to check current image format
      const existingBlog = await this.getBlogById(id)
      let imageUrl: string | undefined = undefined
      
      // Handle image update if provided
      if (blogData.image !== undefined) {
        if (typeof blogData.image === 'string') {
          // String provided - could be base64, Storage URL, or local path
          if (isBase64Image(blogData.image)) {
            console.warn('Base64 image detected in update - this may exceed Firestore 1MB limit. Using default image instead.')
            // Don't use base64 - it exceeds Firestore's 1MB limit
            imageUrl = '/blog/blog_image.png'
          } else if (isStorageUrl(blogData.image) || isLocalPath(blogData.image)) {
            console.log('Using provided image URL')
            imageUrl = blogData.image
          } else {
            // Unknown format, keep existing or use default
            imageUrl = existingBlog?.image || '/blog/blog_image.png'
          }
        } else {
          // New file upload - upload to ImgBB
          console.log('Uploading new image to ImgBB...')
          try {
            imageUrl = await uploadImageToImgBB(blogData.image)
            console.log('New image uploaded to ImgBB successfully')
          } catch (uploadError) {
            console.error('ImgBB upload failed:', uploadError)
            // Keep existing image if available, otherwise use default
            if (existingBlog?.image && !isBase64Image(existingBlog.image)) {
              console.log('Keeping existing image due to upload failure')
              imageUrl = existingBlog.image
            } else {
              console.warn('Using default placeholder image due to upload failure')
              imageUrl = '/blog/blog_image.png'
            }
            // Optionally throw error to notify user:
            // throw new Error('Failed to upload image. Please check your ImgBB API key and try again.')
          }
        }
      } else if (blogData.image === null || (existingBlog && !existingBlog.image)) {
        // Explicitly removing image or no existing image
        imageUrl = '/blog/blog_image.png'
      }
      // If blogData.image is undefined, we don't update the image field

      // Generate new slug if title changed
      let updateData: any = { ...blogData }
      if (blogData.title) {
        updateData.slug = blogData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      }

      // Update image URL if processed
      if (imageUrl !== undefined) {
        updateData.image = imageUrl
        updateData.imageMigrated = isStorageUrl(imageUrl)
      }

      // Add updated timestamp
      updateData.updatedAt = serverTimestamp()

      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, updateData)
      console.log('Blog updated successfully:', id)
    } catch (error) {
      console.error('Detailed error updating blog:', error)
      throw error
    }
  }
}
