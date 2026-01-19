'use client'

import { useRouter } from 'next/navigation'

type CreateModalProps = {
  type: 'flashcards' | 'quiz'
  onClose: () => void
}

export default function CreateModal({ type, onClose }: CreateModalProps) {
  const router = useRouter()

  const handleSelect = () => {
    onClose()
    router.push(`/create/${type}/select`)
  }

  const handleNotes = () => {
    onClose()
    router.push(`/create/${type}/notes`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-primary mb-2">
          Create {type === 'flashcards' ? 'Flashcards' : 'Quiz'}
        </h2>
        <p className="text-gray-600 mb-6">
          Choose how you want to create your {type === 'flashcards' ? 'flashcards' : 'quiz'}
        </p>

        <div className="space-y-4">
          <button
            onClick={handleSelect}
            className="w-full p-4 border-2 border-primary rounded-xl text-left hover:bg-secondary/50 transition-colors"
          >
            <h3 className="font-semibold text-primary mb-1">From Select</h3>
            <p className="text-sm text-gray-600">
              Choose a subject and topic, and we&apos;ll generate {type === 'flashcards' ? 'flashcards' : 'quiz questions'} for you
            </p>
          </button>

          <button
            onClick={handleNotes}
            className="w-full p-4 border-2 border-primary rounded-xl text-left hover:bg-secondary/50 transition-colors"
          >
            <h3 className="font-semibold text-primary mb-1">From Notes</h3>
            <p className="text-sm text-gray-600">
              Paste your notes and we&apos;ll create {type === 'flashcards' ? 'flashcards' : 'quiz questions'} from them
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
