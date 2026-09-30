// app/about/team.ts
//
// The About us team roster (Web 2.1, S2; names/roles/groups per spec
// 2026-09-24 §6a Q14, round 2). One typed array so photos, links and bios
// can change without touching the page.
//
// Photos: every member has a real headshot in `public/profiles/` (the last
// nine added 2026-09-29 from Nico, 400×400 JPEG); a member without one would
// render an initials bubble in the brand palette.
//
// Emails: work addresses for the three co-founders ONLY (Nico, 2026-09-29;
// company rule = first name @papex.app). Nobody else gets an email chip, and
// never a personal address.
//
// LinkedIn: filled only where a public source clearly ties the profile to the
// person (PapeX in the profile, the team's own earlier roster, or a
// corroborated role). An empty field renders no chip — leave it empty rather
// than guess a slug.
//
// Bios: professional facts from public sources only (role, prior roles,
// education) — nothing personal, nothing invented. ≤ ~220 chars so the back
// of the card fits. Where nothing reliable was found, the line is built from
// the member's PapeX role.

export type TeamMember = {
  name: string
  role: string
  /** Path under /public. Omit to fall back to an initials bubble. */
  photo?: string
  /** Full LinkedIn profile URL. Empty/omitted renders no chip. */
  linkedin?: string
  /** Work email — co-founders only (see header). Omitted renders no chip. */
  email?: string
  /** Short professional bio shown on the back of the card. */
  bio?: string
}

export type TeamGroup = {
  title: string
  members: TeamMember[]
}

export const teamGroups: TeamGroup[] = [
  {
    title: 'Team',
    members: [
      {
        name: 'Nicolas Courbage',
        role: 'CEO & Founder',
        photo: '/profiles/nico_courbage.jpeg',
        email: 'nico@papex.app',
        linkedin: 'https://www.linkedin.com/in/nicolas-courbage-051912123/',
        bio: 'Founder and CEO of PapeX, which he started as a finance and entrepreneurship student at Syracuse University’s Whitman School of Management.',
      },
      {
        name: 'Noah Thompson',
        role: 'CTO & Co-founder',
        photo: '/profiles/noah_thompson.jpeg',
        email: 'noah@papex.app',
        linkedin: 'https://www.linkedin.com/in/nthomp08/',
        bio: 'Co-founder and CTO. Builds PapeX’s core product, backend systems and mobile app. Syracuse University iSchool and Whitman School of Management.',
      },
      {
        name: 'Conor McKenna',
        role: 'CMO & Co-founder',
        photo: '/profiles/connor_mckenna.jpeg',
        email: 'conor@papex.app',
        linkedin: 'https://www.linkedin.com/in/conor-l-mckenna/',
        bio: 'Co-founder and CMO. Leads PapeX’s marketing, brand strategy and go-to-market across channels.',
      },
      {
        name: 'Will Alcorn',
        role: 'UI/UX & Data Engineer',
        photo: '/profiles/will_alcorn.jpeg',
        bio: 'UI/UX and data engineer at PapeX. Studies applied data analytics and international relations at Syracuse University.',
      },
      {
        name: 'Ali Thompson',
        role: 'Marketing Lead',
        photo: '/profiles/ali_thompson.jpeg',
        bio: 'Marketing Lead at PapeX.',
      },
      {
        name: 'Yash Shah',
        role: 'Full-Time Developer',
        photo: '/profiles/yash_shah.jpeg',
        linkedin: 'https://www.linkedin.com/in/yash-kamlesh-shah/',
        bio: 'Full-time developer at PapeX, working across data science and AI engineering.',
      },
    ],
  },
  {
    title: 'Advisors & Board',
    members: [
      {
        name: 'Bruno Courbage',
        role: 'Advisor & Board Member',
        photo: '/profiles/bruno_courbage.jpeg',
        linkedin: 'https://www.linkedin.com/in/brunocourbage/',
        bio: 'Product executive: SVP of Product Management at BriteCore, previously VP of Product Management at FICO, with earlier roles at Experian.',
      },
      {
        name: 'Magali Courbage',
        role: 'Advisor & Board Member',
        photo: '/profiles/magali_courbage.jpeg',
        linkedin: 'https://www.linkedin.com/in/magali-courbage-03b8968/',
        bio: 'More than 20 years in product management and business operations in the credit and data analytics industries; currently at FICO.',
      },
      {
        name: 'Michael Khoury',
        role: 'Advisor & Board Member',
        photo: '/profiles/michael_khoury.jpeg',
        linkedin: 'https://www.linkedin.com/in/michael-khoury-194b82240/',
        bio: 'An early PapeX co-founder, now an advisor and board member. Studied law at The University of Texas School of Law.',
      },
      {
        name: 'Matt Baker',
        role: 'Advisor',
        photo: '/profiles/matt_baker.jpeg',
        linkedin: 'https://www.linkedin.com/in/matt-baker-1325914/',
        bio: 'Founder of Baker and Baker Consulting and former Head of Small Business for North America at Visa, with 20+ years in banking and payments.',
      },
      {
        name: 'Bert Friedman',
        role: 'Advisor',
        photo: '/profiles/bert_friedman.jpeg',
        linkedin: 'https://www.linkedin.com/in/bert-friedman-cams-crcm-a5251962/',
        bio: 'Fintech compliance leader. Has headed compliance at Payitoff and Nearside and was Chief Compliance Officer at Deserve; earlier, a CFPB field examiner.',
      },
      {
        name: 'Jonathan Wess',
        role: 'Advisor',
        photo: '/profiles/jonathan_wess.jpeg',
        bio: 'Program Manager of Syracuse University’s Blackstone LaunchPad and founder of TimeCapsule Family Connections; advises PapeX on fundraising and its story.',
      },
    ],
  },
  {
    title: 'Interns',
    members: [
      {
        name: 'Marvik Patel',
        role: 'Dev Intern',
        photo: '/profiles/marvik_patel.jpeg',
        bio: 'Software engineering intern at PapeX; computer science student at The University of Texas at Austin.',
      },
      {
        name: 'Aditya Jha',
        role: 'Dev Intern',
        photo: '/profiles/aditya_jha.jpeg',
        bio: 'Dev intern at PapeX.',
      },
      {
        name: 'Priyansh Dhanuka',
        role: 'Dev Intern',
        photo: '/profiles/priyansh_dhanuka.jpeg',
        bio: 'Dev intern at PapeX.',
      },
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
