import { PlaneMark } from "@/components/brand/plane-mark"

/**
 * Paper-plane glyph for CTA buttons. Two stacked copies: on hover/focus the
 * first darts off to the top-right while the second swoops in from the
 * bottom-left to replace it (see .btn-plane CSS). Pure markup — server-safe,
 * the takeoff is CSS-only.
 *
 * Solid white to match the previous Lucide `Send` glyph it replaces — these
 * CTAs live on the legacy `.btn-download` orange-gradient button (outside
 * the `.rd` redesign scope), so the brand-orange plane body would disappear
 * into the button background.
 */
export function BtnPlane() {
  return (
    <span className="btn-plane" aria-hidden="true">
      <PlaneMark className="btn-plane-a" size={16} body="var(--white)" lines="var(--white)" />
      <PlaneMark className="btn-plane-b" size={16} body="var(--white)" lines="var(--white)" />
    </span>
  )
}
