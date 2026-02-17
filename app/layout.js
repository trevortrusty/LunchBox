import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata = {
  title: 'Lunchbox — Shift & Task Management',
  description: 'Retail shift and task management system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased bg-gray-50 text-gray-900`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
