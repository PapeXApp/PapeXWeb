// app/merchant/ui/tokens.ts
//
// Color tokens for the merchant dashboard — the same dark "liquid glass"
// values app/r/ui.tsx uses for the consumer receipt viewer (source of truth:
// PapeXV2/theme/tokens.ts), duplicated rather than imported because app/r/ui.tsx
// deliberately doesn't export its `T` const (it's a private module-local
// convenience there). Keeping the dashboard chrome and the receipt viewer on
// byte-identical hex values is what makes "merchant clicks into a
// transaction and sees the exact same receipt card" feel like one product
// instead of two skins bolted together.

export const T = {
  orange: "#FB8500",
  orangeDim: "rgba(251, 133, 0, 0.16)",
  blue: "#2B7FC6",
  text: "#F4F4F4",
  textSecondary: "#C4C7CC",
  textMuted: "#9AA1A8",
  success: "#10B981",
  warning: "#F5A524",
  error: "#EF4444",
  glassBg: "rgba(20, 26, 36, 0.6)",
  glassBgSolid: "#141A24",
  glassBorder: "rgba(255, 255, 255, 0.12)",
  divider: "rgba(255, 255, 255, 0.12)",
  pageBg: "#181A20",
} as const;

export const glassCardStyle = {
  background: T.glassBg,
  borderColor: T.glassBorder,
} as const;
