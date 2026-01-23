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

export async function updateStudySet(id: number, data: {
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
  const response = await authFetch(`/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update study set')
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

export async function generateContentStream(
  prompt: string,
  onChunk: (content: string) => void,
  onComplete: (fullContent: string) => void,
  onError: (error: Error) => void
) {
  try {
    const response = await authFetch(`/chat/stream?prompt=${encodeURIComponent(prompt)}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate content')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullContent = ''

    if (!reader) {
      throw new Error('No response body')
    }

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            onComplete(fullContent)
            return
          }

          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              throw new Error(parsed.error)
            }
            if (parsed.content) {
              fullContent += parsed.content
              onChunk(parsed.content)
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }

    onComplete(fullContent)
  } catch (error) {
    onError(error as Error)
  }
}
