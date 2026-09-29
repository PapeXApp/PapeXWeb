/**
 * PapeX Cafe's logo — the invented demo merchant on /business (Nico,
 * 2026-09-29). STUB: a navy disc with an orange "P". The dashboard worker
 * replaces the artwork (coffee cup built from the PapeX paper plane); the
 * export name and props are the contract the phone demo imports, keep them.
 */
export function PapexCafeLogo({
  size = 40,
  className,
  title = "PapeX Cafe",
}: {
  size?: number
  className?: string
  title?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} role="img" aria-label={title}>
      <circle cx="20" cy="20" r="20" fill="#00121D" />
      <text x="20" y="27" textAnchor="middle" fontSize="20" fontWeight="700" fill="#EB7100" fontFamily="system-ui, sans-serif">
        P
      </text>
    </svg>
  )
}
