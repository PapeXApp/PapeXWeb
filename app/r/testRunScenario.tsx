// app/r/testRunScenario.tsx
//
// TEST-ONLY. Renders one app/r/testParityScenarios.ts scenario through the
// real page component. Kept apart from the harness so the harness's stubs are
// fully installed (its module body has run) before any page module loads.

import { ANDROID_UA, IPHONE_UA, calls, redirectTarget, renderHtml, setUpstreams, testRequest } from "./testPageHarness";
import ReceiptPage, { generateMetadata } from "./page";
import DemoReceiptPage from "./demo/page";
import DemoFallbackPage from "@/app/demo/r/page";
import type { Scenario } from "./testParityScenarios";
import type { Upstream } from "./testPageHarness";
import type { ReactNode } from "react";

export interface ScenarioResult {
  html: string;
  redirect: string | null;
  /** Every upstream URL the page fetched, in call order. */
  urls: string[];
}

const PAGES = { "/r": ReceiptPage, "/r/demo": DemoReceiptPage, "/demo/r": DemoFallbackPage } as const;

/** Render `s`, optionally with extra/overriding upstream answers (e.g. for `/cards`). */
export async function runScenario(s: Scenario, extra: Record<string, Upstream> = {}): Promise<ScenarioResult> {
  testRequest.userAgent = s.ua === "android" ? ANDROID_UA : IPHONE_UA;
  setUpstreams({ ...s.upstreams, ...extra });
  const Page = PAGES[s.route] as (props: { searchParams: Promise<Record<string, string>> }) => Promise<ReactNode>;
  try {
    const el = await Page({ searchParams: Promise.resolve({ ...s.params }) });
    const html = await renderHtml(el);
    return { html, redirect: null, urls: calls.map((c) => c.url) };
  } catch (err) {
    const target = redirectTarget(err);
    if (target == null) throw err;
    return { html: "", redirect: target, urls: calls.map((c) => c.url) };
  }
}

export async function runMetadata(params: Record<string, string>, ridBannerEnv?: "1"): Promise<unknown> {
  const before = process.env.RID_APP_CLIP_BANNER;
  if (ridBannerEnv) process.env.RID_APP_CLIP_BANNER = ridBannerEnv;
  else delete process.env.RID_APP_CLIP_BANNER;
  try {
    return await generateMetadata({ searchParams: Promise.resolve({ ...params }) });
  } finally {
    if (before === undefined) delete process.env.RID_APP_CLIP_BANNER;
    else process.env.RID_APP_CLIP_BANNER = before;
  }
}
