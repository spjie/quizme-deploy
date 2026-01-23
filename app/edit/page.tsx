'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import { openStudySet, updateStudySet, generateContent } from '@/lib/api'

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
  const studySetId = searchParams.get('id')
  const originalTitle = searchParams.get('title')

  const [studySet, setStudySet] = useState<StudySet | null>(null)
  const [studySetDbId, setStudySetDbId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<(FlashcardQuestion | QuizQuestion)[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [refiningIndex, setRefiningIndex] = useState<number | null>(null)
  const [typewriterContent, setTypewriterContent] = useState<{ question: string; answer: string } | null>(null)
  const [typewriterIndex, setTypewriterIndex] = useState<number | null>(null)
  const [isTypingQuestion, setIsTypingQuestion] = useState(false)

  useEffect(() => {
    if (studySetId || originalTitle) {
      loadStudySet()
    }
  }, [studySetId, originalTitle])

  const loadStudySet = async () => {
    try {
      const identifier = studySetId || originalTitle!
      const data = await openStudySet(identifier) as StudySet & { id: number }
      setStudySet(data)
      setStudySetDbId(data.id)
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
    if (!studySet || !studySetDbId) return

    setSaving(true)
    setError('')

    try {
      // Update the study set using the update endpoint
      await updateStudySet(studySetDbId, {
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

  const handleRefine = async (index: number, action: 'harder' | 'simplify' | 'rephrase') => {
    if (!studySet || studySet.type !== 'flashcards') return

    setRefiningIndex(index)
    setTypewriterContent(null)
    setTypewriterIndex(null)

    const question = questions[index] as FlashcardQuestion

    let prompt = ''
    if (action === 'harder') {
      prompt = `Make this flashcard question harder while keeping the same topic. Original question: "${question.question}" Original answer: "${question.answer}". Return ONLY a JSON object with this exact format: {"question": "new question", "answer": "new answer"}`
    } else if (action === 'simplify') {
      prompt = `Simplify this flashcard question to make it easier while keeping the same topic. Original question: "${question.question}" Original answer: "${question.answer}". Return ONLY a JSON object with this exact format: {"question": "new question", "answer": "new answer"}`
    } else if (action === 'rephrase') {
      prompt = `Rephrase this flashcard question using different words but maintaining the same difficulty and topic. Original question: "${question.question}" Original answer: "${question.answer}". Return ONLY a JSON object with this exact format: {"question": "new question", "answer": "new answer"}`
    }

    try {
      const response = await generateContent(prompt)
      let newQuestion: FlashcardQuestion

      // Try to parse the response as JSON
      try {
        newQuestion = JSON.parse(response.response)
      } catch {
        // If not valid JSON, try to extract JSON from the response
        const jsonMatch = response.response.match(/\{[\s\S]*"question"[\s\S]*"answer"[\s\S]*\}/)
        if (jsonMatch) {
          newQuestion = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('Invalid response format')
        }
      }

      // Start typewriter effect
      setRefiningIndex(null)
      setTypewriterIndex(index)
      setTypewriterContent(newQuestion)
      setIsTypingQuestion(true)

      // Animate typewriter effect
      let questionChars = 0
      let answerChars = 0
      const questionLength = newQuestion.question.length
      const answerLength = newQuestion.answer.length
      const speed = 20 // ms per character

      const interval = setInterval(() => {
        if (questionChars < questionLength) {
          questionChars++
          const partialQuestion = newQuestion.question.slice(0, questionChars)
          const newQuestions = [...questions] as FlashcardQuestion[]
          const currentQuestion = questions[index] as FlashcardQuestion
          newQuestions[index] = {
            question: partialQuestion,
            answer: currentQuestion.answer
          }
          setQuestions(newQuestions)
        } else if (answerChars < answerLength) {
          if (answerChars === 0) {
            setIsTypingQuestion(false)
          }
          answerChars++
          const partialAnswer = newQuestion.answer.slice(0, answerChars)
          const newQuestions = [...questions] as FlashcardQuestion[]
          newQuestions[index] = {
            question: newQuestion.question,
            answer: partialAnswer
          }
          setQuestions(newQuestions)
        } else {
          clearInterval(interval)
          setTypewriterIndex(null)
          setTypewriterContent(null)
          setIsTypingQuestion(false)
        }
      }, speed)
    } catch (err) {
      console.error('Failed to refine question:', err)
      setError(err instanceof Error ? err.message : 'Failed to refine question')
      setRefiningIndex(null)
      setTypewriterIndex(null)
      setTypewriterContent(null)
      setIsTypingQuestion(false)
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

  if (error && !studySet) {
    return (
      <AuthGuard>
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/library" className="btn-primary">
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
          <Link href="/library" className="text-primary hover:underline mb-4 inline-block">
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
                {refiningIndex === index || (typewriterIndex === index && isTypingQuestion) ? (
                  // Loading shimmer placeholder while waiting or typing question
                  <div className="space-y-4 pr-8">
                    <p className="text-sm text-gray-500 mb-4">
                      Card {index + 1}
                    </p>
                    <div>
                      <label className="label">Question</label>
                      {refiningIndex === index ? (
                        <div className="h-11 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
                      ) : (
                        <input
                          type="text"
                          value={(q as FlashcardQuestion).question}
                          className="input"
                          readOnly
                        />
                      )}
                    </div>
                    <div>
                      <label className="label">Answer</label>
                      <div className="h-11 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
                    </div>
                  </div>
                ) : (
                  <>
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
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleRefine(index, 'harder')}
                        disabled={refiningIndex !== null || typewriterIndex !== null}
                        className="text-xs px-3 py-1.5 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                        title="Make harder"
                      >
                        Make Harder
                      </button>
                      <button
                        onClick={() => handleRefine(index, 'simplify')}
                        disabled={refiningIndex !== null || typewriterIndex !== null}
                        className="text-xs px-3 py-1.5 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                        title="Simplify"
                      >
                        Simplify
                      </button>
                      <button
                        onClick={() => handleRefine(index, 'rephrase')}
                        disabled={refiningIndex !== null || typewriterIndex !== null}
                        className="text-xs px-3 py-1.5 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
                        title="Rephrase"
                      >
                        Rephrase
                      </button>
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
                </>
              )}
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <Link href="/library" className="btn-outline flex-1 text-center">
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
