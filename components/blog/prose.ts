// components/blog/prose.ts
//
// Turns CMS post HTML into paragraph-structured HTML.
//
// The CMS editor (CreateBlogModal / EditBlogModal) stores posts as top-level
// text separated by <br> runs, with <h2>/<h3>/<ul> blocks mixed in — e.g.
// `<h2>Title</h2><br><br>First paragraph.<br><br>Second…`. Rendered as-is
// there are no paragraphs to space, and the <br>s after headings stack extra
// gaps. This pass, at the TOP level only:
//   - keeps block elements (headings, lists, quotes, pre, tables, p, div, hr,
//     figure) exactly as written;
//   - splits the loose text between them on <br> runs and wraps each piece in
//     <p>, dropping <br>s that only pad a block.
// <br>s inside a block (e.g. within an <li>) are left alone. If the markup is
// unbalanced in a way this scanner doesn't understand, the original HTML is
// returned untouched — the pass is cosmetic, never lossy.
//
// It does NOT sanitise: post HTML is written by allow-listed admins only, as
// before (the old client pages injected it the same way).

const BLOCK_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'blockquote', 'pre', 'table', 'p', 'div', 'figure', 'section',
])
const VOID_BLOCK_TAGS = new Set(['hr'])

const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g

function wrapInline(chunk: string, out: string[]) {
  for (const piece of chunk.split(/(?:<br\s*\/?>\s*)+/i)) {
    // Skip whitespace / &nbsp;-only fragments.
    if (piece.replace(/&nbsp;|\s/gi, '') === '') continue
    out.push(`<p>${piece.trim()}</p>`)
  }
}

export function normalizePostHtml(html: string): string {
  if (!html) return ''
  const out: string[] = []
  let depth = 0
  let blockTag = ''
  let blockStart = 0
  let inlineStart = 0

  TAG_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TAG_RE.exec(html))) {
    const closing = m[1] === '/'
    const tag = m[2].toLowerCase()
    const isBlock = BLOCK_TAGS.has(tag)

    if (depth === 0) {
      if (VOID_BLOCK_TAGS.has(tag) && !closing) {
        wrapInline(html.slice(inlineStart, m.index), out)
        out.push(m[0])
        inlineStart = TAG_RE.lastIndex
        continue
      }
      if (!isBlock) continue
      if (closing) return html // stray closing block tag: don't guess
      if (m[0].endsWith('/>')) continue
      wrapInline(html.slice(inlineStart, m.index), out)
      blockTag = tag
      blockStart = m.index
      depth = 1
      continue
    }

    // Inside a top-level block: only track nesting of the same tag name.
    if (tag !== blockTag || m[0].endsWith('/>')) continue
    depth += closing ? -1 : 1
    if (depth === 0) {
      out.push(html.slice(blockStart, TAG_RE.lastIndex))
      inlineStart = TAG_RE.lastIndex
    }
  }

  if (depth !== 0) return html // unclosed block
  wrapInline(html.slice(inlineStart), out)
  return out.join('\n')
}
