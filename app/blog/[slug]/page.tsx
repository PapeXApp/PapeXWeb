'use client'

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Edit } from "lucide-react"
import { FramerPageShell } from "@/components/framer/framer-page-shell"
import { BtnPlane } from "@/components/framer/btn-plane"
import { blogService, BlogPost } from "@/lib/blogServiceFree"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/hooks/useAdmin"
import { EditBlogModal } from "@/components/EditBlogModal"

interface BlogDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  const resolvedParams = use(params)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const { isAdmin } = useAdminAuth()

  const formatDate = (date: any) => {
    if (!date) return ''
    if (date.toDate && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString()
    }
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }
    return new Date(date).toLocaleDateString()
  }

  /**
   * Sanitizes image URLs to ensure no localhost URLs are used
   * Returns a valid external URL or falls back to default image
   */
  const sanitizeImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) {
      return "/blog/blog_image.png"
    }

    // Check if URL contains localhost
    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
      console.warn('Localhost URL detected and replaced with fallback:', imageUrl)
      return "/blog/blog_image.png"
    }

    // Check if it's a valid external URL (https/http) or relative path
    if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://') || imageUrl.startsWith('/')) {
      return imageUrl
    }

    // If it's a base64 image, allow it
    if (imageUrl.startsWith('data:image/')) {
      return imageUrl
    }

    // For any other format, use fallback
    console.warn('Invalid image URL format, using fallback:', imageUrl.substring(0, 50))
    return "/blog/blog_image.png"
  }

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)

        const firebaseBlogs = await blogService.getPublishedBlogs()
        const firebasePost = firebaseBlogs.find(blog => blog.slug === resolvedParams.slug)

        if (firebasePost) {
          setPost(firebasePost)
        } else {
          setError('Blog post not found')
        }
      } catch (error) {
        console.error('Error fetching blog post:', error)
        setError('Failed to load blog post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [resolvedParams.slug])

  const handleBlogUpdated = () => {
    // Refresh the blog post data after update
    const fetchPost = async () => {
      try {
        setLoading(true)

        const firebaseBlogs = await blogService.getPublishedBlogs()
        const firebasePost = firebaseBlogs.find(blog => blog.slug === resolvedParams.slug)

        if (firebasePost) {
          setPost(firebasePost)
        }
      } catch (error) {
        console.error('Error refreshing blog post:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }

  if (loading) {
    return (
      <FramerPageShell>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="flex gap-4 mb-8">
                <div className="h-6 bg-gray-200 rounded w-24"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-80 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </FramerPageShell>
    )
  }

  if (error || !post) {
    return (
      <FramerPageShell>
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#0a3d62] mb-4">Blog Post Not Found</h1>
            <p className="text-lg text-[#0a3d62] mb-8">The blog post you're looking for doesn't exist.</p>
            <Link href="/blog">
              <Button className="gradient-accent text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </FramerPageShell>
    )
  }

  return (
    <FramerPageShell>

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[#0a3d62] hover:text-[#ff9933] transition-colors duration-300 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <article className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/30 shadow-lg">
            <div className="relative">
              <Image
                src={sanitizeImageUrl(post.image)}
                alt={post.title}
                width={800}
                height={400}
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[#0a3d62] bg-[#0a3d62]/10 px-3 py-1 rounded-full">
                    <Calendar className="h-3 w-3" />
                    <span className="text-sm font-medium">{formatDate(post.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#ff9933] bg-[#ff9933]/10 px-3 py-1 rounded-full">
                    <Clock className="h-3 w-3" />
                    <span className="text-sm font-medium">{post.readTime}</span>
                  </div>
                </div>

                {/* Admin Edit Button - only show for admins */}
                {isAdmin && post.id && (
                  <Button
                    onClick={() => setEditModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-[#ff9933] hover:text-white transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Post
                  </Button>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] mb-6 leading-tight">
                {post.title}
              </h1>

              <div className="prose prose-lg max-w-none">
                <p className="text-xl text-[#0a3d62] mb-8 font-medium leading-relaxed">
                  {post.excerpt}
                </p>

                <div
                  className="text-[#0a3d62] leading-relaxed space-y-6 prose prose-lg max-w-none blog-content"
                  style={{
                    lineHeight: '1.8'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: (post.content || "")
                      .replace(/<h2>/g, '<h2 style="font-size: 1.875rem; font-weight: bold; color: #0a3d62; margin: 1.5rem 0 1rem 0; font-family: var(--font-kameron), Georgia, serif;">')
                      .replace(/<h3>/g, '<h3 style="font-size: 1.5rem; font-weight: bold; color: #0a3d62; margin: 1.25rem 0 0.75rem 0; font-family: var(--font-kameron), Georgia, serif;">')
                      .replace(/<a /g, '<a style="color: #ff9933; text-decoration: underline; font-weight: 500;" ')
                      .replace(/<strong>/g, '<strong style="font-weight: bold; color: #0a3d62;">')
                  }}
                />
              </div>
            </div>
          </article>

          <div className="mt-12 text-center">
            <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl border border-white/30 shadow-lg">
              <h2 className="text-2xl font-bold text-[#0a3d62] mb-4 font-gloock">
                Ready to go <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">digital</span>?
              </h2>
              <p className="text-[#0a3d62] mb-6 font-medium">
                Join our waitlist to be among the first to experience the future of digital receipts.
              </p>
              <Link href="/waitlist" className="btn-download">
                <BtnPlane />
                Join Our Waitlist
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal - only render if we have a valid post */}
      {post && post.id && (
        <EditBlogModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onBlogUpdated={handleBlogUpdated}
          blog={post}
        />
      )}
    </FramerPageShell>
  )
}