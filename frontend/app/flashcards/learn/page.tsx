'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'

function LearnContent() {
  const searchParams = useSearchParams()
  const title = searchParams.get('title')

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8 text-center">
        <div className="card">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-primary mb-4">Learn Mode</h1>
          <p className="text-gray-600 mb-8">
            Coming Soon! Learn mode will use spaced repetition to help you master your flashcards more effectively.
          </p>

          <div className="flex gap-4 justify-center">
            {title ? (
              <Link
                href={`/flashcards/preview?title=${encodeURIComponent(title)}`}
                className="btn-outline"
              >
                ← Back to Set
              </Link>
            ) : (
              <Link href="/library" className="btn-outline">
                ← Back to Library
              </Link>
            )}
            {title && (
              <Link
                href={`/flashcards/study?title=${encodeURIComponent(title)}`}
                className="btn-primary"
              >
                Study Instead
              </Link>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <LearnContent />
    </Suspense>
  )
}
