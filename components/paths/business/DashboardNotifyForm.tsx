"use client"

import { useId, useState, type FormEvent } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"
import { Ripple } from "@/components/motion"
import { dashboard } from "./content"

type Status = "idle" | "submitting" | "success" | "error"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function DashboardNotifyForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const statusId = useId()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!EMAIL_RE.test(email.trim())) {
      setStatus("error")
      setError("Enter a valid work email.")
      return
    }

    setStatus("submitting")
    setError(null)

    try {
      await addDoc(collection(db, "waitlist"), {
        email: email.trim(),
        type: "business-dashboard-notify",
        createdAt: serverTimestamp(),
      })
      setStatus("success")
    } catch (err) {
      console.error("Error adding dashboard notify signup: ", err)
      setStatus("error")
      setError("Couldn't send that — please try again.")
    }
  }

  if (status === "success") {
    return (
      <p
        role="status"
        className="mx-auto mt-9 max-w-[440px] text-[15px]"
        style={{ color: "var(--muted-on-dark)" }}
      >
        You&apos;re on the list — we&apos;ll email you when the dashboard is ready.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-9 flex max-w-[440px] flex-wrap gap-2.5"
      noValidate
    >
      <label htmlFor={inputId} className="sr-only">
        {dashboard.emailPlaceholder}
      </label>
      <input
        id={inputId}
        type="email"
        placeholder={dashboard.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-describedby={error ? statusId : undefined}
        aria-invalid={status === "error"}
        required
        className="min-w-[200px] flex-1 rounded-full border px-[18px] py-3.5 text-[15px] outline-none"
        style={{
          background: "rgba(255,255,255,.05)",
          borderColor: "rgba(255,255,255,.16)",
          color: "var(--offwhite)",
        }}
      />
      <Ripple as="div" variant="navy" className="overflow-hidden rounded-full">
        <button
          type="submit"
          disabled={status === "submitting"}
          aria-busy={status === "submitting"}
          className="rounded-full px-[26px] py-3.5 text-[15px] font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "var(--orange)", color: "var(--ink)" }}
        >
          {status === "submitting" ? "Sending…" : dashboard.ctaLabel}
        </button>
      </Ripple>
      <p id={statusId} aria-live="polite" className="w-full text-[13px]" style={{ color: "var(--orange-300)" }}>
        {error}
      </p>
    </form>
  )
}
