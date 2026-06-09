'use client'

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calendar, Clock } from "lucide-react"
import { CreateBlogModal } from "@/components/CreateBlogModal"
import { FramerPageShell } from "@/components/framer/framer-page-shell"
import { blogService, BlogPost } from "@/lib/blogServiceFree"

const staticBlogPosts: BlogPost[] = [
  {
    id: "static-3",
    title: "The Secret Life of Your Shopping Receipt: What Happens After You Throw It Away",
    excerpt:
      "Uncover the environmental journey of discarded paper receipts and why digital alternatives are crucial for our planet's future.",
    content: "",
    createdAt: new Date("2025-06-16"),
    image: "/blog/blog4.png",
    slug: "secret-life-shopping-receipt",
    readTime: "6 min read",
    published: true,
  },
  {
    id: "static-4",
    title: "Why Business Owners Hate Printing Receipts (And How PapeX Solves This)",
    excerpt:
      "Learn about the real frustrations business owners face with traditional receipt systems and how digital receipts can transform their operations.",
    content: "",
    createdAt: new Date("2025-06-07"),
    image: "/blog/receipt-hate.png",
    slug: "why-business-owners-hate-printing-receipts",
    readTime: "4 min read",
    published: true,
  },
  {
    id: "static-2",
    title: "A Brief History of Receipts: From Ancient Clay Tablets to Digital Innovation",
    excerpt:
      "Explore the fascinating evolution of receipts throughout history and how PapeX is writing the next chapter in transaction documentation.",
    content: "",
    createdAt: new Date("2025-05-29"),
    image: "/blog/history 2.jpeg",
    slug: "history-of-receipts",
    readTime: "7 min read",
    published: true,
  },
  {
    id: "static-1",
    title: "The Hidden Cost of Paper Receipts: Why Your Business Needs to Go Digital",
    excerpt:
      "Discover the surprising environmental and financial impact of paper receipts on your business, and learn why digital receipts are the future.",
    content: "",
    createdAt: new Date("2025-05-23"),
    image: "/blog/blog_image.png",
    slug: "hidden-cost-paper-receipts",
    readTime: "5 min read",
    published: true,
  },
]

function sanitizeImageUrl(imageUrl: string | undefined): string {
  if (!imageUrl) return "/blog/blog_image.png"
  if (imageUrl.includes("localhost") || imageUrl.includes("127.0.0.1")) return "/blog/blog_image.png"
  if (imageUrl.startsWith("https://") || imageUrl.startsWith("http://") || imageUrl.startsWith("/")) return imageUrl
  if (imageUrl.startsWith("data:image/")) return imageUrl
  return "/blog/blog_image.png"
}

function formatDate(date: BlogPost["createdAt"]) {
  if (!date) return ""
  if (typeof date === "object" && date !== null && "toDate" in date && typeof date.toDate === "function") {
    return date.toDate().toLocaleDateString()
  }
  if (date instanceof Date) return date.toLocaleDateString()
  return new Date(date as string | number).toLocaleDateString()
}

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(staticBlogPosts)
  const [loading, setLoading] = useState(true)

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const firebaseBlogs = await blogService.getPublishedBlogs()
      const allBlogs = firebaseBlogs.length > 0 ? [...firebaseBlogs, ...staticBlogPosts] : staticBlogPosts
      setBlogPosts(allBlogs)
    } catch (error) {
      console.error("Error fetching blogs:", error)
      setBlogPosts(staticBlogPosts)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  return (
    <FramerPageShell>
      <div className="framer-container subpage-inner">
        <header className="subpage-header">
          <p className="section-label">Blog</p>
          <h1 className="section-title">Insights from the PapeX team.</h1>
          <p className="section-intro">
            Stories and updates on digital receipts, sustainability, and building better expense workflows.
          </p>
        </header>

        {loading ? (
          <div className="blog-post-grid">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="blog-skeleton">
                <div className="blog-skeleton-media" />
                <div className="blog-skeleton-body">
                  <div className="blog-skeleton-line short" />
                  <div className="blog-skeleton-line medium" />
                  <div className="blog-skeleton-line" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="blog-post-grid">
            {blogPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group h-full">
                <article className="blog-post-card">
                  <div className="blog-post-media">
                    {post.image && post.image.trim() !== "" ? (
                      <Image
                        src={sanitizeImageUrl(post.image)}
                        alt={post.title}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-[#605f5f]">
                        Blog image
                      </div>
                    )}
                  </div>

                  <div className="blog-post-body">
                    <div className="blog-post-meta">
                      <span className="blog-meta-pill">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="blog-meta-pill">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>

                    <h2>{post.title}</h2>
                    <p>{post.excerpt}</p>

                    <span className="blog-read-more">
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        <div className="subpage-cta">
          <div className="subpage-cta-card">
            <h2>Stay updated</h2>
            <p>
              Join our community for the latest on digital receipts, sustainability, and product updates.
            </p>
            <Link href="/waitlist" className="btn-download">
              Join our newsletter
            </Link>
          </div>
        </div>
      </div>
      <CreateBlogModal onBlogCreated={fetchBlogs} />
    </FramerPageShell>
  )
}
