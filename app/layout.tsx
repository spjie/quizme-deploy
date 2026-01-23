import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import MobileBlocker from '@/components/MobileBlocker'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quizme - Studying Just Got Easier',
  description: 'Create AI-powered flashcards and quizzes to help you study',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        <MobileBlocker />
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
