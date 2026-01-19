'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { generateContent, saveStudySet } from '@/lib/api'

export default function NotesPage() {
  const params = useParams()
  const type = params.type as 'flashcards' | 'quiz'
  const router = useRouter()

  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const prompt = type === 'flashcards'
        ? `Based on the following notes, generate ${quantity} flashcards. Return a JSON object with this exact format: {"title": "Topic Title based on the notes", "description": "Brief description of what these flashcards cover", "questions": [{"question": "Question text", "answer": "Answer text"}]}. Make questions that test understanding of the key concepts.\n\nNotes:\n${notes}`
        : `Based on the following notes, generate a ${quantity} question multiple choice quiz. Return a JSON object with this exact format: {"title": "Quiz Title based on the notes", "description": "Brief description of what this quiz covers", "questions": [{"question": "Question text", "correct_answer": "Correct answer", "incorrect_answers": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"]}]}. Make questions that test understanding of the key concepts.\n\nNotes:\n${notes}`

      const response = await generateContent(prompt)

      // Parse the AI response
      let data
      try {
        // Try to extract JSON from the response
        const jsonMatch = response.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          data = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch {
        throw new Error('Failed to parse AI response')
      }

      // Save the study set
      await saveStudySet({
        title: data.title,
        description: data.description,
        type,
        questions: data.questions,
      })

      // Redirect to preview
      if (type === 'flashcards') {
        router.push(`/flashcards/preview?title=${encodeURIComponent(data.title)}`)
      } else {
        router.push(`/quiz/play?title=${encodeURIComponent(data.title)}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Create {type === 'flashcards' ? 'Flashcards' : 'Quiz'} from Notes
        </h1>
        <p className="text-gray-600 mb-8">
          Paste your notes and we&apos;ll generate {type === 'flashcards' ? 'flashcards' : 'quiz questions'} from them
        </p>

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
      </div>
    </AuthGuard>
  )
}
