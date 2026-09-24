'use client'

// components/blog/PostAdminEdit.tsx
//
// Admin-only "Edit post" control on /blog/[slug] (the rest of the page is a
// Server Component). Writes go through EditBlogModal → lib/blogServiceFree.ts
// on the client SDK, exactly as before. Saving a new title regenerates the
// slug in the CMS, so after an update we re-read the post by id and move to
// the new URL if it changed. The public page is ISR (60s), so the saved
// version shows there within about a minute.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EditBlogModal } from '@/components/EditBlogModal'
import { useAdminAuth } from '@/hooks/useAdmin'
import { blogService, type BlogPost } from '@/lib/blogServiceFree'
import styles from './blog.module.css'

export function PostAdminEdit({ post }: { post: BlogPost }) {
  const { isAdmin } = useAdminAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!isAdmin || !post.id) return null

  const onUpdated = async () => {
    setSaved(true)
    const fresh = await blogService.getBlogById(post.id)
    if (fresh?.slug && fresh.slug !== post.slug) router.push(`/blog/${fresh.slug}`)
    else router.refresh()
  }

  return (
    <div className={styles.adminBar}>
      <button type="button" className="rd-btn rd-btn-outline" onClick={() => setOpen(true)}>
        Edit post
      </button>
      {saved && (
        <span className={styles.adminNote} role="status">
          Saved. The public page updates within a minute.
        </span>
      )}
      <EditBlogModal isOpen={open} onClose={() => setOpen(false)} onBlogUpdated={onUpdated} blog={post} />
    </div>
  )
}
