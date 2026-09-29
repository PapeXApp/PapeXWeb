"use client"

import { rn as R } from "@/lib/app-kit/rnStyles"
import { DEMO_NOW, StoreTile, V, type KitCoupon, type KitStore } from "@/components/app-kit"
import { describeCouponExpiry } from "@/components/app-kit/couponLogic"
import { pt } from "@/components/app-kit/rnStyle"
import { Row } from "./parts"

const ST = R.storeTile.consts

/**
 * The 2-column store tile grid (HomeBrowsePanel's Stores kind, used by both
 * Home's Stores segment and the Stores tab): the kit's StoreTile, each a real
 * button that opens the store's profile. A tile's coupon line and count are
 * the shopper's own coupons from that store — for PapeX Cafe, what the
 * dashboard has switched on.
 */
export function StoreGrid({ stores, couponsFor, onOpen, padded = true }: { stores: KitStore[]; couponsFor: (storeId: string) => KitCoupon[]; onOpen: (id: string) => void; /** false: the host already pads the screen's 16pt (Home). */ padded?: boolean }) {
  // two tiles across the screen's content width (StoreTile's default width)
  const width = (393 - ST.STORE_TILE_EDGE_INSET * 2 - ST.STORE_TILE_GAP) / 2
  const inset = padded ? ST.STORE_TILE_EDGE_INSET : 0
  return (
    <V style={{ flexDirection: "row", flexWrap: "wrap", columnGap: pt(ST.STORE_TILE_GAP), rowGap: pt(ST.STORE_TILE_GAP), paddingLeft: pt(inset), paddingRight: pt(inset) }}>
      {stores.map((store) => {
        const coupons = couponsFor(store.id)
        const lead = coupons[0]
        return (
          <Row key={store.id} label={`Open ${store.name}'s profile`} onOpen={() => onOpen(store.id)} style={{ width: pt(width) }}>
            <StoreTile
              store={store}
              width={width}
              couponCount={coupons.length}
              lead={lead ? { title: lead.title, expiry: describeCouponExpiry(lead.expiresAt, DEMO_NOW)?.text } : undefined}
            />
          </Row>
        )
      })}
    </V>
  )
}
