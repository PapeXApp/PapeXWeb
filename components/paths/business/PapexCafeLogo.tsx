import { PlaneMark } from "@/components/brand/plane-mark"

/**
 * PapeX Cafe's logo — the invented demo merchant on /business (Nico,
 * 2026-09-29): a navy coffee cup on a warm cream disc whose steam is the PapeX
 * paper plane (components/brand/plane-mark.tsx, the one brand vector — orange
 * body, navy circuit lines), flying up out of the cup on a dotted trail.
 *
 * Built to read at two sizes: at 96px it shows the plane's circuit lines and
 * the trail; below 40px those details would only smear, so the plane is drawn
 * as a solid orange silhouette and the trail is dropped.
 *
 * The export name and props (size, className, title) are the contract the
 * phone demo imports — keep them.
 */

const NAVY = "#00121D"
const ORANGE = "#EB7100"
const CREAM = "#FFF4E8"

/** PlaneMark's artwork aspect (its tightened viewBox, w / h). */
const PLANE_ASPECT = 1347.31 / 790.68

export function PapexCafeLogo({
  size = 40,
  className,
  title = "PapeX Cafe",
}: {
  size?: number
  className?: string
  title?: string
}) {
  const detailed = size >= 40
  const planeW = detailed ? 40 : 44
  const planeH = planeW / PLANE_ASPECT
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" className={className} role="img" aria-label={title}>
      <circle cx="48" cy="48" r="47" fill={CREAM} stroke={NAVY} strokeWidth={detailed ? 2 : 3} />
      {/* handle, drawn first so the cup body covers its inner half */}
      <circle cx="62" cy="57" r="6.5" fill="none" stroke={NAVY} strokeWidth="4.5" />
      {/* cup */}
      <path d="M24 48 H63 V54 C63 66.5 55 74.5 43.5 74.5 C32 74.5 24 66.5 24 54 Z" fill={NAVY} />
      {/* coffee, just showing at the rim */}
      <rect x="27" y="48" width="33" height="3" rx="1.5" fill={ORANGE} />
      {/* saucer */}
      <rect x="18" y="77.5" width="51" height="4.5" rx="2.25" fill={NAVY} />
      {detailed ? (
        // the steam's trail: from the coffee up to the plane's tail
        <path
          d="M42 44 C37.5 40.5 36.5 36.5 39 32.5"
          fill="none"
          stroke={ORANGE}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="0.1 4.4"
        />
      ) : null}
      {/* the steam: the PapeX plane, climbing out of the cup */}
      <g transform={`translate(${detailed ? 37 : 33} ${detailed ? 16 : 15}) rotate(-4 ${planeW / 2} ${planeH / 2})`}>
        <PlaneMark body={ORANGE} lines={detailed ? NAVY : ORANGE} size={planeW} />
      </g>
    </svg>
  )
}
