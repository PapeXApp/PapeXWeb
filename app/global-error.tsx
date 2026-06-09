"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "24px",
            fontFamily: "Inter, sans-serif",
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#1a1a1a" }}>Something went wrong</h1>
          <p style={{ color: "#605f5f", maxWidth: "420px" }}>
            Try refreshing the page. If you are developing locally, stop the dev server, delete the <code>.next</code>{" "}
            folder, and run <code>npm run dev</code> again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "none",
              borderRadius: "999px",
              background: "#e06d00",
              color: "#fff",
              padding: "10px 20px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
