"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { AppKitRoot, CouponDetail } from "@/components/app-kit"
import { pt } from "@/components/app-kit/rnStyle"
import type { ReceiptSummary } from "@/lib/receiptSummary"
import { useActiveCafeCoupons } from "./cafeCouponStore"
import { usePapexCafeLogoUri } from "./phone/cafeLogo"
import { monthSummary, phoneReceipts, phoneStores, walletCoupons } from "./phone/data"
import { HomeTab, type HomeKind } from "./phone/HomeTab"
import { CouponsTab, ReceiptsTab, StoresTab } from "./phone/ListTabs"
import { Back, PT, type TabName } from "./phone/parts"
import { ReceiptScreen } from "./phone/ReceiptScreen"
import { SettingsTab } from "./phone/SettingsTab"
import { StoreProfileScreen, type StoreTab } from "./phone/StoreProfileScreen"
import s from "../story.module.css"

/**
 * The customer's phone once the §03 story has settled (P3-B5, Nico: "I want
 * to be able to interact with the phone as well"; P4, "make the other buttons
 * work; it gives the user much more to play around with"). A small, real-
 * looking PapeX app on top of the App Clip receipt:
 *
 *   App Clip receipt --"Save to PapeX"--> Receipts tab
 *   tab bar          all five tabs: Home · Receipts · Coupons · Stores · Settings
 *   Home             receipt / coupon / store rows open; Receipts | Coupons |
 *                    Stores bar switches the list; "See All" opens the tab
 *   Receipts         rows open the receipt detail
 *   Coupons          rows open the coupon detail
 *   Stores           tiles open the store profile (Coupons | Receipts)
 *   Settings         a real-looking list, nothing opens
 *
 * Pushed screens stack (a receipt opened from a store profile goes back to
 * that profile); a tab tap clears the stack. Every screen is built from the
 * code-sourced app kit (components/app-kit) in phone/*; layout per
 * docs/design/app-reference.md (tab bar only on tab roots, FAB on Home and
 * Receipts only, pushed screens cover both).
 *
 * PapeX Cafe's coupons FOLLOW THE DASHBOARD: they are read from the shared
 * cafeCouponStore (the dashboard's On/Off toggles write it), so the Coupons
 * tab, Home's Coupons list, the store tile and the store profile show exactly
 * the coupons switched on — an open coupon that gets switched off closes.
 *
 * All units are app points: `--pt` = the phone screen's width / 393.
 */

type Push =
  | { kind: "receipt"; id: string }
  | { kind: "coupon"; id: string }
  | { kind: "store"; id: string; tab: StoreTab }

/**
 * The tap-through, layered over the clip receipt. Nothing is rendered or
 * focusable until `live` (the story has settled) except what the visitor
 * already opened; `reset` changing sends it back to the clip receipt.
 */
