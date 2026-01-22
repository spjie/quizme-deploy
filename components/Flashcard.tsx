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
export function FlashcardPreview({
  question,
  answer,
  onRefine
}: {
  question: string
  answer: string
  onRefine?: (action: 'harder' | 'simplify' | 'rephrase') => void
}) {
  const [isRefining, setIsRefining] = useState(false)

  const handleRefine = async (action: 'harder' | 'simplify' | 'rephrase') => {
    setIsRefining(true)
    try {
      await onRefine?.(action)
    } finally {
      setIsRefining(false)
    }
  }

  return (
    <div className="card bg-white p-4">
      <div className="flex justify-between items-start mb-2">
        <p className="font-medium text-primary flex-1">{question}</p>
        {onRefine && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => handleRefine('harder')}
              disabled={isRefining}
              className="text-xs px-2 py-1 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
              title="Make harder"
            >
              Harder
            </button>
            <button
              onClick={() => handleRefine('simplify')}
              disabled={isRefining}
              className="text-xs px-2 py-1 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
              title="Simplify"
            >
              Simplify
            </button>
            <button
              onClick={() => handleRefine('rephrase')}
              disabled={isRefining}
              className="text-xs px-2 py-1 border border-primary text-primary rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-50"
              title="Rephrase"
            >
              Rephrase
            </button>
          </div>
        )}
      </div>
      <p className="text-gray-600 text-sm">{answer}</p>
      {isRefining && (
        <div className="mt-2 text-xs text-primary flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Regenerating...
        </div>
      )}
    </div>
  )
}
