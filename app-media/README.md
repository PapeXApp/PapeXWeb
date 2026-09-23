# App media — real PapeXV2 screens on /customers

The four demo iPhones on `/customers` draw their screens by hand. Drop real
iPhone captures in here and they play the real app instead. Any slot you leave
empty keeps its drawn screen, so a half-filled manifest never breaks the site.

## Refresh the app media

1. Put the screen recordings / screenshots in `app-media/inbox/`.
2. Open `app-media/manifest.json` and set each slot's `"source"` to the exact
   filename (and `"type"`: `"video"` or `"image"`; `"trim"` in seconds for
   videos, capped at 12s).
3. `npm run media:import`
4. Reload `http://localhost:3001/customers`.

Telling Claude **"refresh the app media"** means exactly steps 2–4.

## Slots

| slot | phone | component |
| --- | --- | --- |
| `hero-tap` | hero, tap → receipt (video preferred) | `NfcPhone.tsx` |
| `receipts-search` | receipt list + search | `FeatureScreens.tsx` |
| `share-sheet` | iOS share sheet (image) | `FeatureScreens.tsx` |
| `walk-ready` / `walk-receipt` / `walk-list` | walkthrough steps 0 / 1 / 2 | `WalkPhone.tsx` |
| `walk` | one video used for all three walkthrough steps | `WalkPhone.tsx` |

Capture full-screen on an iPhone (393×852-ish). Anything else is centre-cropped
to that aspect and scaled to 780px wide; recordings lose their audio. Outputs
land in `public/app/media/` (`.mp4` + `.webm` + `-poster.jpg`, or `.png`) and are
listed in `public/app/media/index.json`, which `components/paths/shared/AppMedia.tsx`
reads. Needs `ffmpeg` on PATH (`brew install ffmpeg`).
