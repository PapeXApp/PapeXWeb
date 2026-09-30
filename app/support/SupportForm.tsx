"use client"

// app/support/SupportForm.tsx
//
// "Send us a message" on /support. Posts kind "support" to /api/signup
// (lib/server/signup/*): saved to Firestore `support_requests`, then emailed
// to nico@papex.app with Reply-To = the sender, so Nico answers from his inbox.
//
// Until the route's credentials are live on Vercel it answers 503. Then (and
// on a network failure, a 500 or a rate limit) the form keeps what was typed
// and offers a one-click "Open email": a mailto: to nico@papex.app pre-filled
// with the message (lib/signup/supportMailto.ts), so the request still
// reaches him. There is deliberately no client-side Firestore write.
//
// States mirror the /business DemoForm: idle -> submitting -> success | error
// (field errors inline) | fallback. Labels are visible; errors are tied to
// their fields with aria-describedby; the status line is aria-live.

import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { requestSupport } from "@/lib/signup/client"
import { HONEYPOT_FIELD, SIGNUP_LIMITS, SUPPORT_TOPICS, SUPPORT_TOPIC_VALUES, type SupportTopic } from "@/lib/signup/schema"
import { buildSupportMailto, shouldOfferEmailFallback } from "@/lib/signup/supportMailto"
import styles from "./support.module.css"

const COPY = {
  submit: "Send message",
  submitPending: "Sending…",
  success: "Thanks, we got it. We'll reply to you by email.",
  fallback: "We couldn't send that from here. Email it to us instead:",
  openEmail: "Open email",
  topicPlaceholder: "Choose a topic",
} as const

interface Fields {
  fullName: string
  email: string
  topic: SupportTopic | ""
  message: string
}
type FieldName = keyof Fields
type Errors = Partial<Record<FieldName, string>>
type Status = "idle" | "submitting" | "success" | "error" | "fallback"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIELD_ORDER: FieldName[] = ["fullName", "email", "topic", "message"]
const INITIAL: Fields = { fullName: "", email: "", topic: "", message: "" }

function validate(f: Fields): Errors {
  const errors: Errors = {}
  if (!f.fullName.trim()) errors.fullName = "Your name is required."
  if (!f.email.trim()) errors.email = "Email is required."
  else if (!EMAIL_RE.test(f.email.trim())) errors.email = "Enter a valid email address."
  if (!f.topic) errors.topic = "Choose a topic."
  const message = f.message.trim()
  if (!message) errors.message = "Tell us what's going on."
  else if (message.length < SIGNUP_LIMITS.messageMin) errors.message = "Add a little more detail (at least 10 characters)."
  else if (message.length > SIGNUP_LIMITS.messageMax) errors.message = "That message is too long (4,000 characters max)."
  return errors
}

