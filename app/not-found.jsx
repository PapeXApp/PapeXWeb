import Link from 'next/link'

export default function NotFound() {
  return (
    <html>
      <head>
        <title>PapeX - Page Not Found</title>
        <link rel="icon" href="/favlogo.png" />
        <link rel="shortcut icon" href="/favlogo.png" />
      </head>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#d0e4f4]">
          <h2 className="text-3xl font-bold text-[#0a3d62] mb-4">Page Not Found</h2>
          <p className="text-lg text-[#0a3d62] mb-6">The page you were looking for doesn't exist.</p>
          <Link 
            href="/"
            className="px-4 py-2 bg-[#ff9933] text-white rounded-md hover:bg-[#e67e22] transition-all"
          >
            Return Home
          </Link>
        </div>
      </body>
    </html>
  )
} 