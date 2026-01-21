import { db } from '@/firebase/firebaseConfig'
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore'
import { uploadImageToImgBB } from './imageUploadImgBB'
import {
  isBase64Image,
  isStorageUrl,
  isLocalPath
} from './imageUpload'

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const COLLECTION_NAME = 'blogs'

const DEFAULT_IMAGE_URL =
  'https://papex.app/blog/blog_image.png'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

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
  imageMigrated?: boolean
}

export interface CreateBlogPost {
  title: string
  excerpt: string
  content: string
  image?: File | string
  readTime: string
  published: boolean
}

/* -------------------------------------------------------------------------- */
/*                                HELPERS                                     */
/* -------------------------------------------------------------------------- */

const generateSlug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const resolveImageUrl = async (
  image?: File | string
): Promise<string> => {
  if (!image) return DEFAULT_IMAGE_URL

  // STRING IMAGE
  if (typeof image === 'string') {
    if (isBase64Image(image)) {
      console.warn('Base64 image rejected (Firestore limit)')
      return DEFAULT_IMAGE_URL
    }

    if (isStorageUrl(image) || image.startsWith('http')) {
      return image
    }

    if (isLocalPath(image)) {
      // Local paths are invalid in production
      return DEFAULT_IMAGE_URL
    }

    return DEFAULT_IMAGE_URL
  }

  // FILE IMAGE
  try {
    return await uploadImageToImgBB(image)
  } catch (error) {
    console.error('Image upload failed:', error)
    throw new Error('Image upload failed')
  }
}

/* -------------------------------------------------------------------------- */
/*                                SERVICE                                     */
/* -------------------------------------------------------------------------- */

export const blogService = {
  /* ------------------------------ CREATE BLOG ----------------------------- */
  async createBlog(blogData: CreateBlogPost): Promise<string> {
    const imageUrl = await resolveImageUrl(blogData.image)

    const blogDoc = {
      title: blogData.title,
      excerpt: blogData.excerpt,
      content: blogData.content,
      image: imageUrl,
      slug: generateSlug(blogData.title),
      readTime: blogData.readTime,
      published: blogData.published,
      createdAt: serverTimestamp(),
      imageMigrated: isStorageUrl(imageUrl)
    }

    const docRef = await addDoc(
      collection(db, COLLECTION_NAME),
      blogDoc
    )

    return docRef.id
  },

  /* ------------------------------ GET BLOGS -------------------------------- */
  async getBlogs(): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      )

      const snapshot = await getDocs(q)

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[]
    } catch (error) {
      console.error('Error fetching blogs:', error)
      return []
    }
  },

  /* --------------------------- GET PUBLISHED ------------------------------- */
  async getPublishedBlogs(): Promise<BlogPost[]> {
    const blogs = await this.getBlogs()
    return blogs.filter(blog => blog.published)
  },

  /* ----------------------------- GET BY ID --------------------------------- */
  async getBlogById(id: string): Promise<BlogPost | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const snap = await getDoc(docRef)

      if (!snap.exists()) return null

      return {
        id: snap.id,
        ...snap.data()
      } as BlogPost
    } catch (error) {
      console.error('Error fetching blog:', error)
      return null
    }
  },

  /* ------------------------------ UPDATE BLOG ------------------------------ */
  async updateBlog(
    id: string,
    blogData: Partial<CreateBlogPost>
  ): Promise<void> {
    const existing = await this.getBlogById(id)
    if (!existing) throw new Error('Blog not found')

    const updateData: any = {
      ...blogData,
      updatedAt: serverTimestamp()
    }

    if (blogData.title) {
      updateData.slug = generateSlug(blogData.title)
    }

    if (blogData.image !== undefined) {
      const imageUrl = await resolveImageUrl(blogData.image)
      updateData.image = imageUrl
      updateData.imageMigrated = isStorageUrl(imageUrl)
    }

    await updateDoc(
      doc(db, COLLECTION_NAME, id),
      updateData
    )
  }
}
