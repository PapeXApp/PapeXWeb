#!/usr/bin/env node
// scripts/generate-rds-counter.mjs
//
// Renders the PapeX sticker lying on a store countertop, beside a card
// terminal, in the same true-isometric camera as
// public/product/rds-sticker.webp:
//   public/product/rds-counter.webp       section 04, /customers
//   public/product/rds-counter-story.webp the /business story (section 03): a
//                                         shallower counter, shown whole
//   public/product/rds-counter-hero.webp  the /business hero (the counter run
//                                         out left, a barcode scanner on it)
// The source of record is scripts/rds-counter/counter-iso.html (inline SVG;
// the sticker group is the sticker art's own isometric source, verbatim; the
// variant is its location.hash). Edit that, then run:
//
//   node scripts/generate-rds-counter.mjs
//
// Needs Google Chrome (headless, for the SVG + Google Fonts text) and network
// for the fonts; sharp trims the transparent margin and writes the webp.

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import sharp from "sharp"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SRC = path.join(ROOT, "scripts/rds-counter/counter-iso.html")
const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
/** Final width (px): crisp at section 04's ~700px column on a 2x screen. */
const WIDTH = 1400

/** viewBox origin and px per unit of the render (counter-iso.html). */
const VB_X = -160
const VB_Y = -110
const PX = 7.5
const VARIANTS = [
  { out: "public/product/rds-counter.webp", hash: "" },
  { out: "public/product/rds-counter-hero.webp", hash: "#hero", scanWindow: [-9.27, 10.35] },
  { out: "public/product/rds-counter-story.webp", hash: "#story" },
]

for (const v of VARIANTS) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rds-counter-"))
  const png = path.join(tmp, "render.png")
  execFileSync(CHROME, [
    "--headless=new",
    "--hide-scrollbars",
    "--default-background-color=00000000",
    "--window-size=3075,1875",
    "--virtual-time-budget=6000",
    `--user-data-dir=${path.join(tmp, "profile")}`,
    `--screenshot=${png}`,
    pathToFileURL(SRC).href + v.hash,
  ])
  const { data: trimmed, info: t } = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true })
  const out = path.join(ROOT, v.out)
  const info = await sharp(trimmed)
    .resize({ width: WIDTH })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(out)
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`wrote ${v.out} ${info.width}x${info.height} (${info.size} bytes)`)

  // Where things land in the webp, as fractions of its width / height. The
  // site places rings, glows, the phone's tap and the scan beam from these
  // numbers: if the art moves, update them (hero, story, section 04,
  // NfcTag). The sticker's tap target (its rings' centre) is viewBox
  // (55.267, 39.976); the scanner's window is in v.scanWindow.
  const at = (x, y) => [((x - VB_X) * PX + t.trimOffsetLeft) / t.width, ((y - VB_Y) * PX + t.trimOffsetTop) / t.height]
  const pct = ([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`
  console.log("  tap target", pct(at(55.267, 39.976)))
  if (v.scanWindow) console.log("  scanner window", pct(at(...v.scanWindow)))
  // The trimmed image's own box in viewBox units (x0, y0, width, height):
  // what lays this art exactly over rds-sticker.webp (whose box is x 5.98,
  // y 9.45, 110.6 x 67.06 units in the same camera), see story.module.css
  // .counterImg and customer/nfcTag.module.css .art.
  console.log(
    "  box (units)",
    [VB_X - t.trimOffsetLeft / PX, VB_Y - t.trimOffsetTop / PX, t.width / PX, t.height / PX].map((n) => n.toFixed(2)).join(" "),
  )
}
