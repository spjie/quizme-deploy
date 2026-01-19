import { supabase } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export async function authFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  return response
}

// API helper functions
export async function saveStudySet(data: {
  title: string
  description: string
  type: 'flashcards' | 'quiz'
  questions: Array<{
    question: string
    answer?: string
    correct_answer?: string
    incorrect_answers?: string[]
  }>
}) {
  const response = await authFetch('/save', {
    method: 'POST',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save study set')
  }

  return response.json()
}

export async function openStudySet(identifier: string) {
  const response = await authFetch(`/open/${encodeURIComponent(identifier)}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to open study set')
  }

  return response.json()
}

export async function listStudySets() {
  const response = await authFetch('/list-jsons')

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to list study sets')
  }

  return response.json()
}

export async function deleteStudySet(identifier: string) {
  const response = await authFetch(`/delete/${encodeURIComponent(identifier)}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete study set')
  }

  return response.json()
}

export async function generateContent(prompt: string) {
  const response = await authFetch(`/chat?prompt=${encodeURIComponent(prompt)}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate content')
  }

  return response.json()
}
