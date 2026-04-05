'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <nav className="bg-background sticky top-0 z-50 border-b border-primary">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 items-center">
          {/* Left Navigation */}
          <div className="flex items-center gap-8">
            {!loading && user && (
              <>
                <Link
                  href="/create/flashcards/select"
                  className="text-sm text-primary hover:text-primary-dark uppercase tracking-wide"
                >
                  CREATE
                </Link>
                <Link
                  href="/library"
                  className="text-sm text-primary hover:text-primary-dark uppercase tracking-wide"
                >
                  LIBRARY
                </Link>
              </>
            )}
          </div>

          {/* Center Logo */}
          <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
            <span className="text-2xl font-display tracking-wider">QUIZME</span>
          </Link>

          {/* Right Navigation */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            ) : user ? (
              <button
                onClick={handleSignOut}
                className="text-sm text-primary hover:text-primary-dark uppercase tracking-wide"
              >
                SIGN OUT
              </button>
            ) : (
              <>
                <Link href="/login" className="text-sm text-primary hover:text-primary-dark uppercase tracking-wide">
                  LOG IN
                </Link>
                <Link href="/signup" className="text-sm text-primary hover:text-primary-dark uppercase tracking-wide">
                  SIGN UP
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
