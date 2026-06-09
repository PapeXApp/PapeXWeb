'use client'

import Image from "next/image"
import Link from "next/link"
import { Linkedin, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TeamImage } from "@/components/team-image"
import { FramerPageShell } from "@/components/framer/framer-page-shell"

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
    bio: "Leads the development and execution of PapeX, overseeing team management and driving the project from concept to market."
  },
  {
    name: "Michael Khoury",
    role: "Co-founder",
    image: "/profiles/michael_khoury.jpeg",
    fallbackImage: "/profiles/michael.svg",
    linkedin: "https://www.linkedin.com/in/michael-khoury-194b82240/",
    email: "michael_khoury@icloud.com",
    bio: "Operations and legal executive responsible for ensuring smooth functionality of all departments of the company."
  },
  {
    name: "Raasin Rahman",
    role: "Technology",
    image: "/profiles/raasin_rahman.jpeg",
    fallbackImage: "/profiles/raasin.svg",
    linkedin: "https://www.linkedin.com/in/raasin/",
    email: "raasinr@gmail.com",
    bio: "Leading the technical development of the PapeX application "
  },
  {
    name: "Krutartha Nagesh",
    role: "Technology",
    image: "/profiles/Kru.jpeg",
    fallbackImage: "/profiles/placeholder.svg",
    linkedin: "https://www.linkedin.com/in/krutarthanagesh/",
    email: "krutarthanagesh@gmail.com",
    bio: "Leads and oversees the development of PapeX's core technology, focusing on scalable backend systems and a seamless end-user experience."
  },
  {
    name: "Gus Kirkpatrick",
    role: "Marketing",
    image: "/profiles/gus.jpeg",
    fallbackImage: "/profiles/placeholder.svg",
    linkedin: "https://www.linkedin.com/in/gus-kirkpatrick/",
    email: "gus.kirkpatrick@papex.app",
    bio: "Leads the marketing team while playing a key role in investor relations."
  },
  {
    name: "Magali Courbage",
    role: "Advisor / Board Member",
    image: "/profiles/magali_courbage.jpeg",
    fallbackImage: "/profiles/magali.svg",
    linkedin: "https://www.linkedin.com/in/magali-courbage-03b8968/",
    email: "magali.courbage@gmail.com",
    bio: "Seasoned professional with over 20 years of experience in product management and business operations within the credit and data analytics industries."
  },
  {
    name: "Bruno Courbage",
    role: "Advisor / Board Member",
    image: "/profiles/bruno_courbage.jpeg",
    fallbackImage: "/profiles/bruno.svg",
    linkedin: "https://www.linkedin.com/in/brunocourbage/",
    email: "bruno.courbage@gmail.com",
    bio: "Transformational product executive with proven success scaling product lines, driving innovation, and delivering P&L performance in SaaS platforms."
  },
  {
    name: "Dawn Lilington",
    role: "Advisor / Board Member",
    image: "/profiles/Dawn.jpeg",
    fallbackImage: "/profiles/placeholder.svg",
    linkedin: "https://www.linkedin.com/in/dlillington/",
    email: "dawn.lilington@papex.app",
    bio: "Strategic connector and philanthropy engagement lead with over 20 years of experience spanning international government relations, partnership development, and marketing."
  },
  {
    name: "Bert Friedman",
    role: "Advisor / Board Member",
    image: "/profiles/bert_720.jpeg",
    fallbackImage: "/profiles/placeholder.svg",
    email: "bert.friedman@papex.app",
    bio: "Strategic compliance leader with a track record of advising fintechs on regulatory risk, building scalable compliance programs, forging bank partnerships, and aligning operations with evolving state and federal laws."
  },
]

