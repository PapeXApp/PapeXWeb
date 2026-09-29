import "@/styles/framer-site.css"
import { SiteNav } from "@/components/brand/site-nav"
import { SiteFooter } from "@/components/brand/site-footer"
import { SkipLink } from "@/components/brand/skip-link"
import { MAIN_ID } from "@/components/brand/links"

// Chrome for the re-skinned legacy pages (/app-support, /pci, /pos-calculator,
// /privacy, /support, /survey, /terms). `.rd` is the token scope for the
// redesign (see components/brand/site-shell.tsx) — the legacy `.framer-site`
// page body must NOT sit inside it, so the nav and SiteFooter each get their
// own `.rd` wrapper and `<main>` stays outside. `path="page"` is the neutral
// SitePath variant (components/brand/site-nav.tsx): no path-choice logic, no
// RememberPath, light glass by default.
//
// `data-nav-theme="light"` on <main> (o-19): every legacy page body is a light
// page, so the nav's glass probe (components/brand/use-glass-theme.ts) is told
// so outright instead of guessing from whatever it hits; a genuinely dark
// element inside the page still wins, because the probe reads the innermost
// tag or background first. The footer tags itself dark.
export function FramerPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="framer-site">
      <div className="rd">
        {/* First tab stop on the page (s-07), before the nav. */}
        <SkipLink />
        <SiteNav path="page" />
      </div>
      <main id={MAIN_ID} tabIndex={-1} className="framer-subpage" data-nav-theme="light">
        {children}
      </main>
      <div className="rd">
        <SiteFooter />
      </div>
    </div>
  )
}
