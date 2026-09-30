'use client'

// app/about/TeamCard.tsx
//
// One /about team card that genuinely FLIPS (3D, Y axis): front = photo,
// name, role; back = name + short bio. The page stays a Server Component
// (it owns `metadata`); only this card is client-side.
//
// Layering, bottom to top (see about.module.css):
//   .inner (rotates) with both faces in one grid cell -> the card is always
//     as tall as its taller face, so nothing moves when it turns;
//   a transparent full-bleed <button aria-expanded aria-controls> -> a tap
//     anywhere turns the card, Enter/Space work natively;
//   the Email/LinkedIn icons, OUTSIDE the rotating .inner -> they stay put
//     on both faces and never turn the card.
// No visible toggle glyph (Nico): the whole card is the button; keyboard
// users get the site's orange focus-visible ring.
// The face that is turned away is aria-hidden so a screen reader only reads
// the side on show. Reduced motion = instant swap, no rotation (CSS).

import { useState } from 'react'
import Image from 'next/image'
import { initialsFor, type TeamMember } from './team'
import styles from './about.module.css'

/** "Nicolas Courbage" -> "bio-nicolas-courbage" (unique: names are unique). */
function bioId(name: string): string {
  return `bio-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="m3.8 7 8.2 6 8.2-6" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 10.5V16.5" />
      <path d="M8 7.6v.01" strokeWidth="1.8" />
      <path d="M12 16.5v-6" />
      <path d="M12 13.2c0-1.6 1.1-2.7 2.5-2.7s2.5 1 2.5 2.7v3.3" />
    </svg>
  )
}

export function TeamCard({ member }: { member: TeamMember }) {
  const [open, setOpen] = useState(false)
  const id = bioId(member.name)
  const flips = Boolean(member.bio)

  return (
    <li className={`${styles.card} ${open ? styles.open : ''}`}>
      <div className={styles.inner}>
        <div className={`${styles.face} ${styles.front}`} aria-hidden={open || undefined}>
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
        {flips ? (
          <div
            id={id}
            className={`${styles.face} ${styles.back}`}
            aria-hidden={!open || undefined}
          >
            <span className={styles.backName}>{member.name}</span>
            <p className={styles.bioText}>{member.bio}</p>
          </div>
        ) : null}
      </div>
      {flips ? (
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
      {member.email || member.linkedin ? (
        <div className={styles.links}>
          {member.email ? (
            <a
              href={`mailto:${member.email}`}
              className={styles.iconLink}
              aria-label={`Email ${member.name} at ${member.email}`}
              title={member.email}
            >
              <MailIcon />
            </a>
          ) : null}
          {member.linkedin ? (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.iconLink}
              aria-label={`LinkedIn profile of ${member.name} (opens in a new tab)`}
              title="LinkedIn"
            >
              <LinkedInIcon />
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}
