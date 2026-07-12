import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Global Deal Finder',
  description: 'Best Price + Best Card + Best Timing, Worldwide',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink-navy text-paper">
        {children}
      </body>
    </html>
  )
}
