'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'

export default function HomePage() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-primary mb-6">
            Studying just got easier.
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Create AI-powered flashcards and quizzes from your notes or any topic.
            Study smarter, not harder.
          </p>

          {!loading && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link href="/library" className="btn-primary text-lg px-8 py-3">
                    Go to Library
                  </Link>
                  <Link href="/create/flashcards/select" className="btn-outline text-lg px-8 py-3">
                    Create Flashcards
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="btn-primary text-lg px-8 py-3">
                    Get Started
                  </Link>
                  <Link href="/login" className="btn-outline text-lg px-8 py-3">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">AI-Powered</h3>
            <p className="text-gray-600">
              Our AI generates high-quality flashcards and quizzes from any topic or your notes
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">Organized Library</h3>
            <p className="text-gray-600">
              Keep all your study sets organized and easily accessible in your personal library
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">Multiple Study Modes</h3>
            <p className="text-gray-600">
              Study with flashcards, test yourself with quizzes, and track your progress
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
