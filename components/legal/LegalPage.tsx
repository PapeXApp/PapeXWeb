// components/legal/LegalPage.tsx
//
// The shared frame for /privacy and /terms (Web 2.3 phone rework, D1): the
// redesign shell exactly like /support and /about (SiteShell path="page" +
// FlowGround light + in-flow footer). Server Component: nothing here needs the
// client. The legal text itself stays in each page, verbatim.

import type { ReactNode } from 'react'
import { SiteShell } from '@/components/brand/site-shell'
import { SiteFooter } from '@/components/brand/site-footer'
import { FlowGround } from '@/components/paths/shared/FlowGround'
import { FlowSection } from '@/components/paths/shared/FlowSection'
import styles from './legal.module.css'

export function LegalPage({
  title,
  dates,
  children,
}: {
  title: string
  dates: string[]
  children: ReactNode
}) {
  return (
    <SiteShell path="page">
      <FlowGround initial="light" footer={<SiteFooter inFlow />}>
        <FlowSection ground="light" className={styles.top}>
          <div className={styles.wrap}>
            <article>
              <header className={styles.head}>
                <div className={styles.dates}>
                  {dates.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <h1 className={`rd-display ${styles.title}`}>{title}</h1>
              </header>
              <div className={styles.doc}>{children}</div>
            </article>
          </div>
        </FlowSection>
      </FlowGround>
    </SiteShell>
  )
}
