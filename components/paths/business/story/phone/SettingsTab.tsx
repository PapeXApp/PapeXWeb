"use client"

import { Fragment } from "react"
import { GlassCard, Glyph, Screen, StatusBar, T, TabBar, TitleBubble, V, headerTop } from "@/components/app-kit"
import { pt, rn } from "@/components/app-kit/rnStyle"
import { SHOPPER } from "./data"
import { DragList, GB, ListFade, THEME, TabHotspots, type TabName } from "./parts"

/**
 * Settings (app/(tabs)/settings.tsx, app-reference §5 Settings): the centred
 * "Settings" bubble with no side controls, the profile card, then the grouped
 * cards (components/ui/ListItem rows, no icons) and Sign Out on its own. Rows
 * are drawings: nothing here opens. No FAB, no Select.
 */

const { colors, typography, spacing } = THEME

type Item = { title: string; subtitle?: string; destructive?: boolean }
const GROUPS: { label: string; items: Item[] }[] = [
  { label: "Account", items: [{ title: "Payment Methods" }, { title: "Account Stats" }, { title: "Shared Groups" }] },
  {
    label: "App Management",
    items: [
      { title: "Categories" },
      { title: "Deleted Receipts", subtitle: "Receipts deleted in the last 30 days" },
      { title: "Hidden Items", subtitle: "Receipts, coupons and stores you've hidden" },
    ],
  },
  { label: "More", items: [{ title: "Advanced Settings", subtitle: "App info, updates, experimental features" }] },
  { label: "Support", items: [{ title: "Submit Feedback", subtitle: "Questions, bugs, suggestions" }] },
]

/** components/ui/ListItem.tsx with showIcon={false}: title, optional subtitle, chevron. */
function ListItem({ title, subtitle, destructive }: Item) {
  return (
    <V style={{ minHeight: pt(56), paddingTop: pt(14), paddingBottom: pt(14), paddingLeft: pt(16), paddingRight: pt(16), flexDirection: "row", alignItems: "center" }}>
      <V style={{ flex: "1 1 0%", justifyContent: "center", minWidth: 0 }}>
        <T lines={1} style={rn(typography.body, { fontFamily: "Barlow-Medium", fontSize: 15, color: destructive ? colors.destructiveText : colors.text })}>
          {title}
        </T>
        {subtitle ? (
          <T lines={1} style={rn(typography.caption, { marginTop: 2, fontSize: 13, color: colors.textMuted })}>
            {subtitle}
          </T>
        ) : null}
      </V>
      <Glyph name="chevron-forward" size={18} color={colors.textMuted} />
    </V>
  )
}

const sectionLabel = rn({ fontFamily: "Barlow-Medium", fontSize: 13, letterSpacing: 1, textTransform: "uppercase", marginTop: 24, marginBottom: 8, color: colors.textMuted })

export function SettingsTab({ onTab, live }: { onTab: (t: TabName) => void; live: boolean }) {
  const top = headerTop() + GB.HEADER_BUBBLE_HEIGHT + 12
  return (
    <Screen mode="dark">
      <DragList top={top} label="Settings" style={{ paddingLeft: pt(16), paddingRight: pt(16) }}>
        <GlassCard emphasis="neutral" padding="lg">
          <V style={{ flexDirection: "row", alignItems: "center" }}>
            <V style={{ marginRight: pt(16), width: pt(64), height: pt(64), borderRadius: pt(32), alignItems: "center", justifyContent: "center", backgroundImage: `linear-gradient(180deg, ${colors.brandGradient[0]}, ${colors.brandGradient[1]})` }}>
              <T style={rn({ fontFamily: "Barlow-Medium", fontSize: 24, color: colors.buttonText })}>{SHOPPER.name.charAt(0)}</T>
            </V>
            <V style={{ flex: "1 1 0%", minWidth: 0 }}>
              <T lines={1} style={rn({ fontFamily: "Barlow-Medium", fontSize: 20, color: colors.text })}>
                {SHOPPER.name}
              </T>
              <T lines={1} style={rn({ fontFamily: "Barlow-Regular", fontSize: 14, marginTop: 4, color: colors.textSecondary })}>
                {SHOPPER.email}
              </T>
              <T style={rn({ fontFamily: "Barlow-Medium", fontSize: 14, marginTop: 8, color: colors.accent })}>Edit Profile →</T>
            </V>
          </V>
        </GlassCard>
        {GROUPS.map((g) => (
          <Fragment key={g.label}>
            <T style={sectionLabel}>{g.label}</T>
            <GlassCard emphasis="neutral" padding="xs">
              {g.items.map((it) => (
                <ListItem key={it.title} {...it} />
              ))}
            </GlassCard>
          </Fragment>
        ))}
        <V style={{ marginTop: pt(spacing.lg) }}>
          <GlassCard emphasis="neutral" padding="xs">
            <ListItem title="Sign Out" destructive />
          </GlassCard>
        </V>
      </DragList>
      <ListFade height={top - 6} />
      <V style={{ position: "absolute", left: 0, right: 0, top: pt(headerTop()), alignItems: "center", zIndex: 10 }}>
        <TitleBubble title="Settings" />
      </V>
      <TabBar active="settings" />
      <StatusBar />
      {live ? <TabHotspots active="settings" onTab={onTab} /> : null}
    </Screen>
  )
}
