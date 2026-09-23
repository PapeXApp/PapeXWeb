#!/usr/bin/env node
/**
 * import-app-media.mjs — turns raw iPhone captures into the web media the
 * demo phones on /customers play.
 *
 * Read app-media/README.md first. In one line:
 *   drop files in app-media/inbox/ → name them in app-media/manifest.json →
 *   `npm run media:import` → public/app/media/* + index.json are rebuilt.
 *
 * Only ffmpeg/ffprobe are used (no npm dependencies, no sharp). Every output
 * is centre-cropped to the iPhone screen aspect (393:852) when the source
 * differs, then scaled to 780px wide.
 *
 * A slot whose source is empty, or whose file is missing, is skipped and left
 * OUT of index.json — <AppMedia> then renders the hand-drawn fallback screen,
 * which is why a half-filled manifest can never break the site.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INBOX = join(ROOT, "app-media", "inbox");
const MANIFEST = join(ROOT, "app-media", "manifest.json");
const OUT_DIR = join(ROOT, "public", "app", "media");
const INDEX = join(OUT_DIR, "index.json");

/** iPhone 15/16 logical screen — the aspect every phone frame on the site draws. */
const TARGET_W = 393;
const TARGET_H = 852;
const OUT_W = 780;
/** Hard ceiling on a clip, so a stray 3-minute recording can't ship. */
const MAX_SECONDS = 12;

/** Centre-crop to 393:852 (a no-op when the source already matches), then scale. */
// Every iPhone capture carries the system status bar (clock, signal, and on a
// dev build the red recording pill) in its top ~5.6%. The site's bezel draws its
// own Dynamic Island, so that strip is cut first, then the frame is
// centre-cropped to 393:852 (losing ~2% of width) and scaled.
const STATUS_BAR = 0.056;
const VF = [
  `crop=iw:ih*(1-${STATUS_BAR}):0:ih*${STATUS_BAR}`,
  `crop='min(iw,ih*${TARGET_W}/${TARGET_H})':'min(ih,iw*${TARGET_H}/${TARGET_W})'`,
  `scale=${OUT_W}:-2:flags=lanczos`,
].join(",");

function die(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

function haveBinary(bin) {
  return spawnSync(bin, ["-version"], { stdio: "ignore" }).status === 0;
}

function run(bin, args) {
  const result = spawnSync(bin, args, { encoding: "utf8" });
  if (result.error) die(`${bin} failed to start: ${result.error.message}`);
  if (result.status !== 0) {
    die(`${bin} exited ${result.status}\n\n${(result.stderr || "").split("\n").slice(-18).join("\n")}`);
  }
  return result.stdout;
}

/** [width, height] of a produced file, via ffprobe. */
function probeSize(file) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
     "-of", "csv=s=x:p=0", file],
    { encoding: "utf8" },
  ).trim();
  const [w, h] = out.split("x").map((n) => Number.parseInt(n, 10));
  return [w, h];
}

/** Manifest trim → the ffmpeg -ss / -t pair, clamped to MAX_SECONDS. */
function trimArgs(trim) {
  const start = Number(trim?.start) || 0;
  const end = trim?.end === null || trim?.end === undefined ? null : Number(trim.end);
  const duration = end === null ? MAX_SECONDS : Math.min(Math.max(end - start, 0.1), MAX_SECONDS);
  return { seek: ["-ss", String(start)], length: ["-t", String(duration)] };
}

function importVideo(key, src, entryCfg) {
  const { seek, length } = trimArgs(entryCfg.trim);
  const mp4 = join(OUT_DIR, `${key}.mp4`);
  const webm = join(OUT_DIR, `${key}.webm`);
  const poster = join(OUT_DIR, `${key}-poster.jpg`);

  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...seek, "-i", src, ...length,
    "-vf", VF, "-an", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-crf", "23", "-preset", "slow", "-movflags", "+faststart", mp4]);

  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...seek, "-i", src, ...length,
    "-vf", VF, "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuv420p",
    "-b:v", "0", "-crf", "34", "-row-mt", "1", "-deadline", "good", "-cpu-used", "4", webm]);

  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...seek, "-i", src,
    "-frames:v", "1", "-vf", VF, "-q:v", "3", poster]);

  const [width, height] = probeSize(mp4);
  // PNG left over from a slot that used to be an image would otherwise shadow it.
  rmSync(join(OUT_DIR, `${key}.png`), { force: true });
  return {
    entry: {
      type: "video",
      mp4: `/app/media/${key}.mp4`,
      webm: `/app/media/${key}.webm`,
      poster: `/app/media/${key}-poster.jpg`,
      loop: entryCfg.loop !== false,
      width,
      height,
      updatedAt: new Date().toISOString(),
    },
    outputs: [`${key}.mp4`, `${key}.webm`, `${key}-poster.jpg`],
  };
}

function importImage(key, src) {
  const png = join(OUT_DIR, `${key}.png`);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", src,
    "-frames:v", "1", "-vf", VF, png]);
  const [width, height] = probeSize(png);
  for (const stale of [`${key}.mp4`, `${key}.webm`, `${key}-poster.jpg`]) {
    rmSync(join(OUT_DIR, stale), { force: true });
  }
  return {
    entry: {
      type: "image",
      png: `/app/media/${key}.png`,
      width,
      height,
      updatedAt: new Date().toISOString(),
    },
    outputs: [`${key}.png`],
  };
}

function main() {
  if (!haveBinary("ffmpeg") || !haveBinary("ffprobe")) {
    die("ffmpeg/ffprobe not found on PATH. Install with `brew install ffmpeg`, then re-run `npm run media:import`.");
  }
  if (!existsSync(MANIFEST)) die(`No manifest at ${MANIFEST}`);

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
  } catch (error) {
    die(`app-media/manifest.json is not valid JSON: ${error.message}`);
  }
  const slots = manifest.slots ?? {};
  mkdirSync(OUT_DIR, { recursive: true });

  const index = {};
  const rows = [];

  for (const [key, cfg] of Object.entries(slots)) {
    const source = (cfg?.source ?? "").trim();
    if (!source) {
      rows.push([key, "—", "skipped (no source) → drawn fallback"]);
      continue;
    }
    const src = join(INBOX, source);
    if (!existsSync(src)) {
      rows.push([key, source, "MISSING in app-media/inbox → drawn fallback"]);
      continue;
    }
    const type = cfg.type === "video" ? "video" : "image";
    const { entry, outputs } = type === "video"
      ? importVideo(key, src, cfg)
      : importImage(key, src);
    index[key] = entry;
    rows.push([key, source, `${entry.width}x${entry.height} → ${outputs.join(", ")}`]);
  }

  writeFileSync(INDEX, `${JSON.stringify(index, null, 2)}\n`);

  const widths = [0, 1, 2].map((i) => Math.max(...rows.map((r) => r[i].length), 0));
  console.log("\n  app media\n");
  for (const row of rows) {
    console.log(`  ${row[0].padEnd(widths[0])}  ${row[1].padEnd(widths[1])}  ${row[2]}`);
  }
  console.log(`\n  ${Object.keys(index).length}/${Object.keys(slots).length} slots live → public/app/media/index.json\n`);
}

main();
