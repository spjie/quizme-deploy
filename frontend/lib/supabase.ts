import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type StudySet = {
  id: string
  user_id: string
  title: string
  description: string
  type: 'flashcards' | 'quiz'
  created_at: string
  updated_at: string
}

export type FlashcardQuestion = {
  id: string
  study_set_id: string
  question: string
  answer: string
  order_index: number
}

export type QuizQuestion = {
  id: string
  study_set_id: string
  question: string
  correct_answer: string
  incorrect_answers: string[]
  order_index: number
}
