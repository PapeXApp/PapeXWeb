import "@/styles/framer-site.css"
import { SiteNav } from "@/components/brand/site-nav"
import { SiteFooter } from "@/components/brand/site-footer"

// New chrome for the nine re-skinned legacy pages (contact, blog, pci,
// support, waitlist, pos-calculator, terms, privacy). `.rd` is the token
// scope for the redesign (see components/brand/site-shell.tsx) — the legacy
// `.framer-site` page body must NOT sit inside it, so SiteNav and SiteFooter
// each get their own `.rd` wrapper and `<main>` stays outside. `path="page"`
// is the neutral SitePath variant (components/brand/site-nav.tsx): no
// path-choice logic, no RememberPath, light glass by default.
export function FramerPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="framer-site">
      <div className="rd">
        <SiteNav path="page" />
      </div>
      <main className="framer-subpage">{children}</main>
      <div className="rd">
        <SiteFooter />
      </div>
    </div>
  )
}
