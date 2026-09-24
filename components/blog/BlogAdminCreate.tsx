'use client'

// components/blog/BlogAdminCreate.tsx
//
// The CMS "new post" button on /blog. CreateBlogModal renders nothing unless
// the visitor is a signed-in admin (hooks/useAdmin.ts), so this island is
// inert for everyone else. The listing is ISR (60s), so a new post appears on
// the public page within about a minute; router.refresh() picks it up as soon
// as the cache has turned over.

import { useRouter } from 'next/navigation'
import { CreateBlogModal } from '@/components/CreateBlogModal'

export function BlogAdminCreate() {
  const router = useRouter()
  return <CreateBlogModal onBlogCreated={() => router.refresh()} />
}
