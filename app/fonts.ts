import localFont from 'next/font/local'

// Define the Barlow font
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
  ],
  variable: '--font-barlow',
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

// Define the Gloock font.
// `font-gloock` has been referenced by tailwind.config.ts (and used on
// app/survey/page.tsx + the blog post fallback markup) since before this
// commit, but `--font-gloock` was never defined anywhere, so the utility
// silently fell through to the Georgia fallback. fonts/Gloock-Regular.ttf was
// already vendored in the repo; this just wires it up.
export const gloock = localFont({
  src: [
    {
      path: '../fonts/Gloock-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-gloock',
  display: 'swap',
})