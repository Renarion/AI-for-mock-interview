import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TaskSelection {
  specialization: string
  experienceLevel: string
  companyTier: string
  topic: string
}

export interface Task {
  task_id: number
  task_question: string
  task_number: number
  total_tasks: number
  time_limit_minutes: number
}

export interface TaskFeedback {
  task_id: number
  task_question: string
  user_answer: string
  score: number
  strengths: string[]
  improvements: string[]
  detailed_feedback: string
}

export interface FinalReportData {
  session_id: string
  overall_score: number
  task_feedbacks: TaskFeedback[]
  overall_strengths: string[]
  areas_to_improve: string[]
  study_recommendations: string[]
  motivational_message: string
  completed_at: string
}

interface InterviewState {
  // Selection
  selection: TaskSelection | null
  setSelection: (selection: TaskSelection) => void
  
  // Session
  sessionId: string | null
  setSessionId: (id: string) => void
  
  // Tasks
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
  currentTaskIndex: number
  setCurrentTaskIndex: (index: number) => void
  
  // Answers and feedbacks
  answers: { taskId: number; answer: string }[]
  addAnswer: (taskId: number, answer: string) => void
  feedbacks: TaskFeedback[]
  addFeedback: (feedback: TaskFeedback) => void
  
  // Final report
  finalReport: FinalReportData | null
  setFinalReport: (report: FinalReportData) => void
  
  // User status
  hasTrialAvailable: boolean
  paidQuestionsRemaining: number
  setUserStatus: (hasTrial: boolean, paidQuestions: number) => void
  
  // Reset
  resetInterview: () => void
}

const initialState = {
  selection: null,
  sessionId: null,
  tasks: [],
  currentTaskIndex: 0,
  answers: [],
  feedbacks: [],
  finalReport: null,
  hasTrialAvailable: true,
  paidQuestionsRemaining: 0,
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSelection: (selection) => set({ selection }),
      
      setSessionId: (sessionId) => set({ sessionId }),
      
      setTasks: (tasks) => set({ tasks }),
      
      setCurrentTaskIndex: (currentTaskIndex) => set({ currentTaskIndex }),
      
      addAnswer: (taskId, answer) =>
        set((state) => ({
          answers: [...state.answers, { taskId, answer }],
        })),
      
      addFeedback: (feedback) =>
        set((state) => ({
          feedbacks: [...state.feedbacks, feedback],
        })),
      
      setFinalReport: (finalReport) => set({ finalReport }),
      
      setUserStatus: (hasTrialAvailable, paidQuestionsRemaining) =>
        set({ hasTrialAvailable, paidQuestionsRemaining }),
      
      resetInterview: () =>
        set({
          selection: null,
          sessionId: null,
          tasks: [],
          currentTaskIndex: 0,
          answers: [],
          feedbacks: [],
          finalReport: null,
        }),
    }),
    {
      name: 'interview-storage',
      partialize: (state) => ({
        selection: state.selection,
        sessionId: state.sessionId,
        tasks: state.tasks,
        currentTaskIndex: state.currentTaskIndex,
        answers: state.answers,
        feedbacks: state.feedbacks,
        hasTrialAvailable: state.hasTrialAvailable,
        paidQuestionsRemaining: state.paidQuestionsRemaining,
      }),
    }
  )
)
