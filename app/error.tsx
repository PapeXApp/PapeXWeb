"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-[#1a1a1a]">Something went wrong</h1>
      <p className="text-[#605f5f] max-w-md">Try refreshing the page. If the problem continues, restart the dev server.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-[#e06d00] px-5 py-2.5 text-white font-medium"
      >
        Try again
      </button>
    </div>
  )
}
