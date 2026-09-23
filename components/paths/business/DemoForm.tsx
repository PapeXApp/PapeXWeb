"use client"

import { useId, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/firebase/firebaseConfig"
import { Reveal, Ripple } from "@/components/motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { SALES_PHONE_HREF } from "@/components/brand/links"
import { demo } from "./content"

const ERROR_INK = "#c2410c"

interface DemoFormState {
  fullName: string
  businessName: string
  email: string
  phone: string
  posSystem: string
}

type FieldName = keyof DemoFormState
type Errors = Partial<Record<FieldName, string>>
type Status = "idle" | "submitting" | "success" | "error"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[\d\s()+-]{7,}$/

const INITIAL_STATE: DemoFormState = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  posSystem: "",
}

// Inputs are white fields with their own ink, so they read the same on either
// ground — they're elevated surfaces, not text on the page.
const inputStyle = {
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(0,18,29,.14)",
  background: "#fff",
  fontSize: "15px",
  color: "var(--ink)",
}

function validate(fields: DemoFormState): Errors {
  const errors: Errors = {}

  if (!fields.fullName.trim()) errors.fullName = "Your name is required."
  if (!fields.businessName.trim()) errors.businessName = "Business name is required."

  if (!fields.email.trim()) {
    errors.email = "Email is required."
  } else if (!EMAIL_RE.test(fields.email.trim())) {
    errors.email = "Enter a valid email address."
  }

  if (fields.phone.trim() && !PHONE_RE.test(fields.phone.trim())) {
    errors.phone = "Enter a valid phone number."
  }

  return errors
}

const FIELD_ORDER: FieldName[] = ["fullName", "businessName", "email", "phone", "posSystem"]

