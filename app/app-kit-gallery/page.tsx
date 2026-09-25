// DEV-ONLY gallery of the code-sourced app kit (components/app-kit).
// Never ships: 404s whenever NODE_ENV or VERCEL_ENV is 'production', so it only
// renders under `next dev`. ?mode=light shows light mode.

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  AppKitRoot,
  ClipReceipt,
  CouponDetail,
  CouponRow,
  CouponsScreen,
  DEMO_LABEL,
  demoClipReceipt,
  demoCoupons,
  demoReceipts,
  demoStore,
  demoStores,
  GlassCard,
  ReceiptDetail,
  ReceiptRow,
  ReceiptsScreen,
  StoreProfile,
  StoreTile,
  T,
  TabBar,
} from '@/components/app-kit'
import { SOURCE } from '@/lib/app-kit/tokens'

export const metadata: Metadata = { title: 'App kit gallery (dev)', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const PHONE = 300

function Phone({ label, mode, children }: { label: string; mode: 'dark' | 'light'; children: ReactNode }) {
  return (
    <figure style={{ margin: 0 }}>
      <AppKitRoot mode={mode} width={PHONE} style={{ borderRadius: 36, overflow: 'hidden', boxShadow: '0 0 0 6px #1b1f24, 0 20px 50px rgba(0,0,0,.35)' }}>
        {children}
      </AppKitRoot>
      <figcaption style={{ font: '500 13px/1.4 system-ui', color: '#9aa7b2', marginTop: 14 }}>{label}</figcaption>
    </figure>
  )
}

export default async function AppKitGallery({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') notFound()
  const mode = (await searchParams).mode === 'light' ? 'light' : 'dark'
  const nook = demoStore('demo-nook-cafe')
  const copper = demoStore('demo-copperpeg-hardware')
  const moss = demoStore('demo-mossbrook-pharmacy')
  return (
    <main style={{ background: '#0b0f13', minHeight: '100vh', padding: '40px 40px 80px', color: '#dfe6ec' }}>
      <h1 style={{ font: '600 22px system-ui', margin: 0 }}>App kit gallery · {mode}</h1>
      <p style={{ font: '13px/1.5 system-ui', color: '#8a97a3', maxWidth: 760 }}>
        Sourced from PapeXV2@{SOURCE.papexv2.short} ({SOURCE.papexv2.branch}) + Papex_AppClip@{SOURCE.appclip.short} by <code>npm run app:sync</code>. {DEMO_LABEL}. Dev-only
        route. <a href={`?mode=${mode === 'dark' ? 'light' : 'dark'}`} style={{ color: '#EB7100' }}>Switch to {mode === 'dark' ? 'light' : 'dark'}</a>
      </p>

      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 48, marginTop: 32 }}>
        <Phone label="ReceiptsScreen" mode={mode}><ReceiptsScreen mode={mode} receipts={demoReceipts} /></Phone>
        <Phone label="ReceiptDetail" mode={mode}><ReceiptDetail mode={mode} receipt={demoReceipts[1]} /></Phone>
        <Phone label="CouponsScreen" mode={mode}><CouponsScreen mode={mode} coupons={demoCoupons} favorites={['c1']} /></Phone>
        <Phone label="CouponDetail (code)" mode={mode}><CouponDetail mode={mode} coupon={demoCoupons[0]} store={nook} isFavorite /></Phone>
        <Phone label="CouponDetail (barcode)" mode={mode}><CouponDetail mode={mode} coupon={demoCoupons[1]} store={copper} /></Phone>
        <Phone label="StoreProfile · partner" mode={mode}><StoreProfile mode={mode} store={nook} coupons={demoCoupons.filter((c) => c.storeId === nook.id)} /></Phone>
        <Phone label="StoreProfile · basic (brand colours)" mode={mode}><StoreProfile mode={mode} store={copper} coupons={[]} /></Phone>
        <Phone label="StoreProfile · basic (PapeX banner)" mode={mode}><StoreProfile mode={mode} store={moss} coupons={[]} /></Phone>
        <Phone label="ClipReceipt (App Clip)" mode="dark"><ClipReceipt data={demoClipReceipt} /></Phone>
      </section>

      <h2 style={{ font: '600 16px system-ui', marginTop: 56 }}>Parts</h2>
      <AppKitRoot mode={mode} width={393} style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start', background: mode === 'dark' ? '#00121D' : '#fff', padding: 24, borderRadius: 16 }}>
        <div style={{ width: 'calc(393 * var(--pt))' }}>
          {demoReceipts.slice(0, 3).map((r) => <ReceiptRow key={r.id} receipt={r} mode={mode} />)}
          <ReceiptRow receipt={demoReceipts[3]} mode={mode} selectMode selected />
        </div>
        <div style={{ width: 'calc(361 * var(--pt))', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {demoCoupons.map((c) => <CouponRow key={c.id} coupon={c} store={demoStore(c.storeId)} mode={mode} />)}
          <GlassCard mode={mode} emphasis="standard"><T>GlassCard · standard</T></GlassCard>
          <GlassCard mode={mode} emphasis="important"><T>GlassCard · important</T></GlassCard>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', width: 'calc(393 * var(--pt))' }}>
          {demoStores.map((s, i) => <StoreTile key={s.id} store={s} mode={mode} couponCount={demoCoupons.filter((c) => c.storeId === s.id).length} isFavorite={i === 0} />)}
        </div>
        <div style={{ position: 'relative', width: 'calc(393 * var(--pt))', height: 'calc(110 * var(--pt))' }}>
          <TabBar active="coupons" mode={mode} />
        </div>
      </AppKitRoot>
    </main>
  )
}
