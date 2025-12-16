'use client'

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import { MainNavigation, MainFooter } from "@/components/main-navigation"
import { CreateBlogModal } from "@/components/CreateBlogModal"
import { blogService, BlogPost } from "@/lib/blogServiceFree"

// Static fallback blogs (in case Firebase is empty)
const staticBlogPosts: BlogPost[] = [
  {
    id: "static-3",
    title: "The Secret Life of Your Shopping Receipt: What Happens After You Throw It Away",
    excerpt: "Uncover the environmental journey of discarded paper receipts and why digital alternatives are crucial for our planet's future.",
    content: "",
    createdAt: new Date("2025-06-16"),
    image: "/blog/blog4.png",
    slug: "secret-life-shopping-receipt",
    readTime: "6 min read",
    published: true
  },
  {
    id: "static-4",
    title: "Why Business Owners Hate Printing Receipts (And How PapeX Solves This)",
    excerpt: "Learn about the real frustrations business owners face with traditional receipt systems and how digital receipts can transform their operations.",
    content: "",
    createdAt: new Date("2025-06-07"),
    image: "/blog/receipt-hate.png",
    slug: "why-business-owners-hate-printing-receipts",
    readTime: "4 min read",
    published: true
  },
  {
    id: "static-2",
    title: "A Brief History of Receipts: From Ancient Clay Tablets to Digital Innovation",
    excerpt: "Explore the fascinating evolution of receipts throughout history and how PapeX is writing the next chapter in transaction documentation.",
    content: "",
    createdAt: new Date("2025-05-29"),
    image: "/blog/history 2.jpeg",
    slug: "history-of-receipts",
    readTime: "7 min read",
    published: true
  },
  {
    id: "static-1",
    title: "The Hidden Cost of Paper Receipts: Why Your Business Needs to Go Digital",
    excerpt: "Discover the surprising environmental and financial impact of paper receipts on your business, and learn why digital receipts are the future.",
    content: "",
    createdAt: new Date("2025-05-23"),
    image: "/blog/blog_image.png",
    slug: "hidden-cost-paper-receipts",
    readTime: "5 min read",
    published: true
  }
]

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(staticBlogPosts)
  const [loading, setLoading] = useState(true)

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const firebaseBlogs = await blogService.getPublishedBlogs()
      
      // Combine Firebase blogs with static blogs, Firebase blogs first
      // If Firebase returns empty array (due to permissions), just use static blogs
      const allBlogs = firebaseBlogs.length > 0 
        ? [...firebaseBlogs, ...staticBlogPosts]
        : staticBlogPosts
      setBlogPosts(allBlogs)
    } catch (error) {
      console.error('Error fetching blogs:', error)
      // Use static blogs as fallback - don't show error to users
      setBlogPosts(staticBlogPosts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  const handleBlogCreated = () => {
    fetchBlogs() // Refresh the blog list
  }

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

  return (
    <div className="min-h-screen gradient-mesh flex flex-col">
      <MainNavigation />

      <main className="flex-1 container mx-auto py-8 px-4 relative overflow-hidden">
        {/* Floating background elements - reduced opacity */}
        <div className="absolute top-10 left-20 w-32 h-32 gradient-primary rounded-full opacity-5 blur-xl animate-float"></div>
        <div className="absolute top-40 right-10 w-40 h-40 gradient-accent rounded-full opacity-5 blur-xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-60 left-10 w-36 h-36 gradient-secondary rounded-full opacity-5 blur-xl animate-float" style={{animationDelay: '3s'}}></div>
        <div className="absolute bottom-20 right-1/4 w-28 h-28 gradient-hero rounded-full opacity-5 blur-xl animate-float" style={{animationDelay: '5s'}}></div>

        <div className="text-center mb-12 animate-slide-in-up relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-[#0a3d62] mb-4">
            PapeX <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Blog</span>
          </h1>
          <div className="w-20 h-1 gradient-accent mx-auto mb-6 rounded-full animate-gradient"></div>
          <p className="text-lg text-[#0a3d62] max-w-2xl mx-auto font-medium">
            Insights, stories, and updates from the world of digital receipts and sustainable business practices.
          </p>
        </div>



        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/30 shadow-lg animate-pulse h-full flex flex-col">
                <div className="w-full aspect-square bg-gray-200 flex-shrink-0"></div>
                <div className="p-6 space-y-4 flex flex-col flex-grow">
                  <div className="flex gap-4 flex-shrink-0">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 flex-shrink-0 min-h-[3.5rem] flex items-center">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  </div>
                  <div className="space-y-2 flex-grow min-h-[2.5rem]">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded w-24 mt-auto"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {blogPosts.map((post, index) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group h-full">
              <article 
                className={`bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden card-hover border border-white/30 shadow-lg animate-slide-in-up relative cursor-pointer h-full flex flex-col`}
                style={{animationDelay: `${index * 0.15}s`}}
              >
                {/* Decorative gradient overlay - reduced opacity */}
                <div className="absolute top-0 right-0 w-20 h-20 gradient-accent rounded-full blur-xl opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
                
                <div className="relative overflow-hidden flex-shrink-0">
                  {post.image && post.image.trim() !== '' ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      width={400}
                      height={400}
                      className={`w-full aspect-square group-hover:scale-105 transition-transform duration-500 object-cover`}
                    />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-[#0a3d62]/10 to-[#ff9933]/10 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-[#0a3d62]/20 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-[#0a3d62]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-[#0a3d62] font-medium">Blog Image</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <div className="p-6 relative z-10 flex flex-col flex-grow">
                  <div className="flex items-center gap-4 mb-3 flex-shrink-0">
                    <div className="flex items-center gap-1 text-[#0a3d62] bg-[#0a3d62]/10 px-3 py-1 rounded-full">
                      <Calendar className="h-3 w-3" />
                      <span className="text-xs font-medium">{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[#ff9933] bg-[#ff9933]/10 px-3 py-1 rounded-full">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs font-medium">{post.readTime}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-[#0a3d62] mb-3 group-hover:text-[#ff9933] transition-colors duration-300 line-clamp-2 flex-shrink-0 min-h-[3.5rem]">
                    {post.title}
                  </h2>
                  
                  <p className="text-[#0a3d62] mb-4 text-sm leading-relaxed font-medium line-clamp-2 flex-grow min-h-[2.5rem]">
                    {post.excerpt}
                  </p>
                  
                  <div className="inline-flex items-center gap-2 bg-[#0a3d62] group-hover:bg-[#ff9933] text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-md group-hover:scale-105 self-start mt-auto">
                    Read More
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </article>
            </Link>
          ))}
          </div>
        )}

        <div className="text-center mt-16 animate-slide-in-up relative z-10">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl max-w-2xl mx-auto border border-white/30 shadow-lg relative overflow-hidden">
            {/* Decorative background element - reduced opacity */}
            <div className="absolute bottom-0 right-0 w-32 h-32 gradient-primary rounded-full blur-xl opacity-5"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-[#0a3d62] mb-3">
                Stay <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Updated</span>
              </h2>
              <p className="text-[#0a3d62] mb-6 font-medium">
                Join our community to get the latest insights on digital receipts, sustainability, and business innovation.
              </p>
              <Link 
                href="/waitlist"
                className="btn-modern gradient-accent hover:shadow-2xl text-white font-medium border-none rounded-full px-8 py-3 h-auto text-lg transform hover:scale-105 transition-all duration-300"
              >
                Join Our Newsletter
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MainFooter />
      <CreateBlogModal onBlogCreated={handleBlogCreated} />
    </div>
  )
} 