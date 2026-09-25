// app/blog/page.tsx
//
// The blog index on the redesign shell (Web 2.1, S3). A Server Component:
// posts are read on the server (Firestore REST, app/blog/_lib/posts.ts) and
// the page is ISR'd, so crawlers get real titles and links in the HTML
// instead of the old client-only skeleton. The only client islands are the
// admin "new post" button and the device-matched "Get the app" link.

import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteShell } from '@/components/brand/site-shell'
import { FlowGround } from '@/components/paths/shared/FlowGround'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import { SectionLabel } from '@/components/paths/shared/SectionLabel'
import { BlogImage } from '@/components/blog/BlogImage'
import { BlogCta } from '@/components/blog/BlogCta'
import { BlogSubscribeForm } from '@/components/blog/BlogSubscribeForm'
import { SiteFooter } from '@/components/brand/site-footer'
import { LazyBlogAdminCreate } from '@/components/blog/AdminIslands'
import { formatPostDate } from '@/components/blog/format'
import { DEFAULT_OG_IMAGE } from '@/components/blog/image'
import styles from '@/components/blog/blog.module.css'
import { listPublishedPosts, type PostSummary } from './_lib/posts'

// Keep in step with BLOG_REVALIDATE_SECONDS (Next reads this literal statically).
export const revalidate = 60

const TITLE = 'Blog | PapeX'
const DESCRIPTION =
  'Stories and updates from the PapeX team on digital receipts, sustainability and what happens after checkout.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://papex.app/blog' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://papex.app/blog',
    siteName: 'PapeX',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: 'PapeX' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@papex_receipts',
    title: TITLE,
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
}

async function loadPosts(): Promise<PostSummary[]> {
  try {
    return await listPublishedPosts()
  } catch (error) {
    // A Firestore outage shouldn't take the page (or a build) down; the
    // empty state covers it and the next revalidation retries.
    console.error('[blog] could not load posts:', error)
    return []
  }
}

export default async function BlogPage() {
  const posts = await loadPosts()

  return (
    <SiteShell path="page">
      <FlowGround initial="light" footer={<SiteFooter inFlow />}>
        <FlowSection ground="light" className={styles.top}>
          <div className={styles.wrap}>
            <header className={styles.head}>
              <SectionLabel>Blog</SectionLabel>
              <h1 className={`rd-display ${styles.title}`}>Insights from the PapeX team.</h1>
              <p className={styles.lead}>
                Stories and updates on digital receipts, sustainability, and what happens after checkout.
              </p>
            </header>

            {posts.length === 0 ? (
              <div className={styles.empty} role="status">
                <h2 className={styles.emptyTitle}>No posts yet.</h2>
                <p className={styles.emptyBody}>
                  We&rsquo;re writing the first ones now. Check back soon.
                </p>
              </div>
            ) : (
              <ul className={styles.grid}>
                {posts.map((post, i) => {
                  const date = formatPostDate(post.createdAt)
                  return (
                    <li key={post.id}>
                      <Link href={`/blog/${post.slug}`} className={styles.card}>
                        <div className={styles.cardMedia}>
                          <BlogImage
                            src={post.image}
                            alt=""
                            sizes="(min-width: 1100px) 360px, (min-width: 700px) 50vw, 100vw"
                            priority={i < 3}
                          />
                        </div>
                        <div className={styles.cardBody}>
                          <div className={styles.meta}>
                            {date && <time dateTime={post.createdAt ?? undefined}>{date}</time>}
                            {date && post.readTime && (
                              <span className={styles.metaDot} aria-hidden="true">
                                ·
                              </span>
                            )}
                            {post.readTime && <span>{post.readTime}</span>}
                          </div>
                          <h2 className={styles.cardTitle}>{post.title}</h2>
                          {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
                          <span className={styles.cardMore}>
                            Read more <span aria-hidden="true">→</span>
                          </span>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </FlowSection>

        <BlogCta />
        <BlogSubscribeForm source="blog-index" variant="card" />
      </FlowGround>
      <LazyBlogAdminCreate />
    </SiteShell>
  )
}
