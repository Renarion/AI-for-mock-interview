const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: object
  token?: string
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new ApiError(response.status, error.detail || 'Request failed')
  }
  
  return response.json()
}

// Auth API
export const authApi = {
  getStatus: (token: string) =>
    apiRequest<{
      is_authenticated: boolean
      has_trial: boolean
      questions_remaining: number
      user_type: string
    }>('/auth/status', { token }),
  
  register: (token: string, data: { clerk_user_id: string; os?: string; country?: string }) =>
    apiRequest('/auth/register', { method: 'POST', body: data, token }),
}

// Interview API
export const interviewApi = {
  getSpecializations: () =>
    apiRequest<{ specializations: { id: string; name: string }[] }>('/interview/specializations'),
  
  getExperienceLevels: () =>
    apiRequest<{ levels: { id: string; name: string }[] }>('/interview/experience-levels'),
  
  getCompanyTiers: () =>
    apiRequest<{ tiers: { id: string; name: string; description: string }[] }>('/interview/company-tiers'),
  
  getTopics: () =>
    apiRequest<{ topics: { id: string; name: string }[] }>('/interview/topics'),
  
  startInterview: (
    token: string,
    selection: {
      specialization: string
      experience_level: string
      company_tier: string
      topic: string
    }
  ) =>
    apiRequest<{
      session_id: string
      tasks: Array<{
        task_id: number
        task_question: string
        task_number: number
        total_tasks: number
        time_limit_minutes: number
      }>
      message: string
    }>('/interview/start', { method: 'POST', body: selection, token }),
  
  getSession: (token: string, sessionId: string) =>
    apiRequest<{
      session_id: string
      status: string
      current_task: {
        task_id: number
        task_question: string
        task_number: number
        total_tasks: number
        time_limit_minutes: number
      } | null
      tasks_completed: number
      tasks_remaining: number
      can_continue: boolean
      feedbacks: Array<{
        task_id: number
        score: number
        strengths: string[]
        improvements: string[]
        detailed_feedback: string
      }>
    }>(`/interview/session/${sessionId}`, { token }),
  
  getCurrentTask: (token: string, sessionId: string) =>
    apiRequest<{
      task_id: number
      task_question: string
      task_number: number
      total_tasks: number
      time_limit_minutes: number
    }>(`/interview/session/${sessionId}/task`, { token }),
  
  submitAnswer: (
    token: string,
    sessionId: string,
    data: {
      session_id: string
      task_id: number
      answer: string
      time_spent_seconds?: number
    }
  ) =>
    apiRequest<{
      feedback: {
        task_id: number
        task_question: string
        user_answer: string
        score: number
        strengths: string[]
        improvements: string[]
        detailed_feedback: string
      }
      can_continue: boolean
      tasks_completed: number
      tasks_remaining: number
    }>(`/interview/session/${sessionId}/answer`, { method: 'POST', body: data, token }),
  
  finishInterview: (token: string, sessionId: string) =>
    apiRequest<{
      session_id: string
      overall_score: number
      task_feedbacks: Array<{
        task_id: number
        task_question: string
        user_answer: string
        score: number
        strengths: string[]
        improvements: string[]
        detailed_feedback: string
      }>
      overall_strengths: string[]
      areas_to_improve: string[]
      study_recommendations: string[]
      motivational_message: string
      completed_at: string
    }>(`/interview/session/${sessionId}/finish`, { method: 'POST', token }),
}

// Payment API
export const paymentApi = {
  getPlans: () =>
    apiRequest<{
      plans: Array<{
        plan_id: string
        name: string
        questions_count: number
        price: number
        currency: string
        description: string
      }>
    }>('/payment/plans'),
  
  createPayment: (token: string, planId: string, returnUrl?: string) =>
    apiRequest<{
      payment_id: string
      confirmation_url: string
      status: string
      amount: number
      currency: string
    }>('/payment/create', {
      method: 'POST',
      body: { plan_id: planId, return_url: returnUrl },
      token,
    }),
  
  mockCompletePayment: (token: string, paymentId: string) =>
    apiRequest<{ status: string; message: string }>(`/payment/mock-complete/${paymentId}`, {
      method: 'POST',
      token,
    }),
}

export { ApiError }
