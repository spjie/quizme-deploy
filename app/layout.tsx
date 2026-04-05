import type { Metadata } from 'next'
import { AuthProvider } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Kirang+Haerang&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background flex flex-col text-primary">
        <MobileBlocker />
        <AuthProvider>
          <Navbar />
          <main className={`flex-grow font-sans`}>{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
