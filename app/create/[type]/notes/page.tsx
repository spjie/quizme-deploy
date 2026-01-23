'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { generateContentStream, saveStudySet } from '@/lib/api'
import {
  GenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
  BLOOM_LEVELS,
  buildPromptWithOptions,
  BloomLevel,
  LearningMode,
  ReasoningDepth,
  DifficultyLevel
} from '@/lib/generation-options'

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
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS)
  const [isGenerationComplete, setIsGenerationComplete] = useState(false)
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [generatedDescription, setGeneratedDescription] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<Array<{question: string, answer: string}>>([])

  // Auto-scroll to show the latest loaded card (not placeholder)
  useEffect(() => {
    if (previewRef.current && parsedQuestions.length > 0) {
      // Small delay to ensure the new card has rendered
      setTimeout(() => {
        if (previewRef.current) {
          // Scroll to show the last loaded card, not the placeholders
          const cardWidth = 320 + 12 // Card width (w-80 = 320px) + gap (gap-3 = 12px)
          const scrollPosition = Math.max(0, (parsedQuestions.length - 1) * cardWidth)
          previewRef.current.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [parsedQuestions.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setParsedQuestions([])
    setIsGenerationComplete(false)

    try {
      const basePrompt = type === 'flashcards'
        ? `Based on the following notes, generate ${quantity} flashcards. For EACH flashcard, output a separate JSON object on its own line in this format: {"question": "Question text", "answer": "Answer text"}

After all flashcards, output a final line with: {"title": "Topic Title", "description": "Brief description"}

Make questions that test understanding of the key concepts.

Notes:
${notes}`
        : `Based on the following notes, generate a ${quantity} question multiple choice quiz. For EACH question, output a separate JSON object on its own line in this format: {"question": "Question text", "correct_answer": "Correct answer", "incorrect_answers": ["Wrong 1", "Wrong 2", "Wrong 3"]}

After all questions, output a final line with: {"title": "Quiz Title", "description": "Brief description"}

Make questions educational. For multiple choice, create PLAUSIBLE DISTRACTORS that represent common misconceptions or errors.

Notes:
${notes}`

      const prompt = buildPromptWithOptions(basePrompt, options)

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

          // Store the generated data without saving to database
          setGeneratedTitle(title)
          setGeneratedDescription(description)
          setGeneratedQuestions(questions)
          setIsGenerationComplete(true)
          setLoading(false)
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

  const handleContinue = async () => {
    if (generatedTitle && isGenerationComplete && generatedQuestions.length > 0) {
      try {
        // Save the study set to database
        await saveStudySet({
          title: generatedTitle,
          description: generatedDescription,
          type,
          questions: generatedQuestions,
        })

        // Navigate to preview
        if (type === 'flashcards') {
          router.push(`/flashcards/preview?title=${encodeURIComponent(generatedTitle)}`)
        } else {
          router.push(`/quiz/play?title=${encodeURIComponent(generatedTitle)}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save study set')
      }
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Create {type === 'flashcards' ? 'Flashcards' : 'Quiz'} from Notes
        </h1>
        <p className="text-gray-600 mb-8">
          Paste your notes and we&apos;ll generate {type === 'flashcards' ? 'flashcards' : 'quiz questions'} from them
        </p>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Side - Input Form */}
          <form onSubmit={handleSubmit} className="card space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Notes */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="notes" className="label">Your Notes</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input min-h-[350px] resize-y"
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
              </div>

              {/* Right Column - Generation Options */}
              <div className="border-l border-gray-200 pl-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary">Learning Objectives</h3>

                {/* Difficulty Level Slider */}
                <div>
                  <label htmlFor="difficultyLevel" className="label">
                    Difficulty Level: {options.difficultyLevel}/5
                  </label>
                  <input
                    type="range"
                    id="difficultyLevel"
                    min="1"
                    max="5"
                    step="1"
                    value={options.difficultyLevel}
                    onChange={(e) => setOptions({ ...options, difficultyLevel: parseInt(e.target.value) as DifficultyLevel })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    disabled={loading}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Very Easy</span>
                    <span>Easy</span>
                    <span>Moderate</span>
                    <span>Hard</span>
                    <span>Very Hard</span>
                  </div>
                </div>

                {/* Bloom's Taxonomy Level */}
                <div>
                  <label htmlFor="bloomLevel" className="label">Bloom&apos;s Taxonomy Level</label>
                  <select
                    id="bloomLevel"
                    value={options.bloomLevel}
                    onChange={(e) => setOptions({ ...options, bloomLevel: e.target.value as BloomLevel })}
                    className="input text-sm"
                    disabled={loading}
                  >
                    {BLOOM_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label} - {level.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Learning Mode */}
                <div>
                  <label htmlFor="learningMode" className="label">Learning Mode</label>
                  <select
                    id="learningMode"
                    value={options.learningMode}
                    onChange={(e) => setOptions({ ...options, learningMode: e.target.value as LearningMode })}
                    className="input text-sm"
                    disabled={loading}
                  >
                    <option value="fact-recall">Fact Recall - Test memorization of specific information</option>
                    <option value="conceptual">Conceptual Understanding - Test deeper comprehension</option>
                  </select>
                </div>

                {/* Reasoning Depth */}
                <div>
                  <label htmlFor="reasoningDepth" className="label">Reasoning Depth</label>
                  <select
                    id="reasoningDepth"
                    value={options.reasoningDepth}
                    onChange={(e) => setOptions({ ...options, reasoningDepth: e.target.value as ReasoningDepth })}
                    className="input text-sm"
                    disabled={loading}
                  >
                    <option value="single-step">Single-step - Direct, focused questions</option>
                    <option value="multi-step">Multi-step - Complex, multi-part reasoning</option>
                  </select>
                </div>

                {/* Exam Prep Mode */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="examPrepMode"
                    checked={options.examPrepMode}
                    onChange={(e) => setOptions({ ...options, examPrepMode: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    disabled={loading}
                  />
                  <label htmlFor="examPrepMode" className="text-sm text-primary font-medium">
                    Exam Prep Mode (more rigorous, exam-style questions)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || notes.trim().length < 50}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : (
                  `Generate ${type === 'flashcards' ? 'Flashcards' : 'Quiz'}`
                )}
              </button>
            </div>

            {notes.trim().length > 0 && notes.trim().length < 50 && (
              <p className="text-sm text-gray-500 text-center">
                Please enter at least 50 characters of notes
              </p>
            )}
          </form>

          {/* Right Side - Preview */}
          <div className="card flex flex-col">
            <h2 className="text-xl font-bold text-primary mb-4">
              {loading ? 'Generating...' : 'Preview'}
            </h2>

            {parsedQuestions.length === 0 && !loading && (
              <div className="flex-grow flex items-center justify-center">
                <p className="text-gray-400 text-center">
                  Generated flashcards will appear here
                </p>
              </div>
            )}

            {loading && (
              <div ref={previewRef} className="flex gap-3 max-w-full overflow-x-auto pb-4 flex-grow">
                {Array.from({ length: quantity }).map((_, idx) => {
                  const isLoaded = idx < parsedQuestions.length
                  const q = parsedQuestions[idx]

                  return isLoaded ? (
                    <div key={idx} className="flex-shrink-0 w-80 h-full p-6 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in flex flex-col">
                      <div className="text-sm font-semibold text-primary mb-3">
                        Question {idx + 1}
                      </div>
                      <div className="font-medium mb-4 flex-grow overflow-y-auto">{q.question}</div>
                      <div className="text-sm text-gray-600 border-t border-gray-200 pt-3">
                        <span className="font-medium">Answer:</span> {q.answer}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex-shrink-0 w-80 h-full p-6 bg-gray-50 rounded-lg border border-gray-200 animate-pulse flex flex-col">
                      <div className="text-sm font-semibold text-gray-300 mb-3">
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
              <div ref={previewRef} className="flex gap-3 max-w-full overflow-x-auto pb-4 flex-grow">
                {parsedQuestions.map((q, idx) => (
                  <div key={idx} className="flex-shrink-0 w-80 h-full p-6 bg-gray-50 rounded-lg border border-gray-200 flex flex-col">
                    <div className="text-sm font-semibold text-primary mb-3">
                      Question {idx + 1}
                    </div>
                    <div className="font-medium mb-4 flex-grow overflow-y-auto">{q.question}</div>
                    <div className="text-sm text-gray-600 border-t border-gray-200 pt-3">
                      <span className="font-medium">Answer:</span> {q.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && parsedQuestions.length === 0 && (
              <div className="flex-grow flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Continue Button */}
            <div className="flex justify-end mt-6">
              <button
                onClick={handleContinue}
                disabled={!isGenerationComplete}
                className="btn-primary px-6 py-2 disabled:opacity-50"
              >
                {isGenerationComplete ? 'Looks Good →' : loading ? 'Generating...' : 'Looks Good →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