export function DemoForm() {
  const [fields, setFields] = useState<DemoFormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>("idle")
  const [statusMessage, setStatusMessage] = useState<string>("")

  const fieldRefs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({})
  const formErrorId = useId()

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as FieldName
    const fieldErrors = validate(fields)
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const fieldErrors = validate(fields)
    setErrors(fieldErrors)

    const invalidFields = FIELD_ORDER.filter((name) => fieldErrors[name])
    if (invalidFields.length > 0) {
      setStatus("error")
      setStatusMessage(
        `Please fix ${invalidFields.length} field${invalidFields.length > 1 ? "s" : ""} below.`,
      )
      fieldRefs.current[invalidFields[0]]?.focus()
      return
    }

    setStatus("submitting")
    setStatusMessage("")

    try {
      await addDoc(collection(db, "waitlist"), {
        fullName: fields.fullName.trim(),
        businessName: fields.businessName.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        posSystem: fields.posSystem.trim(),
        // Marks this as a merchant demo request so it can be told apart
        // from consumer waitlist signups in the shared `waitlist` collection.
        type: "business-demo-request",
        createdAt: serverTimestamp(),
      })
      setStatus("success")
      setStatusMessage(demo.successMessage)
    } catch {
      setStatus("error")
      setStatusMessage(demo.errorMessage)
    }
  }

  return (
    <FlowSection
      id="demo"
      ground="light"
      index="06"
      className="scroll-mt-[100px] px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]"
    >
      <Reveal
        as="div"
        className="mx-auto grid max-w-[960px] grid-cols-1 items-start gap-[clamp(30px,5vw,70px)] min-[821px]:grid-cols-2"
      >
        <div>
          <SectionLabel index="06">{demo.eyebrow}</SectionLabel>
          <h2
            className="text-[length:var(--fs-h2)] font-bold leading-[1.03] tracking-[-.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {demo.heading}
          </h2>
          <p className="mt-[18px] max-w-[34ch] text-[17px] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
            {demo.body}
          </p>
          <p className="mt-6 text-[16px] font-semibold" style={{ color: "var(--flow-fg)" }}>
            {demo.phonePrefix} <a href={SALES_PHONE_HREF} style={{ color: "var(--orange)" }}>{demo.phone}</a>
          </p>
        </div>

        {status === "success" ? (
          <div role="status" aria-live="polite" className="rounded-[12px] border border-[rgba(0,18,29,.14)] bg-white p-6">
            <p className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
              {demo.successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="grid gap-3">
            <p
              id={formErrorId}
              aria-live="assertive"
              className="min-h-[1em] text-[14px] font-medium"
              style={{ color: status === "error" ? ERROR_INK : "transparent" }}
            >
              {status === "error" ? statusMessage : ""}
            </p>

            <div className="grid gap-1.5">
              <Label htmlFor="demo-fullName" className="sr-only">
                Your name
              </Label>
              <Input
                id="demo-fullName"
                name="fullName"
                placeholder="Your name"
                autoComplete="name"
                value={fields.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                ref={(el) => {
                  fieldRefs.current.fullName = el
                }}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "demo-fullName-error" : undefined}
                required
                className="h-auto"
                style={inputStyle}
              />
              {errors.fullName && (
                <p id="demo-fullName-error" role="alert" className="text-[13px]" style={{ color: ERROR_INK }}>
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="demo-businessName" className="sr-only">
                Business name
              </Label>
              <Input
                id="demo-businessName"
                name="businessName"
                placeholder="Business name"
                autoComplete="organization"
                value={fields.businessName}
                onChange={handleChange}
                onBlur={handleBlur}
                ref={(el) => {
                  fieldRefs.current.businessName = el
                }}
                aria-invalid={Boolean(errors.businessName)}
                aria-describedby={errors.businessName ? "demo-businessName-error" : undefined}
                required
                className="h-auto"
                style={inputStyle}
              />
              {errors.businessName && (
                <p id="demo-businessName-error" role="alert" className="text-[13px]" style={{ color: ERROR_INK }}>
                  {errors.businessName}
                </p>
              )}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="demo-email" className="sr-only">
                Email
              </Label>
              <Input
                id="demo-email"
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={fields.email}
                onChange={handleChange}
                onBlur={handleBlur}
                ref={(el) => {
                  fieldRefs.current.email = el
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "demo-email-error" : undefined}
                required
                className="h-auto"
                style={inputStyle}
              />
              {errors.email && (
                <p id="demo-email-error" role="alert" className="text-[13px]" style={{ color: ERROR_INK }}>
                  {errors.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 min-[481px]:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="demo-phone" className="sr-only">
                  Phone
                </Label>
                <Input
                  id="demo-phone"
                  name="phone"
                  type="tel"
                  placeholder="Phone"
                  autoComplete="tel"
                  value={fields.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  ref={(el) => {
                    fieldRefs.current.phone = el
                  }}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "demo-phone-error" : undefined}
                  className="h-auto"
                  style={inputStyle}
                />
                {errors.phone && (
                  <p id="demo-phone-error" role="alert" className="text-[13px]" style={{ color: ERROR_INK }}>
                    {errors.phone}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="demo-posSystem" className="sr-only">
                  POS system
                </Label>
                <Input
                  id="demo-posSystem"
                  name="posSystem"
                  placeholder="POS system"
                  value={fields.posSystem}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  ref={(el) => {
                    fieldRefs.current.posSystem = el
                  }}
                  className="h-auto"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Ripple only accepts {children, variant, as, className, style} —
                the real `<button>` (type, disabled, focus) lives inside it so
                submit/pending semantics stay intact while still getting the
                click-ripple treatment from the motion toolkit. */}
            <Ripple as="div" variant="navy" className="mt-1.5 overflow-hidden rounded-[12px]">
              <button
                type="submit"
                disabled={status === "submitting"}
                aria-busy={status === "submitting"}
                className="w-full rounded-[12px] py-[15px] text-[16px] font-semibold transition-transform duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--orange)", color: "var(--ink)" }}
              >
                {status === "submitting" ? demo.submitLabelPending : demo.submitLabel}
              </button>
            </Ripple>
          </form>
        )}
      </Reveal>
    </FlowSection>
  )
}
