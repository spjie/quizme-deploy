'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
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

type QuizQuestion = {
  question: string
  correctAnswer: string
  options: string[]
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

function generateQuizQuestions(questions: Question[]): QuizQuestion[] {
  return questions.map((q, idx) => {
    // Get 3 random wrong answers from other questions
    const otherAnswers = questions
      .filter((_, i) => i !== idx)
      .map(q => q.answer)

    const wrongAnswers = shuffleArray(otherAnswers).slice(0, 3)

    // If we don't have enough wrong answers, pad with empty strings
    while (wrongAnswers.length < 3) {
      wrongAnswers.push(`Option ${wrongAnswers.length + 2}`)
    }

    const options = shuffleArray([q.answer, ...wrongAnswers])

    return {
      question: q.question,
      correctAnswer: q.answer,
      options,
    }
  })
}

function FlashcardQuizContent() {
  const searchParams = useSearchParams()
  const title = searchParams.get('title')

  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<{ correct: boolean; selected: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quizComplete, setQuizComplete] = useState(false)

  useEffect(() => {
    if (title) {
      loadStudySet()
    }
  }, [title])

  const loadStudySet = async () => {
    try {
      const data = await openStudySet(title!) as StudySet
      setStudySet(data)
      setQuizQuestions(generateQuizQuestions(shuffleArray<Question>(data.questions)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study set')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = () => {
    if (!selectedAnswer) return

    const isCorrect = selectedAnswer === quizQuestions[currentIndex].correctAnswer
    if (isCorrect) {
      setScore(score + 1)
    }

    setAnswers([...answers, { correct: isCorrect, selected: selectedAnswer }])
    setShowResult(true)
  }

  const handleNext = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizComplete(true)
    }
  }

  const restartQuiz = () => {
    if (studySet) {
      setQuizQuestions(generateQuizQuestions(shuffleArray<Question>(studySet.questions)))
    }
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setAnswers([])
    setQuizComplete(false)
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

  if (quizComplete) {
    const percentage = Math.round((score / quizQuestions.length) * 100)

    return (
      <AuthGuard>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="card text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">Quiz Complete!</h1>

            <div className="w-32 h-32 rounded-full border-8 border-primary flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl font-bold text-primary">{percentage}%</span>
            </div>

            <p className="text-xl text-gray-600 mb-2">
              You got {score} out of {quizQuestions.length} correct
            </p>

            <p className="text-gray-500 mb-8">
              {percentage >= 80
                ? 'Excellent work! You really know this material!'
                : percentage >= 60
                  ? 'Good job! Keep studying to improve.'
                  : 'Keep practicing! You\'ll get there.'}
            </p>

            <div className="flex gap-4 justify-center">
              <button onClick={restartQuiz} className="btn-outline">
                Try Again
              </button>
              <Link
                href={`/flashcards/study?title=${encodeURIComponent(studySet.title)}`}
                className="btn-primary"
              >
                Study More
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const currentQuestion = quizQuestions[currentIndex]

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
          <h1 className="text-2xl font-bold text-primary">Quiz Mode</h1>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Question {currentIndex + 1} of {quizQuestions.length}</span>
            <span>Score: {score}/{answers.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${((currentIndex + 1) / quizQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="card mb-6">
          <p className="text-xl text-primary">{currentQuestion.question}</p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentQuestion.options.map((option, index) => {
            let buttonClass = 'w-full p-4 rounded-xl border-2 text-left transition-colors '

            if (showResult) {
              if (option === currentQuestion.correctAnswer) {
                buttonClass += 'bg-green-100 border-green-500 text-green-700'
              } else if (option === selectedAnswer) {
                buttonClass += 'bg-red-100 border-red-500 text-red-700'
              } else {
                buttonClass += 'bg-gray-100 border-gray-300 text-gray-500'
              }
            } else if (option === selectedAnswer) {
              buttonClass += 'bg-secondary border-primary text-primary'
            } else {
              buttonClass += 'bg-white border-gray-300 text-primary hover:border-primary'
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(option)}
                disabled={showResult}
                className={buttonClass}
              >
                {option}
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          {!showResult ? (
            <button
              onClick={handleAnswer}
              disabled={!selectedAnswer}
              className="btn-primary disabled:opacity-50"
            >
              Check Answer
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary">
              {currentIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}

export default function FlashcardQuizPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <FlashcardQuizContent />
    </Suspense>
  )
}