export default function ContactPage() {
  return (
    <FramerPageShell>
      <div className="container mx-auto py-6 px-4 relative overflow-hidden">
        {/* Floating background elements - reduced opacity */}
        <div className="absolute top-20 left-10 w-40 h-40 gradient-accent rounded-full opacity-5 blur-xl animate-float"></div>
        <div className="absolute top-60 right-20 w-32 h-32 gradient-primary rounded-full opacity-5 blur-xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-40 left-1/4 w-36 h-36 gradient-secondary rounded-full opacity-5 blur-xl animate-float" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 gradient-accent rounded-full opacity-5 blur-xl animate-float" style={{animationDelay: '6s'}}></div>

        <div className="text-center mb-12 animate-slide-in-up relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0a3d62] mb-4">
            Meet the PapeX <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Team</span>
          </h1>
          <div className="w-20 h-1 gradient-accent mx-auto mb-4 rounded-full animate-gradient"></div>
          <p className="text-lg text-[#0a3d62] max-w-3xl mx-auto font-medium">
            The passionate individuals behind PapeX working to revolutionize digital receipts
            and transform how businesses and customers manage transactions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 relative z-10">
          {teamMembers.map((member, index) => (
            <div key={index} className={`bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden card-hover border border-white/30 shadow-lg animate-slide-in-up relative group`} style={{animationDelay: `${index * 0.1}s`}}>
              {/* Decorative gradient overlay - reduced opacity */}
              <div className="absolute top-0 right-0 w-16 h-16 gradient-accent rounded-full blur-xl opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
              
              <div className="relative h-48 w-full bg-gradient-to-br from-[#0a3d62]/5 to-[#ff9933]/5 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-white/80 backdrop-blur-sm overflow-hidden ring-2 ring-[#0a3d62]/20 group-hover:ring-[#ff9933]/40 transition-all duration-300 group-hover:scale-105 shadow-md">
                    <TeamImage
                      src={member.image}
                      alt={member.name}
                      fallbackSrc={member.fallbackImage}
                      width={200}
                      height={200}
                      className={`w-full h-full group-hover:scale-110 transition-transform duration-500 ${
                        member.name === "Gus Kirkpatrick" 
                          ? "object-cover object-left-top" 
                          : member.name === "Dawn Lilington"
                          ? "object-cover object-right-top"
                          : "object-cover"
                      }`}
                    />
                  </div>
                </div>
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a3d62]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="p-4 flex flex-col items-center text-center relative z-10">
                <h2 className="text-lg font-bold text-[#0a3d62] mb-2 font-gloock group-hover:text-[#ff9933] transition-colors duration-300">{member.name}</h2>
                <div className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] px-3 py-1 rounded-full mb-3">
                  <p className="text-white font-medium text-sm">{member.role}</p>
                </div>
                {member.bio && <p className="text-[#0a3d62] mb-4 text-xs leading-relaxed font-medium">{member.bio}</p>}
                
                <div className="flex flex-row gap-3 mt-2">
                  <a 
                    href={`mailto:${member.email}`} 
                    className="inline-flex items-center gap-1 bg-[#0a3d62] hover:bg-[#ff9933] px-3 py-2 rounded-full text-white transition-all duration-300 text-xs font-medium hover:scale-105 group/btn shadow-md"
                  >
                    <Mail className="h-3 w-3 group-hover/btn:scale-110 transition-transform duration-300" />
                    Email
                  </a>
                  {member.linkedin && (
                    <Link href={member.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-[#0a3d62] hover:bg-[#ff9933] px-3 py-2 rounded-full text-white transition-all duration-300 text-xs font-medium hover:scale-105 group/btn shadow-md">
                      <Linkedin className="h-3 w-3 group-hover/btn:scale-110 transition-transform duration-300" />
                      LinkedIn
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 animate-slide-in-up relative z-10">
          <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl max-w-2xl mx-auto border border-white/30 shadow-lg relative overflow-hidden">
            {/* Decorative background element - reduced opacity */}
            <div className="absolute top-0 left-0 w-32 h-32 gradient-secondary rounded-full blur-xl opacity-5"></div>
            
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-bold text-[#0a3d62] mb-3 font-gloock">
                Join Our <span className="bg-gradient-to-r from-[#ff9933] to-[#e67e22] bg-clip-text text-transparent">Mission</span>
              </h2>
              <p className="text-base text-[#0a3d62] mb-6 font-medium">
                Want to be part of our journey to transform digital receipts? We're always looking for passionate 
                individuals to join our team.
              </p>
              <Link href="/waitlist">
                <Button className="btn-modern gradient-accent hover:shadow-2xl text-white font-medium border-none rounded-full px-8 py-3 h-auto text-lg transform hover:scale-105 transition-all duration-300">
                  Join Our Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FramerPageShell>
  )
}