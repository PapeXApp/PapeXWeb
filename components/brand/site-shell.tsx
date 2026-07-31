// components/brand/site-shell.tsx
//
// Shared chrome for the redesigned site: the `.rd` token scope + the nav on
// every screen, plus the dark footer on the two path pages. Stays a server
// component so page content passed as `children` keeps rendering on the server.
//
// `.rd` is the scope class that activates styles/papex-brand.css. Everything
// brand-new must live inside it; the legacy `.framer-site` pages must not.

import type { ReactNode } from 'react'
import { SiteNav, type SitePath } from './site-nav'
import { SiteFooter } from './site-footer'
import { RememberPath } from './remember-path'

export function SiteShell({
  path,
  children,
}: {
  path: SitePath
  children: ReactNode
}) {
  const isFork = path === 'fork'
  return (
    <div className="rd">
      {!isFork && <RememberPath choice={path} />}
      <SiteNav path={path} />
      <main>{children}</main>
      {!isFork && <SiteFooter />}
    </div>
  )
}
