'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { generateContent, saveStudySet } from '@/lib/api'

const SUBJECTS = [
  'Math',
  'Science',
  'History',
  'English',
  'Geography',
  'Computer Science',
  'Foreign Language',
  'Art',
  'Music',
  'Other'
]

const GRADE_LEVELS = [
  'Elementary (K-5)',
  'Middle School (6-8)',
  'High School (9-12)',
  'College/University',
  'Professional'
]

export default function SelectPage() {
  const params = useParams()
  const type = params.type as 'flashcards' | 'quiz'
  const router = useRouter()

  const [subject, setSubject] = useState('')
  const [topic, setTopic] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [quantity, setQuantity] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const prompt = type === 'flashcards'
        ? `Generate ${quantity} flashcards about ${topic} for ${gradeLevel} level ${subject}. Return a JSON object with this exact format: {"title": "Topic Title", "description": "Brief description", "questions": [{"question": "Question text", "answer": "Answer text"}]}. Make questions educational and appropriate for the grade level.`
        : `Generate a ${quantity} question multiple choice quiz about ${topic} for ${gradeLevel} level ${subject}. Return a JSON object with this exact format: {"title": "Quiz Title", "description": "Brief description", "questions": [{"question": "Question text", "correct_answer": "Correct answer", "incorrect_answers": ["Wrong answer 1", "Wrong answer 2", "Wrong answer 3"]}]}. Make questions educational and appropriate for the grade level.`

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
          Create {type === 'flashcards' ? 'Flashcards' : 'Quiz'}
        </h1>
        <p className="text-gray-600 mb-8">
          Select a subject and topic to generate {type === 'flashcards' ? 'flashcards' : 'quiz questions'}
        </p>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="subject" className="label">Subject</label>
            <select
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a subject</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="topic" className="label">Topic</label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input"
              placeholder="e.g., Photosynthesis, World War II, Algebra"
              required
            />
          </div>

          <div>
            <label htmlFor="gradeLevel" className="label">Grade Level</label>
            <select
              id="gradeLevel"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="input"
              required
            >
              <option value="">Select grade level</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
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
            disabled={loading}
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
        </form>
      </div>
    </AuthGuard>
  )
}