export function PhoneApp({ summary, live, reset }: { summary: ReceiptSummary; live: boolean; reset: number }) {
  const [saved, setSaved] = useState(false)
  const [tab, setTab] = useState<TabName>("receipts")
  const [stack, setStack] = useState<Push[]>([])
  const [homeKind, setHomeKind] = useState<HomeKind>("Receipts")
  // bumped on every screen change, so each new screen mounts fresh (lists at
  // their top); `motion` says how it arrives: a push slides, a tab is instant
  const [view, setView] = useState(0)
  const [motion, setMotion] = useState<"push" | "swap" | "none">("swap")
  useEffect(() => {
    setSaved(false)
    setTab("receipts")
    setStack([])
    setHomeKind("Receipts")
  }, [reset])

  const active = useActiveCafeCoupons()
  const logo = usePapexCafeLogoUri()
  const receipts = useMemo(() => phoneReceipts(summary, logo), [summary, logo])
  const stores = useMemo(() => phoneStores(logo), [logo])
  const phoneStore = (id: string) => stores.find((st) => st.id === id) ?? stores[0]
  const coupons = useMemo(() => walletCoupons(active), [active])
  const couponsFor = (storeId: string) => coupons.filter((c) => c.storeId === storeId)
  const receiptsFor = (store: { name: string }) => receipts.filter((r) => r.merchantName === store.name)

  const go = (how: "push" | "swap" | "none", next: () => void) => {
    next()
    setMotion(how)
    setView((n) => n + 1)
  }
  const push = (p: Push) => go("push", () => setStack((st) => [...st, p]))
  const onTab = (t: TabName) => go("none", () => {
    setTab(t)
    setStack([])
  })

  // the top of the stack that still exists (a coupon switched off in the
  // dashboard while open is simply gone: its screen closes)
  const valid = (p: Push) =>
    p.kind === "receipt" ? receipts.some((r) => r.id === p.id) : p.kind === "coupon" ? coupons.some((c) => c.id === p.id) : true
  const top = [...stack].reverse().find(valid)
  // back pops the screen on show and anything above it that no longer exists
  const back = () => go("swap", () => setStack((st) => (top ? st.slice(0, st.indexOf(top)) : st.slice(0, -1))))
  const backLabel = (() => {
    const below = stack.slice(0, stack.indexOf(top as Push)).filter(valid).pop()
    if (below?.kind === "store") return `Back to ${phoneStore(below.id).name}`
    return `Back to ${tab}`
  })()

  let screen: ReactNode = null
  if (saved) {
    if (top?.kind === "receipt") {
      const r = receipts.find((x) => x.id === top.id)!
      screen = <ReceiptScreen receipt={r} onBack={back} backLabel={backLabel} live={live} />
    } else if (top?.kind === "coupon") {
      const c = coupons.find((x) => x.id === top.id)!
      const store = phoneStore(c.storeId)
      screen = (
        <>
          <CouponDetail coupon={c} store={store} mode="dark" showRemove={false} />
          {live ? <Back label={backLabel} onBack={back} /> : null}
        </>
      )
    } else if (top?.kind === "store") {
      const store = phoneStore(top.id)
      screen = (
        <StoreProfileScreen
          store={store}
          coupons={couponsFor(store.id)}
          receipts={receiptsFor(store)}
          tab={top.tab}
          onTab={(t) => setStack((st) => st.map((p) => (p === top ? { ...top, tab: t } : p)))}
          onOpenCoupon={(id) => push({ kind: "coupon", id })}
          onOpenReceipt={(id) => push({ kind: "receipt", id })}
          onBack={back}
          live={live}
        />
      )
    } else {
      const openReceipt = (id: string) => push({ kind: "receipt", id })
      const openCoupon = (id: string) => push({ kind: "coupon", id })
      const openStore = (id: string) => push({ kind: "store", id, tab: "Coupons" })
      if (tab === "home")
        screen = (
          <HomeTab
            receipts={receipts}
            coupons={coupons}
            stores={stores}
            couponsFor={couponsFor}
            storeFor={phoneStore}
            month={monthSummary(receipts)}
            kind={homeKind}
            onKind={setHomeKind}
            onOpenReceipt={openReceipt}
            onOpenCoupon={openCoupon}
            onOpenStore={openStore}
            onTab={onTab}
            live={live}
          />
        )
      else if (tab === "receipts") screen = <ReceiptsTab receipts={receipts} onOpen={openReceipt} onTab={onTab} live={live} />
      else if (tab === "coupons") screen = <CouponsTab coupons={coupons} storeFor={phoneStore} onOpen={openCoupon} onTab={onTab} live={live} />
      else if (tab === "stores") screen = <StoresTab stores={stores} couponsFor={couponsFor} onOpen={openStore} onTab={onTab} live={live} />
      else screen = <SettingsTab onTab={onTab} live={live} />
    }
  }

  return (
    <>
      {screen ? (
        <AppKitRoot
          key={view}
          style={PT}
          className={cn(s.layer, s.layerOn, s.kitFill, s.appScreen, motion === "push" ? s.appPush : motion === "swap" ? s.appSwap : undefined)}
        >
          {/* not interactive until the story rests: no focus, no clicks */}
          <div className={s.kitFill} inert={!live}>
            {screen}
          </div>
        </AppKitRoot>
      ) : null}
      {live && !saved ? (
        <div className={s.hotspots} style={PT}>
          <button
            type="button"
            className={s.hot}
            style={{ left: pt(12), right: pt(12), bottom: pt(40), height: pt(112) }}
            onClick={() => go("swap", () => setSaved(true))}
          >
            <span className="sr-only">Save to PapeX</span>
          </button>
        </div>
      ) : null}
    </>
  )
}
