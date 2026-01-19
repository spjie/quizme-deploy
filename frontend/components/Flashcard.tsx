'use client'

import { useState } from 'react'

type FlashcardProps = {
  question: string
  answer: string
  onFlip?: (isFlipped: boolean) => void
}

export default function Flashcard({ question, answer, onFlip }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    const newFlipped = !isFlipped
    setIsFlipped(newFlipped)
    onFlip?.(newFlipped)
  }

  return (
    <div
      className="flashcard w-full h-80 cursor-pointer"
      onClick={handleFlip}
    >
      <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="flashcard-front card bg-white flex items-center justify-center p-8">
          <p className="text-xl text-center text-primary">{question}</p>
        </div>
        <div className="flashcard-back card bg-secondary flex items-center justify-center p-8">
          <p className="text-xl text-center text-primary">{answer}</p>
        </div>
      </div>
    </div>
  )
}

// Simple card display (non-flipping) for preview
export function FlashcardPreview({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="card bg-white p-4">
      <p className="font-medium text-primary mb-2">{question}</p>
      <p className="text-gray-600 text-sm">{answer}</p>
    </div>
  )
}
