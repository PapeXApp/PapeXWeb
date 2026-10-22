// app/w/page.tsx
//
// `/w` is `/r` without the App Clip. Same page, same data, same canonical and
// og:url (both stay `https://papex.app/r?...`, see app/r/receiptPage.tsx's
// receiptPageUrl and the og:url note there), with these differences:
//   - no Smart App Banner meta (`apple-itunes-app`);
//   - on iOS, "Save to PapeX" goes to the App Store listing, not the
//     universal link (links.papex.app/rdh?sid=), which can open the App Clip.
//     The sid is NOT carried: installing the app does not save this receipt.
//     Android/desktop keep /r's in-page sign-in and claim, which never
//     involves the App Clip;
//   - a Dutchie receipt's loyalty block: points earned / used / balance, or,
//     for a non-member, the merchant's own rewards sign-up link
//     (lib/merchantLoyalty.ts; clicks counted by /api/events/loyalty-click).
//
// WHY. An RDH unit broadcasting `https://papex.app/r?sid=...` hands iPhones to
// the App Clip (the AASA `applinks` paths and the ASC advanced experience both
// cover /r), and the App Clip mis-parses text receipts until the next app
// release. Union Street's unit 003 broadcasts `/w?sid=...` instead so iPhones
// open the receipt in Safari. That only holds while:
//   - `/w` stays OUT of public/.well-known/apple-app-site-association
//     (applinks: /invite/*, /r, /r/*, /rdh, /rdh/*), and no App Clip
//     experience is registered for it in App Store Connect;
//   - this page emits no `apple-itunes-app` meta (app/w/wPage.test.tsx).

import type { Metadata } from "next";
import { withoutAppClipBanner } from "@/lib/appClipBanner";
import { APP_STORE_URL } from "@/lib/storeLinks";
import { receiptMetadata, renderReceiptPage, type ReceiptSearchParams } from "../r/receiptPage";

type Props = { searchParams: Promise<ReceiptSearchParams> };

// Literal, not re-exported: Next reads route segment config statically.
export const dynamic = "force-dynamic";

export async function generateMetadata(props: Props): Promise<Metadata> {
  return withoutAppClipBanner(await receiptMetadata(props));
}

export default async function WebOnlyReceiptPage(props: Props) {
  return renderReceiptPage(props, { iosSaveHref: APP_STORE_URL, showLoyalty: true });
}
