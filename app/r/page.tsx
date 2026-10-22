// app/r/page.tsx
//
// The /r route. The page itself lives in ./receiptPage.tsx, shared with /w
// (app/w/page.tsx); see the header there for everything /r does.

import type { Metadata } from "next";
import { receiptMetadata, renderReceiptPage, type ReceiptSearchParams } from "./receiptPage";

type Props = { searchParams: Promise<ReceiptSearchParams> };

// Every render depends on a query param + a live upstream fetch — never
// prerender or cache this route.
export const dynamic = "force-dynamic";

export async function generateMetadata(props: Props): Promise<Metadata> {
  return receiptMetadata(props);
}

export default async function ReceiptPage(props: Props) {
  return renderReceiptPage(props);
}
