'use client'

import { useState } from 'react'

type QuizQuestionProps = {
  question: string
  correctAnswer: string
  incorrectAnswers: string[]
  onAnswer: (isCorrect: boolean) => void
  showResult: boolean
}

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export default function QuizQuestion({
  question,
  correctAnswer,
  incorrectAnswers,
  onAnswer,
  showResult,
}: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [options] = useState(() =>
    shuffleArray([correctAnswer, ...incorrectAnswers])
  )

  const handleSelect = (option: string) => {
    if (showResult) return
    setSelectedAnswer(option)
  }

  const handleSubmit = () => {
    if (!selectedAnswer) return
    onAnswer(selectedAnswer === correctAnswer)
  }

  return (
    <div className="card">
      <p className="text-xl text-primary mb-6">{question}</p>

      <div className="space-y-3 mb-6">
        {options.map((option, index) => {
          let buttonClass = 'w-full p-4 rounded-xl border-2 text-left transition-colors '

          if (showResult) {
            if (option === correctAnswer) {
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
              onClick={() => handleSelect(option)}
              disabled={showResult}
              className={buttonClass}
            >
              {option}
            </button>
          )
        })}
      </div>

      {!showResult && (
        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer}
          className="btn-primary w-full disabled:opacity-50"
        >
          Submit Answer
        </button>
      )}
    </div>
  )
}
