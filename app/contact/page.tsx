'use client'

import Link from "next/link"
import { Linkedin, Mail } from "lucide-react"
import { TeamImage } from "@/components/team-image"
import { FramerPageShell } from "@/components/framer/framer-page-shell"
import { BtnPlane } from "@/components/framer/btn-plane"

interface TeamMember {
  name: string
  role: string
  image: string
  fallbackImage: string
  linkedin?: string
  email: string
  bio?: string
}

const teamMembers: TeamMember[] = [
  {
    name: "Nicolas Courbage",
    role: "Founder",
    image: "/profiles/nico_courbage.jpeg",
    fallbackImage: "/profiles/nicolas.svg",
    linkedin: "https://www.linkedin.com/in/nicolas-courbage-051912123/",
    email: "npcourba@syr.edu",
    bio: "Leads the development and execution of PapeX, overseeing team management and driving the project from concept to market.",
  },
  {
    name: "Noah Raisner Thompson",
    role: "CTO / Co-Founder",
    image: "/profiles/noah_thompson.jpeg",
    fallbackImage: "/profiles/placeholder.svg",
    linkedin: "https://www.linkedin.com/in/nthomp08",
    email: "noah.thompson@papex.app",
    bio: "Builds and maintains PapeX's core product, backend systems, and mobile experience.",
  },
  {
    name: "Connor McKenna",
    role: "CMO / Co-Founder",
    image: "/profiles/connor_mckenna.jpeg",
    fallbackImage: "/profiles/placeholder.svg",
    linkedin: "https://www.linkedin.com/in/conor-l-mckenna/",
    email: "conor@papex.app",
    bio: "Leads PapeX marketing, brand strategy, and go-to-market across channels.",
  },
  {
    name: "Magali Courbage",
    role: "Advisor / Board Member",
    image: "/profiles/magali_courbage.jpeg",
    fallbackImage: "/profiles/magali.svg",
    linkedin: "https://www.linkedin.com/in/magali-courbage-03b8968/",
    email: "magali.courbage@gmail.com",
    bio: "Seasoned professional with over 20 years of experience in product management and business operations within the credit and data analytics industries.",
  },
  {
    name: "Bruno Courbage",
    role: "Advisor / Board Member",
    image: "/profiles/bruno_courbage.jpeg",
    fallbackImage: "/profiles/bruno.svg",
    linkedin: "https://www.linkedin.com/in/brunocourbage/",
    email: "bruno.courbage@gmail.com",
    bio: "Transformational product executive with proven success scaling product lines, driving innovation, and delivering P&L performance in SaaS platforms.",
  },
  {
    name: "Dawn Lilington",
    role: "Advisor / Board Member",
    image: "/profiles/Dawn.jpeg",
    fallbackImage: "/profiles/placeholder.svg",
    linkedin: "https://www.linkedin.com/in/dlillington/",
    email: "dawn.lilington@papex.app",
    bio: "Strategic connector and philanthropy engagement lead with over 20 years of experience spanning international government relations, partnership development, and marketing.",
  },
  {
    name: "Bert Friedman",
    role: "Advisor / Board Member",
    image: "/profiles/bert_720.jpeg",
    fallbackImage: "/profiles/placeholder.svg",
    email: "bert.friedman@papex.app",
    bio: "Strategic compliance leader with a track record of advising fintechs on regulatory risk, building scalable compliance programs, forging bank partnerships, and aligning operations with evolving state and federal laws.",
  },
]

function photoClass(name: string) {
  if (name === "Connor McKenna") return "object-cover team-photo-connor"
  if (name === "Dawn Lilington") return "object-cover object-right-top"
  return "object-cover"
}

export default function ContactPage() {
  return (
    <FramerPageShell>
      <div className="framer-container subpage-inner">
        <header className="subpage-header">
          <p className="section-label">Contact</p>
          <h1 className="section-title">Meet the PapeX team.</h1>
          <p className="section-intro">
            The people building digital receipts that are easier to capture, organize, and share.
          </p>
        </header>

        <div className="team-grid">
          {teamMembers.map((member) => (
            <article key={member.email} className="team-card">
              <div className="team-card-photo">
                <div className="team-card-photo-inner">
                  <TeamImage
                    src={member.image}
                    alt={member.name}
                    fallbackSrc={member.fallbackImage}
                    width={200}
                    height={200}
                    className={`w-full h-full ${photoClass(member.name)}`}
                  />
                </div>
              </div>

              <div className="team-card-body">
                <h2>{member.name}</h2>
                <span className="team-role">{member.role}</span>
                {member.bio ? <p>{member.bio}</p> : null}
                <div className="team-actions">
                  <a href={`mailto:${member.email}`} className="team-action-btn">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </a>
                  {member.linkedin ? (
                    <Link
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="team-action-btn"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="subpage-cta">
          <div className="subpage-cta-card">
            <h2>Join our mission</h2>
            <p>
              Want to help transform how people manage receipts? We&apos;re always looking for passionate people to join
              the team.
            </p>
            <Link href="/waitlist" className="btn-download">
              <BtnPlane />
              Join our waitlist
            </Link>
          </div>
        </div>
      </div>
    </FramerPageShell>
  )
}
