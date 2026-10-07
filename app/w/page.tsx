// app/w/page.tsx
//
// `/w` is `/r` without the App Clip. Same page, same data, same canonical and
// og:url (both stay `https://papex.app/r?...`, see app/r/page.tsx's
// receiptPageUrl and the og:url note there), minus the Smart App Banner meta
// (`apple-itunes-app`).
//
// WHY. An RDH unit broadcasting `https://papex.app/r?sid=...` hands iPhones to
// the App Clip (the AASA `applinks` paths and the ASC advanced experience both
// cover /r). Union Street's unit 003 broadcasts `/w?sid=...` instead so iPhones
// open the receipt in Safari. That only holds while:
//   - `/w` stays OUT of public/.well-known/apple-app-site-association
//     (applinks: /invite/*, /r, /r/*, /rdh, /rdh/*), and no App Clip
//     experience is registered for it in App Store Connect;
//   - this page emits no `apple-itunes-app` meta (app/w/wPage.test.tsx).

import type { Metadata } from "next";
import { withoutAppClipBanner } from "@/lib/appClipBanner";
import ReceiptPage, { generateMetadata as receiptMetadata } from "../r/page";

// Literal, not re-exported: Next reads route segment config statically.
export const dynamic = "force-dynamic";

export async function generateMetadata(props: Parameters<typeof receiptMetadata>[0]): Promise<Metadata> {
  return withoutAppClipBanner(await receiptMetadata(props));
}

export default ReceiptPage;
