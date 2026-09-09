import Link from 'next/link'

export default function NotFound() {
  return (
    <html>
      <head>
        <title>PapeX - Page Not Found</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#eceded]">
          <h2 className="text-3xl font-bold text-[#00121D] mb-4">Page Not Found</h2>
          <p className="text-lg text-[#00121D] mb-6">The page you were looking for doesn't exist.</p>
          <Link 
            href="/"
            className="px-4 py-2 bg-[#EB7100] text-white rounded-md hover:bg-[#cc6300] transition-all"
          >
            Return Home
          </Link>
        </div>
      </body>
    </html>
  )
} 