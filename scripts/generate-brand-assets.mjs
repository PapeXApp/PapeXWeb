// Regenerates every PapeX raster brand asset from the one vector source.
//
// Source of truth:  public/brand/vector/plane-src-orange.svg
// Canonical palette: navy #00121D, orange #EB7100 (decided 2026-09-09; the
// artwork used to ship #F6851F / #102F44, which never matched the UI tokens).
//
// Run:  node scripts/generate-brand-assets.mjs
import sharp from 'sharp'
import { writeFileSync, mkdirSync, readFileSync } from 'fs'

const NAVY = '#00121D'
const ORANGE = '#EB7100'
const WHITE = '#FFFFFF'

const SRC = 'public/brand/vector/plane-src-orange.svg'
const raw = readFileSync(SRC, 'utf8')

// .cls-1 is the plane body, .cls-2 the circuit lines (see the <defs><style> block).
const paint = (body, lines) =>
  Buffer.from(raw.replace('#f57e20', body).replace(/fill:\s*#fff\b/, `fill: ${lines}`))

const VARIANTS = {
  'plane-orange-white': [ORANGE, WHITE],  // on navy / dark surfaces
  'plane-orange-navy':  [ORANGE, NAVY],   // on white / off-white surfaces
  'plane-navy-white':   [NAVY, WHITE],    // on light surfaces where orange would compete
}

mkdirSync('public/brand', { recursive: true })
mkdirSync('public/icons', { recursive: true })

const planes = {}
for (const [name, [body, lines]] of Object.entries(VARIANTS)) {
  const svg = paint(body, lines)
  // .trim() drops the empty margin baked into the 1920x1080 artboard.
  const buf = await sharp(svg, { density: 300 }).trim().resize({ width: 1600 }).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(`public/brand/${name}.png`, buf)
  planes[name] = svg
  const { width, height } = await sharp(buf).metadata()
  console.log(`public/brand/${name}.png`.padEnd(40), `${width}x${height}`, `${(buf.length / 1024).toFixed(0)}K`)
}

// App icon: the plane on the navy field, matching the iOS icon's composition.
const ICON = 1024
const pad = Math.round(ICON * 0.17)
const planeOnNavy = await sharp(planes['plane-orange-white'], { density: 300 })
  .trim().resize({ width: ICON - pad * 2 }).png().toBuffer()
const bg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON}" height="${ICON}">
     <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
       <stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="#0a2431"/>
     </linearGradient></defs>
     <rect width="${ICON}" height="${ICON}" fill="url(#g)"/>
   </svg>`)
const icon = await sharp(bg).composite([{ input: planeOnNavy, gravity: 'center' }]).png().toBuffer()
writeFileSync('public/brand/app-icon.png', icon)

const SIZES = { 'favicon-16.png': 16, 'favicon-32.png': 32, 'favicon-48.png': 48,
                'apple-touch-icon.png': 180, 'icon-192.png': 192, 'icon-512.png': 512 }
const bufs = {}
for (const [name, size] of Object.entries(SIZES)) {
  const b = await sharp(icon).resize(size, size).png({ compressionLevel: 9 }).toBuffer()
  writeFileSync(`public/icons/${name}`, b)
  bufs[size] = b
  console.log(`public/icons/${name}`.padEnd(40), `${size}x${size}`, `${(b.length / 1024).toFixed(1)}K`)
}

// Multi-size .ico with PNG payloads (16/32/48).
const entries = [16, 32, 48].map((s) => ({ s, b: bufs[s] }))
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(entries.length, 4)
let offset = 6 + entries.length * 16
const dir = entries.map((e) => {
  const d = Buffer.alloc(16)
  d.writeUInt8(e.s, 0); d.writeUInt8(e.s, 1); d.writeUInt16LE(1, 4); d.writeUInt16LE(32, 6)
  d.writeUInt32LE(e.b.length, 8); d.writeUInt32LE(offset, 12); offset += e.b.length
  return d
})
const ico = Buffer.concat([header, ...dir, ...entries.map((e) => e.b)])
writeFileSync('public/favicon.ico', ico)
console.log('public/favicon.ico'.padEnd(40), '16/32/48', `${(ico.length / 1024).toFixed(1)}K`)