export function SupportForm({ path = "/support" }: { path?: string }) {
  const [fields, setFields] = useState<Fields>(INITIAL)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [mailto, setMailto] = useState("")
  const refs = useRef<Partial<Record<FieldName, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null>>>({})
  const honeypotRef = useRef<HTMLInputElement | null>(null)
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
    if (errors[name as FieldName]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const showFieldErrors = (errs: Errors) => {
    setErrors(errs)
    const invalid = FIELD_ORDER.filter((n) => errs[n])
    setStatus("error")
    setStatusMessage(`Please fix ${invalid.length} field${invalid.length > 1 ? "s" : ""} below.`)
    refs.current[invalid[0]]?.focus()
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validate(fields)
    if (FIELD_ORDER.some((n) => errs[n])) {
      showFieldErrors(errs)
      return
    }

    setStatus("submitting")
    setStatusMessage("")
    const hp = honeypotRef.current?.value || undefined
    const payload = {
      fullName: fields.fullName.trim(),
      email: fields.email.trim(),
      topic: fields.topic as SupportTopic,
      message: fields.message.trim(),
      path,
    }
    const result = await requestSupport({ ...payload, hp })

    if (result.ok) {
      setStatus("success")
      setStatusMessage(COPY.success)
      return
    }

    if (result.error === "invalid_fields" && result.fields) {
      const serverErrs: Errors = {}
      for (const n of FIELD_ORDER) if (result.fields[n]) serverErrs[n] = result.fields[n]
      if (FIELD_ORDER.some((n) => serverErrs[n])) {
        showFieldErrors(serverErrs)
        return
      }
    }

    // Anything else means the server did not take the message (503 while the
    // route has no credentials, network, 500, 429, or a field error the form
    // can't show): offer the pre-filled email. Only a bot (honeypot filled)
    // is told "thanks" instead, exactly as the server would tell it.
    const offer = shouldOfferEmailFallback(result, Boolean(hp?.trim())) || result.error === "invalid_fields"
    if (!offer) {
      setStatus("success")
      setStatusMessage(COPY.success)
      return
    }
    setMailto(buildSupportMailto({ ...payload, topic: fields.topic }))
    setStatus("fallback")
    setStatusMessage(COPY.fallback)
  }

  if (status === "success") {
    return (
      <div className={`${styles.card} ${styles.cardPad}`} role="status" aria-live="polite">
        <p className={styles.success}>{COPY.success}</p>
      </div>
    )
  }

  const errorId = (n: FieldName) => (errors[n] ? id(`${n}-error`) : undefined)
  const fieldProps = (n: FieldName) => ({
    id: id(n),
    name: n,
    value: fields[n],
    onChange,
    "aria-invalid": Boolean(errors[n]),
    "aria-describedby": errorId(n),
    required: true,
    ref: (el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
      refs.current[n] = el
    },
  })
  const fieldError = (n: FieldName) =>
    errors[n] ? (
      <p id={id(`${n}-error`)} className={styles.error}>
        {errors[n]}
      </p>
    ) : null

  return (
    <div className={`${styles.card} ${styles.cardPad}`}>
      <form onSubmit={onSubmit} noValidate className={styles.form}>
        <div aria-hidden="true" className={styles.honeypot}>
          <input ref={honeypotRef} type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label htmlFor={id("fullName")} className={styles.label}>
              Your name
            </label>
            <input {...fieldProps("fullName")} autoComplete="name" maxLength={SIGNUP_LIMITS.fullName} className={styles.input} />
            {fieldError("fullName")}
          </div>
          <div className={styles.field}>
            <label htmlFor={id("email")} className={styles.label}>
              Email
            </label>
            <input {...fieldProps("email")} type="email" autoComplete="email" className={styles.input} />
            {fieldError("email")}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor={id("topic")} className={styles.label}>
            Topic
          </label>
          <select {...fieldProps("topic")} className={styles.select}>
            <option value="" disabled>
              {COPY.topicPlaceholder}
            </option>
            {SUPPORT_TOPIC_VALUES.map((t) => (
              <option key={t} value={t}>
                {SUPPORT_TOPICS[t]}
              </option>
            ))}
          </select>
          {fieldError("topic")}
        </div>

        <div className={styles.field}>
          <label htmlFor={id("message")} className={styles.label}>
            Message
          </label>
          <textarea {...fieldProps("message")} rows={6} maxLength={SIGNUP_LIMITS.messageMax} className={styles.textarea} />
          {fieldError("message")}
        </div>

        {/* One live region for the form's status: field-error count, the
            fallback notice. Empty (and out of the layout) while idle. */}
        <div aria-live="polite" className={status === "error" || status === "fallback" ? styles.fallback : "sr-only"}>
          {status === "error" || status === "fallback" ? <p className={styles.status}>{statusMessage}</p> : null}
          {status === "fallback" && mailto ? (
            <a href={mailto} className={`rd-btn rd-btn-primary ${styles.submit}`}>
              {COPY.openEmail}
            </a>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          aria-busy={status === "submitting"}
          className={`rd-btn ${status === "fallback" ? "rd-btn-outline" : "rd-btn-primary"} ${styles.submit}`}
        >
          {status === "submitting" ? COPY.submitPending : COPY.submit}
        </button>
      </form>
    </div>
  )
}

export default SupportForm
