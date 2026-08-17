import localFont from 'next/font/local'

// Define the Barlow font
//
// SemiBold (600) and Bold (700) added for the /r receipt page (see
// docs/PAPEX_DESIGN_KIT_FOR_WEB.md §3.2/§3.4) - buttons and the sample
// watermark use SemiBold/Bold, matching PapeXV2's Button.tsx and the app's
// h1-h3 scale. Adding weights to this same --font-barlow family is additive
// and doesn't change how any existing (300/400/500) text on the rest of the
// site renders.
export const barlow = localFont({
  src: [
    {
      path: '../fonts/Barlow-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/Barlow-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Barlow-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/Barlow-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../fonts/Barlow-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-barlow',
  display: 'swap',
})

// IBM Plex Mono - the app's "eyebrow"/stat figure family (theme/tokens.ts
// `typography.eyebrow`/`stat`). receiptDetail.tsx itself doesn't use it for
// money (see spec §3.4 - money stays Barlow-Medium there), but the /r page
// borrows the eyebrow convention (Medium, 11px, +0.08em, uppercase) for its
// "Receipt" header label and the monospace original-receipt dump. Self-hosted
// like Barlow, no CDN.
export const ibmPlexMono = localFont({
  src: [
    {
      path: '../fonts/IBMPlexMono-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/IBMPlexMono-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
})

// Define the Kameron font
export const kameron = localFont({
  src: [
    {
      path: '../fonts/Kameron-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-kameron',
  display: 'swap',
})