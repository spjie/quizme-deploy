'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { generateContentStream, saveStudySet } from '@/lib/api'

export default function NotesPage() {
  const params = useParams()
  const type = params.type as 'flashcards' | 'quiz'
  const router = useRouter()

  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState<Array<{question: string, answer: string}>>([])
  const previewRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new questions are added
  useEffect(() => {
    if (previewRef.current && parsedQuestions.length > 0) {
      previewRef.current.scrollTo({
        top: previewRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [parsedQuestions.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setParsedQuestions([])

    try {
      const prompt = type === 'flashcards'
        ? `Based on the following notes, generate ${quantity} flashcards. For EACH flashcard, output a separate JSON object on its own line in this format: {"question": "Question text", "answer": "Answer text"}

After all flashcards, output a final line with: {"title": "Topic Title", "description": "Brief description"}

Make questions that test understanding of the key concepts.

Notes:
${notes}`
        : `Based on the following notes, generate a ${quantity} question multiple choice quiz. For EACH question, output a separate JSON object on its own line in this format: {"question": "Question text", "correct_answer": "Correct answer", "incorrect_answers": ["Wrong 1", "Wrong 2", "Wrong 3"]}

After all questions, output a final line with: {"title": "Quiz Title", "description": "Brief description"}

Make questions educational.

Notes:
${notes}`

      let streamingText = ''
      let title = ''
      let description = ''

      await generateContentStream(
        prompt,
        (chunk) => {
          // Update streaming text
          streamingText += chunk

          // Try to extract complete JSON objects (one per line)
          const lines = streamingText.split('\n')
          const questions: Array<{question: string, answer: string}> = []

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('{')) continue

            try {
              const obj = JSON.parse(trimmed)
              if (obj.question && obj.answer) {
                questions.push(obj)
              } else if (obj.title && obj.description) {
                title = obj.title
                description = obj.description
              }
            } catch {
              // Line isn't complete JSON yet, skip
            }
          }

          if (questions.length > 0) {
            setParsedQuestions(questions)
          }
        },
        async (fullContent) => {
          // Parse all lines to get title, description, and questions
          const lines = fullContent.split('\n')
          const questions: Array<{question: string, answer: string}> = []

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith('{')) continue

            try {
              const obj = JSON.parse(trimmed)
              if (obj.question && obj.answer) {
                questions.push(obj)
              } else if (obj.title && obj.description) {
                title = obj.title
                description = obj.description
              }
            } catch {
              // Skip invalid JSON
            }
          }

          if (!title || !description || questions.length === 0) {
            throw new Error('Failed to parse AI response')
          }

          // Save the study set
          await saveStudySet({
            title,
            description,
            type,
            questions,
          })

          // Redirect to preview
          if (type === 'flashcards') {
            router.push(`/flashcards/preview?title=${encodeURIComponent(title)}`)
          } else {
            router.push(`/quiz/play?title=${encodeURIComponent(title)}`)
          }
        },
        (err) => {
          setError(err.message)
          setLoading(false)
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Create {type === 'flashcards' ? 'Flashcards' : 'Quiz'} from Notes
        </h1>
        <p className="text-gray-600 mb-8">
          Paste your notes and we&apos;ll generate {type === 'flashcards' ? 'flashcards' : 'quiz questions'} from them
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <form onSubmit={handleSubmit} className="card space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="notes" className="label">Your Notes</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input min-h-[200px] resize-y"
                placeholder="Paste your notes here..."
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="quantity" className="label">
                Number of {type === 'flashcards' ? 'Cards' : 'Questions'}
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 10)}
                className="input"
                min={5}
                max={30}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || notes.trim().length < 50}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                `Generate ${type === 'flashcards' ? 'Flashcards' : 'Quiz'}`
              )}
            </button>

            {notes.trim().length > 0 && notes.trim().length < 50 && (
              <p className="text-sm text-gray-500 text-center">
                Please enter at least 50 characters of notes
              </p>
            )}
          </form>

          {/* Live preview of generated flashcards */}
          <div className="card">
            <h2 className="text-xl font-bold text-primary mb-4">
              {loading ? 'Generating...' : 'Preview'}
            </h2>

            {parsedQuestions.length === 0 && !loading && (
              <p className="text-gray-400 text-center py-8">
                Generated flashcards will appear here
              </p>
            )}

            {loading && (
              <div ref={previewRef} className="space-y-3 max-h-[500px] overflow-y-auto">
                {Array.from({ length: quantity }).map((_, idx) => {
                  const isLoaded = idx < parsedQuestions.length
                  const q = parsedQuestions[idx]

                  return isLoaded ? (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
                      <div className="text-sm font-semibold text-primary mb-1">
                        Question {idx + 1}
                      </div>
                      <div className="font-medium mb-2">{q.question}</div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Answer:</span> {q.answer}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
                      <div className="text-sm font-semibold text-gray-300 mb-1">
                        Question {idx + 1}
                      </div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded mb-2 animate-shimmer"></div>
                      <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded w-3/4 animate-shimmer"></div>
                    </div>
                  )
                })}
              </div>
            )}

            {!loading && parsedQuestions.length > 0 && (
              <div ref={previewRef} className="space-y-3 max-h-[500px] overflow-y-auto">
                {parsedQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-sm font-semibold text-primary mb-1">
                      Question {idx + 1}
                    </div>
                    <div className="font-medium mb-2">{q.question}</div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Answer:</span> {q.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && parsedQuestions.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
