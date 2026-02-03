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
    const error = await response.json().catch(() => ({}))
    let msg: string
    if (response.status >= 500) {
      msg = 'Сервер временно недоступен. Попробуйте позже.'
    } else if (error?.detail) {
      msg = Array.isArray(error.detail)
        ? (error.detail[0]?.msg ?? 'Ошибка запроса')
        : String(error.detail)
    } else {
      msg = 'Ошибка запроса'
    }
    throw new ApiError(response.status, msg)
  }
  
  return response.json()
}

// Auth API
export const authApi = {
  getStatus: (token: string | null) =>
    apiRequest<{
      is_authenticated: boolean
      has_trial: boolean
      questions_remaining: number
      user_type: string
    }>('/auth/status', { token: token || undefined }),
  
  register: (data: { name: string; email: string; telegram_username?: string; password: string }) =>
    apiRequest<{ access_token: string; user: { user_id: string; name: string; email: string; telegram_username: string | null; questions_remaining: number } }>(
      '/auth/register',
      { method: 'POST', body: data }
    ),
  
  login: (data: { login: string; password: string }) =>
    apiRequest<{ access_token: string; user: { user_id: string; name: string; email: string; telegram_username: string | null; questions_remaining: number } }>(
      '/auth/login',
      { method: 'POST', body: data }
    ),
  
  getMe: (token: string) =>
    apiRequest<{
      user_id: string
      name: string
      email: string
      telegram_username: string | null
      password_masked: string
      questions_remaining: number
      trial_question_flg: boolean
      paid_questions_number_left: number
    }>('/auth/me', { token }),
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
