'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import { openStudySet, deleteStudySet, saveStudySet } from '@/lib/api'

type FlashcardQuestion = {
  question: string
  answer: string
}

type QuizQuestion = {
  question: string
  correct_answer: string
  incorrect_answers: string[]
}

type StudySet = {
  title: string
  description: string
  type: 'flashcards' | 'quiz'
  questions: FlashcardQuestion[] | QuizQuestion[]
}

function EditContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const originalTitle = searchParams.get('title')

  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<(FlashcardQuestion | QuizQuestion)[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (originalTitle) {
      loadStudySet()
    }
  }, [originalTitle])

  const loadStudySet = async () => {
    try {
      const data = await openStudySet(originalTitle!) as StudySet
      setStudySet(data)
      setTitle(data.title)
      setDescription(data.description)
      setQuestions(data.questions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study set')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!studySet) return

    setSaving(true)
    setError('')

    try {
      // Delete old study set first if title changed
      if (originalTitle !== title) {
        await deleteStudySet(originalTitle!)
      } else {
        // Delete and re-save to update
        await deleteStudySet(originalTitle!)
      }

      // Save with new data
      await saveStudySet({
        title,
        description,
        type: studySet.type,
        questions,
      })

      // Redirect to preview
      if (studySet.type === 'flashcards') {
        router.push(`/flashcards/preview?title=${encodeURIComponent(title)}`)
      } else {
        router.push(`/quiz/play?title=${encodeURIComponent(title)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setSaving(false)
    }
  }

  const updateFlashcard = (index: number, field: 'question' | 'answer', value: string) => {
    const newQuestions = [...questions] as FlashcardQuestion[]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  const updateQuizQuestion = (
    index: number,
    field: 'question' | 'correct_answer',
    value: string
  ) => {
    const newQuestions = [...questions] as QuizQuestion[]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  const updateIncorrectAnswer = (qIndex: number, aIndex: number, value: string) => {
    const newQuestions = [...questions] as QuizQuestion[]
    const newIncorrect = [...newQuestions[qIndex].incorrect_answers]
    newIncorrect[aIndex] = value
    newQuestions[qIndex] = { ...newQuestions[qIndex], incorrect_answers: newIncorrect }
    setQuestions(newQuestions)
  }

  const addQuestion = () => {
    if (studySet?.type === 'flashcards') {
      setQuestions([...questions, { question: '', answer: '' }])
    } else {
      setQuestions([
        ...questions,
        { question: '', correct_answer: '', incorrect_answers: ['', '', ''] },
      ])
    }
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, i) => i !== index))
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

  if (error && !studySet) {
    return (
      <AuthGuard>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/library/All" className="btn-primary">
            Back to Library
          </Link>
        </div>
      </AuthGuard>
    )
  }

  if (!studySet) return null

  return (
    <AuthGuard>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/library/All" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Library
          </Link>
          <h1 className="text-3xl font-bold text-primary">Edit Study Set</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Title and Description */}
          <div className="card space-y-4">
            <div>
              <label htmlFor="title" className="label">Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input min-h-[80px] resize-y"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">
                {studySet.type === 'flashcards' ? 'Cards' : 'Questions'}
              </h2>
              <button onClick={addQuestion} className="btn-outline text-sm">
                + Add {studySet.type === 'flashcards' ? 'Card' : 'Question'}
              </button>
            </div>

            {questions.map((q, index) => (
              <div key={index} className="card relative">
                <button
                  onClick={() => removeQuestion(index)}
                  disabled={questions.length <= 1}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 disabled:opacity-30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <p className="text-sm text-gray-500 mb-4">
                  {studySet.type === 'flashcards' ? `Card ${index + 1}` : `Question ${index + 1}`}
                </p>

                {studySet.type === 'flashcards' ? (
                  <div className="space-y-4 pr-8">
                    <div>
                      <label className="label">Question</label>
                      <input
                        type="text"
                        value={(q as FlashcardQuestion).question}
                        onChange={(e) => updateFlashcard(index, 'question', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Answer</label>
                      <input
                        type="text"
                        value={(q as FlashcardQuestion).answer}
                        onChange={(e) => updateFlashcard(index, 'answer', e.target.value)}
                        className="input"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pr-8">
                    <div>
                      <label className="label">Question</label>
                      <input
                        type="text"
                        value={(q as QuizQuestion).question}
                        onChange={(e) => updateQuizQuestion(index, 'question', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Correct Answer</label>
                      <input
                        type="text"
                        value={(q as QuizQuestion).correct_answer}
                        onChange={(e) => updateQuizQuestion(index, 'correct_answer', e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">Incorrect Answers</label>
                      <div className="space-y-2">
                        {(q as QuizQuestion).incorrect_answers.map((ans, aIndex) => (
                          <input
                            key={aIndex}
                            type="text"
                            value={ans}
                            onChange={(e) => updateIncorrectAnswer(index, aIndex, e.target.value)}
                            className="input"
                            placeholder={`Wrong answer ${aIndex + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <Link href="/library/All" className="btn-outline flex-1 text-center">
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

export default function EditPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <EditContent />
    </Suspense>
  )
}
