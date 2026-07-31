// lib/pathChoice.ts
//
// Remembers which side of the homepage fork a visitor committed to.
//
// The fork at `/` is a one-time choice, not a scroll position: once a visitor
// picks Customers or Business we persist it, and a later hard visit to `/` is
// sent straight to their side instead of asking again. Clicking the logo or
// nav "Home" clears the memory and deliberately shows the fork again.
//
// localStorage (not a cookie) on purpose: nothing server-side needs to read
// this, and `/` stays a static route with no per-request variation, so it
// keeps its CDN cacheability. The redirect therefore has to be client-side —
// see FORK_SKIP_SCRIPT below for how we do that without flashing the fork.

export type PathChoice = 'customer' | 'business'

export const PATH_CHOICE_KEY = 'papex.pathChoice'

/** Attribute set on <html> while a stored-choice redirect is in flight. */
export const FORK_SKIP_ATTR = 'data-fork-skip'

export const PATH_HREF: Record<PathChoice, string> = {
  customer: '/customers',
  business: '/business',
}

function isPathChoice(value: unknown): value is PathChoice {
  return value === 'customer' || value === 'business'
}

/** SSR-safe: returns null on the server and when storage is unavailable. */
export function getPathChoice(): PathChoice | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PATH_CHOICE_KEY)
    return isPathChoice(raw) ? raw : null
  } catch {
    // Safari private mode / storage disabled — degrade to "no memory".
    return null
  }
}

export function setPathChoice(choice: PathChoice): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PATH_CHOICE_KEY, choice)
  } catch {
    /* no-op */
  }
}

export function clearPathChoice(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PATH_CHOICE_KEY)
  } catch {
    /* no-op */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute(FORK_SKIP_ATTR)
  }
}

/**
 * Inline, render-blocking script embedded at the top of `/`.
 *
 * It runs while the browser is still parsing the document — before the fork
 * has had a chance to paint — and stamps <html data-fork-skip>, which
 * papex-brand.css turns into `visibility:hidden` on `.rd-fork`. The actual
 * navigation is then done client-side by <ForkGate>. Doing the hiding in the
 * script and the navigation in React (rather than `location.replace` here)
 * keeps it a soft navigation while still guaranteeing zero fork flash.
 *
 * Crawlers and first-time visitors have no stored value, so they get the fork.
 */
export const FORK_SKIP_SCRIPT = `(function(){try{var v=localStorage.getItem(${JSON.stringify(
  PATH_CHOICE_KEY,
)});if(v==='customer'||v==='business'){document.documentElement.setAttribute(${JSON.stringify(
  FORK_SKIP_ATTR,
)},v);}}catch(e){}})();`
