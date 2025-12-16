'use client'

import { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Edit } from "lucide-react"
import { MainNavigation, MainFooter } from "@/components/main-navigation"
import { blogService, BlogPost } from "@/lib/blogServiceFree"
import { Button } from "@/components/ui/button"
import { useAdminAuth } from "@/hooks/useAdmin"
import { EditBlogModal } from "@/components/EditBlogModal"

// Static blog content for fallback
const staticBlogContent: Record<string, string> = {
  "hidden-cost-paper-receipts": `
    <h2>The Environmental Impact</h2>
    <p>Paper receipts might seem like a small part of your business operations, but their environmental impact is substantial. Every year, billions of receipts are printed, used briefly, and then discarded, contributing to deforestation and waste.</p>
    
    <h2>The Financial Burden</h2>
    <p>Beyond the environmental concerns, paper receipts represent a significant financial burden for businesses. The cost of thermal paper, printer maintenance, and staff time spent dealing with receipt-related issues adds up quickly.</p>
    
    <h2>Why Digital is the Future</h2>
    <p>Digital receipts offer a sustainable, cost-effective alternative that benefits both businesses and customers. With PapeX, you can eliminate paper waste while providing customers with easily accessible, organized receipts.</p>
  `,
  "history-of-receipts": `
    <h2>Ancient Beginnings</h2>
    <p>The concept of receipts dates back to ancient civilizations, where clay tablets and papyrus were used to record transactions. These early forms of documentation laid the foundation for modern receipt systems.</p>
    
    <h2>The Industrial Revolution</h2>
    <p>The industrial revolution brought about mechanical cash registers and carbon paper receipts, revolutionizing how businesses tracked sales and provided proof of purchase to customers.</p>
    
    <h2>Digital Transformation</h2>
    <p>Today, we're witnessing another revolutionary change with digital receipts. PapeX is at the forefront of this transformation, offering a seamless bridge between traditional receipt systems and modern digital solutions.</p>
  `,
  "secret-life-shopping-receipt": `
    <h2>The Journey Begins</h2>
    <p>When you receive a receipt and eventually throw it away, you might think its journey ends there. However, the environmental impact of that small piece of paper extends far beyond your trash can.</p>
    
    <h2>Landfill Accumulation</h2>
    <p>Most receipts end up in landfills, where they can take years to decompose. The thermal paper used in receipts often contains BPA, which can leach into soil and groundwater.</p>
    
    <h2>The Digital Alternative</h2>
    <p>Digital receipts offer a clean, environmentally friendly alternative. With PapeX, every digital receipt represents one less piece of paper in our landfills and one step closer to a sustainable future.</p>
  `,
  "why-business-owners-hate-printing-receipts": `
    <h2>The Daily Frustrations</h2>
    <p>Business owners face numerous challenges with traditional receipt printing: paper jams, running out of paper at crucial moments, maintenance costs, and storage issues.</p>
    
    <h2>Customer Experience Issues</h2>
    <p>Long receipt printing times can slow down checkout processes, creating bottlenecks during busy periods and frustrating customers who are in a hurry.</p>
    
    <h2>How PapeX Solves These Problems</h2>
    <p>PapeX eliminates all these pain points by providing instant digital receipts. No more paper jams, no more running out of supplies, and faster checkout times that improve the overall customer experience.</p>
  `
}

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

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        
        // First try to get from Firebase
        const firebaseBlogs = await blogService.getPublishedBlogs()
        const firebasePost = firebaseBlogs.find(blog => blog.slug === resolvedParams.slug)
        
        if (firebasePost) {
          setPost(firebasePost)
        } else {
          // Fallback to static blog data
          const staticPost = getStaticPost(resolvedParams.slug)
          if (staticPost) {
            setPost(staticPost)
          } else {
            setError('Blog post not found')
          }
        }
      } catch (error) {
        console.error('Error fetching blog post:', error)
        
        // Try static fallback
        const staticPost = getStaticPost(resolvedParams.slug)
        if (staticPost) {
          setPost(staticPost)
        } else {
          setError('Failed to load blog post')
        }
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
        
        // First try to get from Firebase
        const firebaseBlogs = await blogService.getPublishedBlogs()
        const firebasePost = firebaseBlogs.find(blog => blog.slug === resolvedParams.slug)
        
        if (firebasePost) {
          setPost(firebasePost)
        } else {
          // Fallback to static blog data
          const staticPost = getStaticPost(resolvedParams.slug)
          if (staticPost) {
            setPost(staticPost)
          }
        }
      } catch (error) {
        console.error('Error refreshing blog post:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }

  const getStaticPost = (slug: string): BlogPost | null => {
    const staticPosts: Record<string, BlogPost> = {
      "hidden-cost-paper-receipts": {
        id: "static-1",
        title: "The Hidden Cost of Paper Receipts: Why Your Business Needs to Go Digital",
        excerpt: "Discover the surprising environmental and financial impact of paper receipts on your business, and learn why digital receipts are the future.",
        content: staticBlogContent["hidden-cost-paper-receipts"],
        createdAt: new Date("2025-05-23"),
        image: "/blog/blog_image.png",
        slug: "hidden-cost-paper-receipts",
        readTime: "5 min read",
        published: true
      },
      "history-of-receipts": {
        id: "static-2",
        title: "A Brief History of Receipts: From Ancient Clay Tablets to Digital Innovation",
        excerpt: "Explore the fascinating evolution of receipts throughout history and how PapeX is writing the next chapter in transaction documentation.",
        content: staticBlogContent["history-of-receipts"],
        createdAt: new Date("2025-05-29"),
        image: "/blog/history 2.jpeg",
        slug: "history-of-receipts",
        readTime: "7 min read",
        published: true
      },
      "secret-life-shopping-receipt": {
        id: "static-3",
        title: "The Secret Life of Your Shopping Receipt: What Happens After You Throw It Away",
        excerpt: "Uncover the environmental journey of discarded paper receipts and why digital alternatives are crucial for our planet's future.",
        content: staticBlogContent["secret-life-shopping-receipt"],
        createdAt: new Date("2025-06-16"),
        image: "/blog/blog4.png",
        slug: "secret-life-shopping-receipt",
        readTime: "6 min read",
        published: true
      },
      "why-business-owners-hate-printing-receipts": {
        id: "static-4",
        title: "Why Business Owners Hate Printing Receipts (And How PapeX Solves This)",
        excerpt: "Learn about the real frustrations business owners face with traditional receipt systems and how digital receipts can transform their operations.",
        content: staticBlogContent["why-business-owners-hate-printing-receipts"],
        createdAt: new Date("2025-06-07"),
        image: "/blog/receipt-hate.png",
        slug: "why-business-owners-hate-printing-receipts",
        readTime: "4 min read",
        published: true
      }
    }

    return staticPosts[slug] || null
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh flex flex-col">
        <MainNavigation />
        <main className="flex-1 container mx-auto py-8 px-4">
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
        </main>
        <MainFooter />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen gradient-mesh flex flex-col">
        <MainNavigation />
        <main className="flex-1 container mx-auto py-8 px-4">
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
        </main>
        <MainFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <MainNavigation />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[#0a3d62] hover:text-[#ff9933] transition-colors duration-300 mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <article className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/30 shadow-lg">
            <div className="relative">
              <Image
                src={post.image || "/blog/blog_image.png"}
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
                
                {/* Admin Edit Button - only show for Firebase posts and admins */}
                {isAdmin && post.id && !post.id.startsWith('static-') && (
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
                    __html: (post.content || staticBlogContent[post.slug] || "")
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
              <Link 
                href="/waitlist"
                className="btn-modern gradient-accent hover:shadow-2xl text-white font-medium border-none rounded-full px-8 py-3 h-auto text-lg transform hover:scale-105 transition-all duration-300"
              >
                Join Our Waitlist
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MainFooter />
      
      {/* Edit Modal - only render if we have a valid Firebase post */}
      {post && post.id && !post.id.startsWith('static-') && (
        <EditBlogModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onBlogUpdated={handleBlogUpdated}
          blog={post}
        />
      )}
    </div>
  )
} 