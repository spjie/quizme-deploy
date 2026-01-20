'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import { FlashcardPreview } from '@/components/Flashcard'
import { openStudySet } from '@/lib/api'

type Question = {
  question: string
  answer: string
}

type StudySet = {
  title: string
  description: string
  type: 'flashcards' | 'quiz'
  questions: Question[]
}

function FlashcardPreviewContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const title = searchParams.get('title')

  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (title) {
      loadStudySet()
    }
  }, [title])

  const loadStudySet = async () => {
    try {
      const data = await openStudySet(title!) as StudySet

      // Redirect to quiz if this is actually a quiz set
      if (data.type === 'quiz') {
        router.replace(`/quiz/play?title=${encodeURIComponent(title!)}`)
        return
      }

      setStudySet(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study set')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner" />
        </div>
      </AuthGuard>
    )
  }

  if (error || !studySet) {
    return (
      <AuthGuard>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-red-500 mb-4">{error || 'Study set not found'}</p>
          <Link href="/library" className="btn-primary">
            Back to Library
          </Link>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/library" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Library
          </Link>
          <h1 className="text-3xl font-bold text-primary mb-2">{studySet.title}</h1>
          <p className="text-gray-600 mb-4">{studySet.description}</p>
          <p className="text-sm text-gray-500">{studySet.questions.length} cards</p>
        </div>

        {/* Study mode buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            href={`/flashcards/study?title=${encodeURIComponent(studySet.title)}`}
            className="btn-primary"
          >
            Study
          </Link>
          <Link
            href={`/flashcards/learn?title=${encodeURIComponent(studySet.title)}`}
            className="btn-outline"
          >
            Learn
          </Link>
          <Link
            href={`/flashcards/quiz?title=${encodeURIComponent(studySet.title)}`}
            className="btn-outline"
          >
            Quiz
          </Link>
          <Link
            href={`/edit?title=${encodeURIComponent(studySet.title)}`}
            className="btn-secondary"
          >
            Edit
          </Link>
        </div>

        {/* Cards preview */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-primary">Cards in this set</h2>
          <div className="grid gap-4">
            {studySet.questions.map((q, index) => (
              <FlashcardPreview
                key={index}
                question={q.question}
                answer={q.answer}
              />
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function FlashcardPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <FlashcardPreviewContent />
    </Suspense>
  )
}
