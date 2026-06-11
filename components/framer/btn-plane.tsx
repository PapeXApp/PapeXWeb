import { Send } from "lucide-react"

/**
 * Paper-plane glyph for CTA buttons. Two stacked copies: on hover/focus the
 * first darts off to the top-right while the second swoops in from the
 * bottom-left to replace it (see .btn-plane CSS). Pure markup — server-safe,
 * the takeoff is CSS-only.
 */
export function BtnPlane() {
  return (
    <span className="btn-plane" aria-hidden="true">
      <Send className="btn-plane-a" />
      <Send className="btn-plane-b" />
    </span>
  )
}
