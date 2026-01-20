'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Flashcard from '@/components/Flashcard'
import { openStudySet } from '@/lib/api'

type Question = {
  question: string
  answer: string
}

type StudySet = {
  title: string
  description: string
  questions: Question[]
}

function StudyContent() {
  const searchParams = useSearchParams()
  const title = searchParams.get('title')

  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cardKey, setCardKey] = useState(0) // For resetting flip state

  useEffect(() => {
    if (title) {
      loadStudySet()
    }
  }, [title])

  const loadStudySet = async () => {
    try {
      const data = await openStudySet(title!)
      setStudySet(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study set')
    } finally {
      setLoading(false)
    }
  }

  const goBack = useCallback(() => {
    if (studySet && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setCardKey(prev => prev + 1) // Reset flip state
    }
  }, [studySet, currentIndex])

  const goForward = useCallback(() => {
    if (studySet && currentIndex < studySet.questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setCardKey(prev => prev + 1) // Reset flip state
    }
  }, [studySet, currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goBack()
      } else if (e.key === 'ArrowRight') {
        goForward()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goBack, goForward])

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

  const currentQuestion = studySet.questions[currentIndex]

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href={`/flashcards/preview?title=${encodeURIComponent(studySet.title)}`}
            className="text-primary hover:underline mb-4 inline-block"
          >
            ← Back to {studySet.title}
          </Link>
          <h1 className="text-2xl font-bold text-primary">Study Mode</h1>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Card {currentIndex + 1} of {studySet.questions.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${((currentIndex + 1) / studySet.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div className="mb-8">
          <Flashcard
            key={cardKey}
            question={currentQuestion.question}
            answer={currentQuestion.answer}
          />
        </div>

        {/* Instructions */}
        <p className="text-center text-gray-500 text-sm mb-6">
          Click the card or press Space to flip
        </p>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={goBack}
            disabled={currentIndex === 0}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <span className="text-gray-600">
            Use arrow keys to navigate
          </span>

          <button
            onClick={goForward}
            disabled={currentIndex === studySet.questions.length - 1}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>

        {/* Completion message */}
        {currentIndex === studySet.questions.length - 1 && (
          <div className="mt-8 text-center p-6 bg-green-50 rounded-2xl">
            <p className="text-green-700 font-medium mb-4">
              You&apos;ve reached the end of this study set!
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setCurrentIndex(0)
                  setCardKey(prev => prev + 1)
                }}
                className="btn-outline"
              >
                Start Over
              </button>
              <Link
                href={`/flashcards/quiz?title=${encodeURIComponent(studySet.title)}`}
                className="btn-primary"
              >
                Take Quiz
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <StudyContent />
    </Suspense>
  )
}
