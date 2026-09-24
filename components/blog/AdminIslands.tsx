'use client'

// components/blog/AdminIslands.tsx
//
// The CMS controls (create / edit) pull in the Firebase client SDK, Firebase
// Auth, the rich editor modals and browser image compression — hundreds of KB
// that no reader needs. Loading them with `ssr: false` keeps them out of the
// blog's first-load JS and out of the server render; they arrive after
// hydration and render nothing unless the visitor is a signed-in admin.

import dynamic from 'next/dynamic'

export const LazyBlogAdminCreate = dynamic(
  () => import('./BlogAdminCreate').then((m) => m.BlogAdminCreate),
  { ssr: false },
)

export const LazyPostAdminEdit = dynamic(
  () => import('./PostAdminEdit').then((m) => m.PostAdminEdit),
  { ssr: false },
)
