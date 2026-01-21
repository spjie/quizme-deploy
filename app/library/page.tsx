'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import StudySetCard from '@/components/StudySetCard'
import { listStudySets, deleteStudySet } from '@/lib/api'

type StudySet = {
  title: string
  description: string
}

export default function LibraryPage() {
  const [studySets, setStudySets] = useState<StudySet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStudySets()
  }, [])

  const loadStudySets = async () => {
    try {
      const data = await listStudySets()
      setStudySets(data.files || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load study sets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (title: string) => {
    try {
      await deleteStudySet(title)
      setStudySets(studySets.filter(s => s.title !== title))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete study set')
    }
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-primary mb-8">My Library</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner" />
          </div>
        ) : studySets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-primary mb-2">No study sets yet</h2>
            <p className="text-gray-600 mb-6">Create your first study set to get started!</p>
            <Link href="/create/flashcards/select" className="btn-primary">
              Create Flashcards
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {studySets.map((set) => (
              <StudySetCard
                key={set.title}
                title={set.title}
                description={set.description}
                onDelete={() => handleDelete(set.title)}
              />
            ))}
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
