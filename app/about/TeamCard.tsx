'use client'

// app/about/TeamCard.tsx
//
// One /about team card: photo side ⇄ short bio. The page stays a Server
// Component (it owns `metadata`); only this card is client-side.
//
// A real full-bleed <button aria-expanded aria-controls> sits UNDER the card
// content (content is pointer-events: none in about.module.css), so a tap
// anywhere toggles it and Enter/Space work natively. The email/LinkedIn chips
// sit above the button and outside it, so they never toggle the card. The CSS
// swaps the faces off the button's aria-expanded; both faces share one grid
// cell, so the card is always sized to the taller face and nothing moves when
// it turns. Reduced motion = instant swap (CSS).

import { useState } from 'react'
import Image from 'next/image'
import { initialsFor, type TeamMember } from './team'
import styles from './about.module.css'

/** "Nicolas Courbage" -> "bio-nicolas-courbage" (unique: names are unique). */
function bioId(name: string): string {
  return `bio-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export function TeamCard({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false)
  const id = bioId(member.name)

  return (
    <li className={styles.card}>
      {member.bio ? (
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={id}
          data-bio-toggle=""
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.srOnly}>About {member.name}</span>
        </button>
      ) : null}
      <div className={styles.stack}>
        <div className={styles.front}>
          {member.photo ? (
            <div className={styles.avatarPhoto}>
              <Image src={member.photo} alt={member.name} fill sizes="92px" />
            </div>
          ) : (
            <div className={styles.avatarInitials} aria-hidden="true">
              {initialsFor(member.name)}
            </div>
          )}
          <span className={styles.name}>{member.name}</span>
          <span className={styles.role}>{member.role}</span>
        </div>
        {member.bio ? (
          <p id={id} className={styles.back}>
            {member.bio}
          </p>
        ) : null}
      </div>
      {member.bio ? <span className={styles.hint} aria-hidden="true" /> : null}
      {member.email || member.linkedin ? (
        <div className={styles.links}>
          {member.email ? (
            <a
              href={`mailto:${member.email}`}
              className={styles.chip}
              aria-label={`Email ${member.name} at ${member.email}`}
              title={member.email}
            >
              Email
            </a>
          ) : null}
          {member.linkedin ? (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.chip}
              aria-label={`LinkedIn profile of ${member.name} (opens in a new tab)`}
            >
              LinkedIn
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
