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
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">quizme</span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              {loading ? (
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
              ) : user ? (
                <>
                  {/* Dropdown for Create */}
                  <div className="relative group">
                    <button className="btn-primary flex items-center gap-2">
                      Create
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <Link
                        href="/create/flashcards/select"
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-primary"
                      >
                        Select
                      </Link>
                      <Link
                        href="/create/flashcards/notes"
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-primary"
                      >
                        Notes
                      </Link>
                    </div>
                  </div>

                  <Link href="/library" className="text-primary hover:text-primary-dark font-medium">
                    Library
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-outline">
                    Log In
                  </Link>
                  <Link href="/signup" className="btn-primary">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
