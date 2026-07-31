// Striped, monospace-labelled layout reservation for imagery that hasn't
// shipped yet (RDH hardware render, dashboard mockup, etc). Dimensions and
// aspect ratio are load-bearing — they reserve the real image's layout.
// Rendered as `role="img"` with `aria-label` so screen readers get the same
// "this is a photo of X, coming soon" signal a real <img alt> would give;
// the visible mono text is `aria-hidden` to avoid double announcement.

interface PlaceholderBoxProps {
  label: string
  aspectRatio: string
  theme?: "dark" | "light"
  stripeSize?: number
  borderRadius?: string
  className?: string
}

const STRIPE_THEME = {
  dark: {
    a: "#0a2431",
    b: "#0c2937",
    border: "rgba(255,255,255,.08)",
    text: "rgba(245,245,245,.4)",
  },
  light: {
    a: "#eeeeee",
    b: "#e6e6e6",
    border: "rgba(0,18,29,.08)",
    text: "#9a9a9a",
  },
} as const

export function PlaceholderBox({
  label,
  aspectRatio,
  theme = "dark",
  stripeSize = 12,
  borderRadius = "20px",
  className = "",
}: PlaceholderBoxProps) {
  const colors = STRIPE_THEME[theme]
  const band = stripeSize * 2

  return (
    <div
      role="img"
      aria-label={label}
      className={`flex items-center justify-center border p-5 ${className}`}
      style={{
        aspectRatio,
        borderRadius,
        borderColor: colors.border,
        background: `repeating-linear-gradient(45deg, ${colors.a} 0 ${stripeSize}px, ${colors.b} ${stripeSize}px ${band}px)`,
      }}
    >
      <span
        aria-hidden="true"
        className="text-center font-mono text-[13px] tracking-[.08em]"
        style={{ color: colors.text }}
      >
        {label}
      </span>
    </div>
  )
}
