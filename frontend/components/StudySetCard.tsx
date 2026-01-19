'use client'

import { useState } from 'react'
import Link from 'next/link'

type StudySetCardProps = {
  title: string
  description: string
  type: 'flashcards' | 'quiz'
  onDelete: () => void
}

export default function StudySetCard({ title, description, type, onDelete }: StudySetCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const previewLink = type === 'flashcards'
    ? `/flashcards/preview?title=${encodeURIComponent(title)}`
    : `/quiz/play?title=${encodeURIComponent(title)}`

  const editLink = `/edit?title=${encodeURIComponent(title)}`

  return (
    <>
      <div className="card hover:shadow-lg transition-shadow relative">
        {/* Dropdown menu */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg py-2 z-10">
              <Link
                href={editLink}
                className="block px-4 py-2 hover:bg-gray-100 text-primary"
                onClick={() => setShowMenu(false)}
              >
                Edit
              </Link>
              <button
                onClick={() => {
                  setShowMenu(false)
                  setShowDeleteModal(true)
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <Link href={previewLink}>
          <div className="pr-12">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                type === 'flashcards'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {type === 'flashcards' ? 'Flashcards' : 'Quiz'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
          </div>
        </Link>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-2">Delete Study Set?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  onDelete()
                }}
                className="flex-1 bg-red-500 text-white px-6 py-2 rounded-full font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
