"use client"

import { useId, useRef, useState, type ChangeEvent, type FocusEvent, type FormEvent } from "react"
import { requestDemo } from "@/lib/signup/client"
import { HONEYPOT_FIELD } from "@/lib/signup/schema"
import { Reveal, Ripple } from "@/components/motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FlowSection } from "../shared/FlowSection"
import { SectionLabel } from "../shared/SectionLabel"
import { SALES_PHONE_HREF } from "@/components/brand/links"
import { demo } from "./content"
import styles from "./business.module.css"

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
// 60px tall since 2026-09-22: the section is a full screen now, and 48px
// controls left the form reading as a small box floating in it.
const inputStyle = {
  height: "60px",
  padding: "0 18px",
  borderRadius: "12px",
  border: "1px solid rgba(0,18,29,.14)",
  background: "#fff",
  fontSize: "16px",
  color: "var(--ink)",
}

// Visible labels since Web 2.1 (they were sr-only, with the same words as
// placeholders). A label that stays put reads better than a placeholder that
// vanishes on the first keystroke, and it is what gives the full-screen form
// its height instead of padding. Labels sit on the page ground, so they take
// --flow-* ink; the inputs themselves are white elevated surfaces.
const labelClass = "text-[14px] font-semibold leading-[1.2] tracking-[.01em]"
const labelStyle = { color: "var(--flow-fg-2)" }

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
  // Honeypot: uncontrolled, off-screen, never focusable. A person can't fill
  // it; a naive bot does, and the route then quietly drops the submission.
  const honeypotRef = useRef<HTMLInputElement | null>(null)
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

    // Since Web 2.1 (B3) the form posts to the shared sign-up route, which
    // writes the SAME `waitlist` document server-side (fields + the
    // "business-demo-request" type marker; see lib/server/signup/store.ts)
    // and emails the team. The browser no longer writes Firestore directly.
    const result = await requestDemo({
      fullName: fields.fullName.trim(),
      businessName: fields.businessName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim(),
      posSystem: fields.posSystem.trim(),
      hp: honeypotRef.current?.value || undefined,
    })

    if (result.ok) {
      setStatus("success")
      setStatusMessage(demo.successMessage)
      return
    }

    // The server re-validates; if it disagrees with the client check, show
    // its per-field messages the same way the client ones are shown.
    const serverErrors: Errors = {}
    for (const name of FIELD_ORDER) {
      const msg = result.fields?.[name]
      if (msg) serverErrors[name] = msg
    }
    const serverInvalid = FIELD_ORDER.filter((name) => serverErrors[name])
    if (serverInvalid.length > 0) {
      setErrors(serverErrors)
      setStatus("error")
      setStatusMessage(
        `Please fix ${serverInvalid.length} field${serverInvalid.length > 1 ? "s" : ""} below.`,
      )
      fieldRefs.current[serverInvalid[0]]?.focus()
      return
    }

    setStatus("error")
    setStatusMessage(demo.errorMessage)
  }

  return (
    <FlowSection
      id="demo"
      ground="light"
      /* A full screen since 2026-09-22 ("screens, not sections"): it measured
         454px at 1440x900, so the demo ask shared a viewport with the
         dashboard columns above it. `styles.screen` gives it >= 100svh with
         copy left / form right centred in that box; the footer still follows
         as the page's navy tail. */
      className={`${styles.screen} scroll-mt-[100px] px-[clamp(20px,5vw,56px)] py-[var(--section-pad-y)]`}
    >
      <Reveal
        as="div"
        className="mx-auto grid w-full max-w-[1100px] grid-cols-1 items-start gap-[clamp(30px,5vw,70px)] min-[821px]:grid-cols-2 min-[821px]:items-center"
      >
        <div>
          {/* No index: the form is the second half of 05 "How do I get it?"
              (setup -> demo), not a section of its own. */}
          <SectionLabel>{demo.eyebrow}</SectionLabel>
          <h2
            className="text-[length:var(--fs-h1-merchant)] font-bold leading-[1.03] tracking-[-.02em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {demo.heading}
          </h2>
          <p className="mt-[var(--gap-title)] max-w-[34ch] text-[length:var(--fs-lead)] leading-[1.55]" style={{ color: "var(--flow-fg-2)" }}>
            {demo.body}
          </p>
          <p className="mt-[var(--gap-body)] text-[16px] font-semibold" style={{ color: "var(--flow-fg)" }}>
            {demo.phonePrefix} <a href={SALES_PHONE_HREF} style={{ color: "var(--orange)" }}>{demo.phone}</a>
          </p>
        </div>

        {/* Right column: the proof line (Web 2.1, Nico: "Live in the Bay
            Area." and nothing more), then the form or its success state.
            Copy only; the form's mechanics are unchanged. */}
        <div>
          <p
            className="mb-[var(--gap-list)] inline-flex items-center gap-2.5 rounded-full border px-4 py-2 text-[14px] font-semibold"
            style={{ borderColor: "var(--flow-hair)", color: "var(--flow-fg)" }}
          >
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: "var(--orange)" }} />
            {demo.proof}
          </p>
          {status === "success" ? (
            <div role="status" aria-live="polite" className="rounded-[12px] border border-[rgba(0,18,29,.14)] bg-white p-6">
              <p className="text-[16px] font-semibold" style={{ color: "var(--ink)" }}>
                {demo.successMessage}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="grid gap-[var(--gap-list)]">
              <div
                aria-hidden="true"
                style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
              >
                <input ref={honeypotRef} type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
              </div>
              <p
                id={formErrorId}
                aria-live="assertive"
                className="min-h-[1em] text-[14px] font-medium"
                style={{ color: status === "error" ? ERROR_INK : "transparent" }}
              >
                {status === "error" ? statusMessage : ""}
              </p>

              <div className="grid gap-2">
                <Label htmlFor="demo-fullName" className={labelClass} style={labelStyle}>
                  Your name
                </Label>
                <Input
                  id="demo-fullName"
                  name="fullName"
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

              <div className="grid gap-2">
                <Label htmlFor="demo-businessName" className={labelClass} style={labelStyle}>
                  Business name
                </Label>
                <Input
                  id="demo-businessName"
                  name="businessName"
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

              <div className="grid gap-2">
                <Label htmlFor="demo-email" className={labelClass} style={labelStyle}>
                  Email
                </Label>
                <Input
                  id="demo-email"
                  name="email"
                  type="email"
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

              <div className="grid grid-cols-1 gap-[var(--gap-list)] min-[481px]:grid-cols-2 min-[821px]:grid-cols-1">
                <div className="grid gap-2">
                  <Label htmlFor="demo-phone" className={labelClass} style={labelStyle}>
                    Phone
                  </Label>
                  <Input
                    id="demo-phone"
                    name="phone"
                    type="tel"
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
                <div className="grid gap-2">
                  <Label htmlFor="demo-posSystem" className={labelClass} style={labelStyle}>
                    POS system
                  </Label>
                  <Input
                    id="demo-posSystem"
                    name="posSystem"
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
              <Ripple as="div" variant="navy" className="mt-[calc(var(--gap-list)/2)] overflow-hidden rounded-[12px]">
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  aria-busy={status === "submitting"}
                  className="h-[60px] w-full rounded-[12px] text-[17px] font-semibold transition-transform duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "var(--orange)", color: "var(--ink)" }}
                >
                  {status === "submitting" ? demo.submitLabelPending : demo.submitLabel}
                </button>
              </Ripple>
            </form>
          )}
        </div>
      </Reveal>
    </FlowSection>
  )
}
