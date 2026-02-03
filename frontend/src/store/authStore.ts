import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface UserMe {
  user_id: string
  name: string
  email: string
  telegram_username: string | null
  password_masked: string
  questions_remaining: number
  trial_question_flg: boolean
  paid_questions_number_left: number
}

interface AuthState {
  token: string | null
  user: UserMe | null
  setToken: (token: string | null) => void
  setUser: (user: UserMe | null) => void
  logout: () => void
  fetchUser: () => Promise<void>
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setToken: (token) => {
        set({ token })
        if (token) {
          get().fetchUser().catch(() => set({ user: null }))
        } else {
          set({ user: null })
        }
      },

      setUser: (user) => set({ user }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mock_interview_token')
        }
        set({ token: null, user: null })
      },

      fetchUser: async () => {
        const { token } = get()
        if (!token) {
          set({ user: null })
          return
        }
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          set({ user: null, token: null })
          if (typeof window !== 'undefined') {
            localStorage.removeItem('mock_interview_token')
          }
          return
        }
        const user: UserMe = await res.json()
        set({ user })
      },

      isAuthenticated: () => !!get().token && !!get().user,
    }),
    {
      name: 'mock_interview_token',
      partialize: (state) => ({ token: state.token }),
    }
  )
)
