// app/blog/[slug]/page.tsx
//
// One blog post on the redesign shell (Web 2.1, S3). A Server Component:
// it reads ONE published post by slug on the server (Firestore REST,
// app/blog/_lib/posts.ts), so the title, body, per-post <title>/description/
// Open Graph and the Article JSON-LD are all in the initial HTML. ISR keeps
// it fresh; slugs published after a deploy render on first request.
// The only client islands: the admin "Edit post" control and "Get the app".

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { SiteShell } from '@/components/brand/site-shell'
import { FlowGround } from '@/components/paths/shared/FlowGround'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import { BlogImage } from '@/components/blog/BlogImage'
import { BlogCta } from '@/components/blog/BlogCta'
import { SiteFooter } from '@/components/brand/site-footer'
import { LazyPostAdminEdit } from '@/components/blog/AdminIslands'
import { formatPostDate } from '@/components/blog/format'
import { SITE_ORIGIN, socialImageUrl } from '@/components/blog/image'
import { normalizePostHtml } from '@/components/blog/prose'
import styles from '@/components/blog/blog.module.css'
import { LEGACY_SLUGS, getPublishedPostBySlug, listPublishedPosts, type PublicPost } from '../_lib/posts'

// Keep in step with BLOG_REVALIDATE_SECONDS (Next reads this literal statically).
export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const posts = await listPublishedPosts()
    return posts.map((p) => ({ slug: p.slug }))
  } catch (error) {
    // No network at build: every slug renders on first request instead.
    console.error('[blog] generateStaticParams could not list posts:', error)
    return []
  }
}

const postUrl = (slug: string) => `${SITE_ORIGIN}/blog/${slug}`

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)
  if (!post) return { title: 'Post not found | PapeX Blog', robots: { index: false } }

  const title = `${post.title} | PapeX Blog`
  const description = post.excerpt || undefined
  const image = socialImageUrl(post.image)
  return {
    title,
    description,
    alternates: { canonical: postUrl(post.slug) },
    openGraph: {
      type: 'article',
      locale: 'en_US',
      url: postUrl(post.slug),
      siteName: 'PapeX',
      title: post.title,
      description,
      publishedTime: post.createdAt ?? undefined,
      modifiedTime: post.updatedAt ?? post.createdAt ?? undefined,
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@papex_receipts',
      title: post.title,
      description,
      images: [image],
    },
  }
}

/** schema.org Article, serialised safely for an inline <script>. */
function articleJsonLd(post: PublicPost): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    image: [socialImageUrl(post.image)],
    datePublished: post.createdAt ?? undefined,
    dateModified: post.updatedAt ?? post.createdAt ?? undefined,
    author: { '@type': 'Organization', name: 'PapeX', url: SITE_ORIGIN },
    publisher: {
      '@type': 'Organization',
      name: 'PapeX',
      url: SITE_ORIGIN,
      logo: { '@type': 'ImageObject', url: `${SITE_ORIGIN}/icons/icon-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl(post.slug) },
  }
  // Escape "<" so post text can never close the script element.
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPublishedPostBySlug(slug)

  if (!post) {
    // The four launch posts' old hand-written URLs (see LEGACY_SLUGS).
    const target = LEGACY_SLUGS[slug]
    if (target) {
      if (await getPublishedPostBySlug(target)) permanentRedirect(`/blog/${target}`)
      redirect('/blog') // migrated post currently unpublished: temporary
    }
    notFound()
  }

  const date = formatPostDate(post.createdAt)

  return (
    <SiteShell path="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd(post) }} />
      <FlowGround initial="light">
        <FlowSection ground="light" className={styles.top}>
          <article>
            <header className={styles.article}>
              <Link href="/blog" className={styles.back}>
                <span aria-hidden="true">←</span> All posts
              </Link>
              <div className={`${styles.meta} ${styles.metaOnGround}`}>
                {date && <time dateTime={post.createdAt ?? undefined}>{date}</time>}
                {date && post.readTime && (
                  <span className={styles.metaDot} aria-hidden="true">
                    ·
                  </span>
                )}
                {post.readTime && <span>{post.readTime}</span>}
              </div>
              <h1 className={`rd-display ${styles.postTitle}`}>{post.title}</h1>
              {post.excerpt && <p className={styles.postLead}>{post.excerpt}</p>}
              <LazyPostAdminEdit post={post} />
            </header>

            <div className={styles.hero}>
              <div className={styles.heroFrame}>
                <BlogImage src={post.image} alt="" sizes="(min-width: 1000px) 888px, 92vw" priority />
              </div>
            </div>

            <div className={`${styles.article} ${styles.body}`}>
              {/* Admin-authored HTML from the CMS (allow-listed editors only),
                  restructured into paragraphs by normalizePostHtml. */}
              <div className={styles.prose} dangerouslySetInnerHTML={{ __html: normalizePostHtml(post.content) }} />
            </div>
          </article>
        </FlowSection>

        <BlogCta />
        {/* The footer is the page's navy tail, inside the flow (2026-09-22):
            it declares ground="navy" like any other section, so the last light
            section crossfades into it instead of hitting a hard navy edge.
            `inFlow` makes it paint no background and take --flow-* ink.
            Mirrors components/paths/customer/index.tsx on purpose — the 2.1
            merge swaps all three mounts to FlowGround's `footer` prop. */}
        <FlowSection ground="navy">
          <SiteFooter inFlow />
        </FlowSection>
      </FlowGround>
    </SiteShell>
  )
}
