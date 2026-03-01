// Types matching the API response from /api/assessment/results/:id

export interface QuestionAnswer {
  question_id: string
  question_title: string
  question_suite: string | null
  question_sequence: number
  is_reflection: boolean
  reflection_prompt: string | null
  element: string
  max_score: number
  is_answered: boolean
  answer_id: string | null
  answer_value: number | null
  answer_text: string | null
  answer_option_id: string | null
  answer_explanation?: string | null
  option_number?: number | null
  text_answer: string | null
  numeric_value: number | null
}

export interface ElementScore {
  element: string
  total_questions: number
  answered_questions: number
  completion_percentage: number
  scores: {
    total_score: number
    max_score: number
    percentage: number
  }
  question_answers: QuestionAnswer[]
}

export interface Insight {
  type: string
  message: string
  positive: boolean
}

export interface AssessmentResultsData {
  instance: {
    id: string
    created_at: string | null
    updated_at: string | null
    completed: boolean
    completed_at: string | null
    responder_name: string | null
    element: string
  }
  total_questions: number
  answered_questions: number
  completion_percentage: number
  scores: {
    element: string
    total_score: number
    max_score: number
    percentage: number
  }
  element_scores: Record<string, ElementScore>
  insights: Insight[]
}
