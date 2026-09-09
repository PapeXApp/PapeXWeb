"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Send, Loader2, Mail, User, Briefcase, UserRound, MessageSquare } from "lucide-react"
// Firebase imports
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"

export default function WaitlistFormEnhanced() {
  const [formState, setFormState] = useState({
    fullName: "",
    email: "",
    company: "",
    role: "",
    message: "",
  })

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    })
  }

  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName)
  }

  const handleBlur = () => {
    setFocusedField(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Add data to Firestore
      const docRef = await addDoc(collection(db, "waitlist"), {
        fullName: formState.fullName,
        email: formState.email,
        company: formState.company,
        role: formState.role,
        message: formState.message,
        createdAt: serverTimestamp(),
      })
      
      console.log("Document written with ID: ", docRef.id)
      setIsLoading(false)
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error adding document: ", error)
      setError("Failed to submit. Please try again later.")
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="backdrop-blur-sm p-10 rounded-xl text-center border border-[#00121D]/10 bg-gradient-to-b from-white/80 to-[#F5F5F5]/80 shadow-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#00121D]/10 to-[#EB7100]/10 flex items-center justify-center shadow-inner">
            <CheckCircle className="h-10 w-10 text-[#EB7100]" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[#00121D] via-[#0c2937] to-[#EB7100] bg-clip-text text-transparent">Thank You for Joining!</h3>
        <p className="text-lg text-[#00121D] mb-6 max-w-md mx-auto">
          You've been added to our waitlist. We'll keep you updated on our progress and let you know when PapeX launches!
        </p>
        <div className="flex justify-center items-center space-x-2 text-[#00121D]/70">
          <span className="text-sm">Confirmation sent to:</span>
          <span className="font-medium">{formState.email}</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 p-5 rounded-xl border border-red-100 text-red-800 text-sm shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="min-w-4 h-4 rounded-full bg-red-400"></div>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'fullName' ? 'scale-[1.02]' : ''}`}>
          <Label htmlFor="fullName" className="text-[#00121D] font-medium flex items-center">
            Full Name <span className="text-[#EB7100] ml-1">*</span>
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00121D]/40">
              <User className="h-5 w-5" />
            </div>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Enter your full name"
              required
              value={formState.fullName}
              onChange={handleChange}
              onFocus={() => handleFocus('fullName')}
              onBlur={handleBlur}
              className="border-[#00121D]/10 focus:border-[#EB7100] focus:ring-[#EB7100]/20 bg-white/90 text-[#00121D] rounded-lg h-12 shadow-sm pl-10 transition-all"
            />
          </div>
        </div>

        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
          <Label htmlFor="email" className="text-[#00121D] font-medium flex items-center">
            Email Address <span className="text-[#EB7100] ml-1">*</span>
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00121D]/40">
              <Mail className="h-5 w-5" />
            </div>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              required
              value={formState.email}
              onChange={handleChange}
              onFocus={() => handleFocus('email')}
              onBlur={handleBlur}
              className="border-[#00121D]/10 focus:border-[#EB7100] focus:ring-[#EB7100]/20 bg-white/90 text-[#00121D] rounded-lg h-12 shadow-sm pl-10 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#00121D]/10"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white/90 px-4 text-sm text-[#00121D]/60">Optional Information</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'company' ? 'scale-[1.02]' : ''}`}>
          <Label htmlFor="company" className="text-[#00121D] font-medium flex items-center">
            Company <span className="text-[#00121D]/50 text-sm ml-1">(Optional)</span>
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00121D]/40">
              <Briefcase className="h-5 w-5" />
            </div>
            <Input
              id="company"
              name="company"
              placeholder="Your company name"
              value={formState.company}
              onChange={handleChange}
              onFocus={() => handleFocus('company')}
              onBlur={handleBlur}
              className="border-[#00121D]/10 focus:border-[#EB7100] focus:ring-[#EB7100]/20 bg-white/90 text-[#00121D] rounded-lg h-12 shadow-sm pl-10 transition-all"
            />
          </div>
        </div>

        <div className={`space-y-2 transition-all duration-300 ${focusedField === 'role' ? 'scale-[1.02]' : ''}`}>
          <Label htmlFor="role" className="text-[#00121D] font-medium flex items-center">
            Role <span className="text-[#00121D]/50 text-sm ml-1">(Optional)</span>
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#00121D]/40">
              <UserRound className="h-5 w-5" />
            </div>
            <Input
              id="role"
              name="role"
              placeholder="Your job title or role"
              value={formState.role}
              onChange={handleChange}
              onFocus={() => handleFocus('role')}
              onBlur={handleBlur}
              className="border-[#00121D]/10 focus:border-[#EB7100] focus:ring-[#EB7100]/20 bg-white/90 text-[#00121D] rounded-lg h-12 shadow-sm pl-10 transition-all"
            />
          </div>
        </div>
      </div>

      <div className={`space-y-2 transition-all duration-300 ${focusedField === 'message' ? 'scale-[1.02]' : ''}`}>
        <Label htmlFor="message" className="text-[#00121D] font-medium flex items-center">
          Message <span className="text-[#00121D]/50 text-sm ml-1">(Optional)</span>
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-4 text-[#00121D]/40">
            <MessageSquare className="h-5 w-5" />
          </div>
          <Textarea
            id="message"
            name="message"
            placeholder="Tell us how you heard about PapeX or any questions you might have"
            value={formState.message}
            onChange={handleChange}
            onFocus={() => handleFocus('message')}
            onBlur={handleBlur}
            className="border-[#00121D]/10 focus:border-[#EB7100] focus:ring-[#EB7100]/20 bg-white/90 text-[#00121D] rounded-lg min-h-[120px] shadow-sm resize-none pl-10 transition-all pt-3"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full mt-4 bg-gradient-to-r from-[#EB7100] to-[#cc6300] hover:opacity-90 text-white font-medium shadow-lg border-none rounded-full py-6 h-auto transition-all hover:scale-[1.02] hover:shadow-xl"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </span>
        ) : (
          <span className="flex items-center gap-2 justify-center">
            <Send className="h-5 w-5" />
            Join the Waitlist
          </span>
        )}
      </Button>

      <div className="p-4 rounded-xl bg-gradient-to-r from-[#00121D]/5 to-[#EB7100]/5 text-center">
        <p className="text-xs text-[#00121D]/70">
          By joining our waitlist, you agree to receive updates about PapeX. We respect your privacy and will never share
          your information with third parties.
        </p>
      </div>
    </form>
  )
}