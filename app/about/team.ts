// app/about/team.ts
//
// The About us team roster (Web 2.1, S2; names/roles/groups per spec
// 2026-09-24 §6a Q14, round 2). One typed array so photos and LinkedIn URLs
// can be dropped in later without touching the page.
//
// Photos: only the seven people we have a real headshot for get one
// (`public/profiles/`, verified to exist 2026-09-24); everyone else renders
// an initials bubble in the brand palette. No personal emails on cards —
// LinkedIn only, and a chip renders only once `linkedin` is filled in.

export type TeamMember = {
  name: string
  role: string
  /** Path under /public. Omit to fall back to an initials bubble. */
  photo?: string
  /** Full LinkedIn profile URL. Empty/omitted renders no chip. */
  linkedin?: string
}

export type TeamGroup = {
  title: string
  members: TeamMember[]
}

export const teamGroups: TeamGroup[] = [
  {
    title: 'Team',
    members: [
      { name: 'Nicolas Courbage', role: 'CEO & Founder', photo: '/profiles/nico_courbage.jpeg' },
      { name: 'Noah Thompson', role: 'CTO & Co-founder', photo: '/profiles/noah_thompson.jpeg' },
      { name: 'Conor McKenna', role: 'CMO & Co-founder', photo: '/profiles/connor_mckenna.jpeg' },
      { name: 'Will Alcorn', role: 'UI/UX & Data Engineer' },
      { name: 'Ali Thompson', role: 'Marketing Lead' },
      { name: 'Yash Shah', role: 'Full-Time Developer' },
    ],
  },
  {
    title: 'Advisors & Board',
    members: [
      {
        name: 'Bruno Courbage',
        role: 'Advisor & Board Member',
        photo: '/profiles/bruno_courbage.jpeg',
      },
      {
        name: 'Magali Courbage',
        role: 'Advisor & Board Member',
        photo: '/profiles/magali_courbage.jpeg',
      },
      {
        name: 'Michael Khoury',
        role: 'Advisor & Board Member',
        photo: '/profiles/michael_khoury.jpeg',
      },
      { name: 'Matt Baker', role: 'Advisor' },
      { name: 'Bert Friedman', role: 'Advisor', photo: '/profiles/bert_720.jpeg' },
      { name: 'Jonathan Wess', role: 'Advisor' },
    ],
  },
  {
    title: 'Interns',
    members: [
      { name: 'Marvik Patel', role: 'Dev Intern' },
      { name: 'Aditya Jha', role: 'Dev Intern' },
      { name: 'Priyansh Dhanuka', role: 'Dev Intern' },
    ],
  },
]

/** "Will Alcorn" -> "WA" for the placeholder bubble. */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return `${first}${last}`.toUpperCase()
}
