'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useInterviewStore, TaskFeedback } from '@/store/interviewStore'
import { interviewApi } from '@/lib/api'

interface InterviewChatProps {
  onComplete: () => void
  onPaymentRequired: () => void
}

type ChatMessage = {
  id: string
  type: 'system' | 'task' | 'user' | 'feedback' | 'loading'
  content: string
  feedback?: TaskFeedback
  taskNumber?: number
}

export default function InterviewChat({ onComplete, onPaymentRequired }: InterviewChatProps) {
  const token = useAuthStore((s) => s.token)
  const {
    sessionId,
    tasks,
    currentTaskIndex,
    setCurrentTaskIndex,
    addAnswer,
    setFinalReport,
  } = useInterviewStore()
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const MAX_CHARS = 3000
  const TIME_LIMIT_MINUTES = 20
  /** Высота fixed-шапки + safe-area; синхронно с отступом main и scroll-margin у задач */
  const headerOffset =
    'calc(0.5rem + 3.5rem + env(safe-area-inset-top, 0px))'

  // Если в persist остался currentTaskIndex >= длины tasks — выравниваем
  useEffect(() => {
    if (tasks.length > 0 && currentTaskIndex >= tasks.length) {
      setCurrentTaskIndex(0)
    }
  }, [tasks, currentTaskIndex, setCurrentTaskIndex])

  // Initialize with first task
  useEffect(() => {
    if (tasks.length > 0 && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'system',
        content: `Добро пожаловать на мок-интервью! 🎯\n\nВам предстоит решить ${tasks.length} ${tasks.length === 1 ? 'задачу' : tasks.length < 5 ? 'задачи' : 'задач'}. Постарайтесь уложиться в ${TIME_LIMIT_MINUTES} минут на каждую. Между задачами ответов от ИИ не будет — один общий разбор вы получите после последнего ответа.`,
      }
      
      const taskMessage: ChatMessage = {
        id: `task-${tasks[0].task_id}`,
        type: 'task',
        content: tasks[0].task_question,
        taskNumber: 1,
      }
      
      setMessages([welcomeMessage, taskMessage])
      setStartTime(Date.now())
    }
  }, [tasks])

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    
    return () => clearInterval(timer)
  }, [startTime])

  // Прокрутка: последний блок «Задача» — в зону видимости над фиксированным футером
  useEffect(() => {
    const tasks = messages.filter((m) => m.type === 'task')
    const last = tasks[tasks.length - 1]
    if (!last) return
    const t = window.setTimeout(() => {
      document.getElementById(`chat-task-${last.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }, 80)
    return () => window.clearTimeout(t)
  }, [messages])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isOverTime = elapsedTime > TIME_LIMIT_MINUTES * 60

  const handleSubmitAnswer = async () => {
    if (!inputValue.trim() || isSubmitting) return

    if (!sessionId) {
      setError('Сессия интервью не найдена. Вернитесь на главную и начните заново.')
      return
    }
    const answerText = inputValue.trim()
    
    setIsSubmitting(true)
    setError(null)
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: answerText,
    }
    
    // Add loading message
    const loadingMessage: ChatMessage = {
      id: 'loading',
      type: 'loading',
      content: 'Сохраняем ответ...',
    }
    
    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setInputValue('')
    
    try {
      if (!token) throw new Error('Требуется авторизация')
      const serverTask = await interviewApi.getCurrentTask(token, sessionId)
      const currentTask = tasks.find((t) => t.task_id === serverTask.task_id)
      
      const response = await interviewApi.submitAnswer(token, sessionId, {
        session_id: sessionId,
        task_id: serverTask.task_id,
        answer: answerText,
        time_spent_seconds: elapsedTime,
      })
      
      // Save to store
      addAnswer(serverTask.task_id, answerText)
      
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'))
      
      useAuthStore.getState().fetchUser()
      
      if (response.can_continue && response.tasks_remaining > 0) {
        const nextTask = await interviewApi.getCurrentTask(token, sessionId)
        setCurrentTaskIndex(Math.max(0, nextTask.task_number - 1))
        const nextTaskMessage: ChatMessage = {
          id: `task-${nextTask.task_id}`,
          type: 'task',
          content: nextTask.task_question,
          taskNumber: nextTask.task_number,
        }
        setMessages((prev) =>
          prev.some((m) => m.id === nextTaskMessage.id) ? prev : [...prev, nextTaskMessage]
        )
        setStartTime(Date.now())
        setElapsedTime(0)
      } else {
        const finalLoading: ChatMessage = {
          id: 'final-loading',
          type: 'loading',
          content: 'Готовим развёрнутый фидбек по всем задачам...',
        }
        setMessages((prev) => [...prev, finalLoading])
        await handleFinishInterview()
        setMessages((prev) => prev.filter((m) => m.id !== 'final-loading'))
      }
    } catch (err) {
      console.error('Failed to submit answer:', err)
      setMessages((prev) => prev.filter((m) => m.id !== 'loading'))
      setError(err instanceof Error ? err.message : 'Произошла ошибка. Попробуйте ещё раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinishInterview = async () => {
    if (!sessionId) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      if (!token) throw new Error('Требуется авторизация')
      
      const report = await interviewApi.finishInterview(token, sessionId)
      setFinalReport(report)
      useAuthStore.getState().fetchUser()
      onComplete()
    } catch (err) {
      console.error('Failed to finish interview:', err)
      setError(err instanceof Error ? err.message : 'Не удалось завершить интервью. Попробуйте ещё раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitAnswer()
    }
  }

  return (
    <div className="flex h-[100dvh] w-full flex-1 flex-col overflow-hidden">
      {/* Шапка: закреплена к верху экрана (как футер снизу) */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-white/10 pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white/60">
              Задача {currentTaskIndex + 1} из {tasks.length}
            </span>
          </div>
          
          <div className={`flex items-center gap-2 ${isOverTime ? 'text-red-400' : 'text-white/60'}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-mono">{formatTime(elapsedTime)}</span>
            {isOverTime && <span className="text-xs">(превышено {TIME_LIMIT_MINUTES} мин)</span>}
          </div>
        </div>
      </header>

      {/* Messages: только эта область скроллится; отступы под fixed-шапку и fixed-футер */}
      <main
        style={{ paddingTop: headerOffset }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-[calc(14rem+env(safe-area-inset-bottom,0px))] scroll-smooth touch-pan-y"
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                id={message.type === 'task' ? `chat-task-${message.id}` : undefined}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`${
                  message.type === 'user' ? 'ml-auto max-w-[80%]' : 'max-w-[90%]'
                }`}
                style={
                  message.type === 'task' ? { scrollMarginTop: headerOffset } : undefined
                }
              >
                {message.type === 'task' && (
                  <div className="glass p-6 rounded-2xl border-l-4 border-primary">
                    <div className="flex items-center gap-2 mb-3 text-primary">
                      <span className="text-lg font-semibold">Задача {message.taskNumber}</span>
                    </div>
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {message.type === 'user' && (
                  <div className="glass p-4 rounded-2xl bg-primary/20">
                    <p className="text-white whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
                
                {message.type === 'feedback' && message.feedback && (
                  <div className="glass p-6 rounded-2xl border-l-4 border-secondary">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-secondary">
                        Фидбек по задаче {message.taskNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white">
                          {message.feedback.score}
                        </span>
                        <span className="text-white/60">/100</span>
                      </div>
                    </div>
                    
                    {message.feedback.strengths.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-green-400 font-medium mb-2">✅ Сильные стороны:</h4>
                        <ul className="list-disc list-inside space-y-1 text-white/80">
                          {message.feedback.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {message.feedback.improvements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-yellow-400 font-medium mb-2">💡 Что улучшить:</h4>
                        <ul className="list-disc list-inside space-y-1 text-white/80">
                          {message.feedback.improvements.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.feedback.detailed_feedback}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {message.type === 'system' && (
                  <div className="glass p-4 rounded-2xl bg-white/5">
                    <p className="text-white/80 whitespace-pre-wrap">{message.content}</p>
                  </div>
                )}
                
                {message.type === 'loading' && (
                  <div className="glass p-4 rounded-2xl flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-white/60">{message.content}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          <div ref={messagesEndRef} className="h-2 shrink-0" aria-hidden />
        </div>
      </main>

      {/* Input area: закреплён к низу viewport, лента сообщений скроллится отдельно */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10 pb-[max(1rem,env(safe-area-inset-bottom))] pt-0">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {error && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="text-white/60 hover:text-white">
                  ✕
                </button>
              </div>
            )}
            
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                placeholder="Напишите ваш ответ... (Shift+Enter для новой строки)"
                disabled={isSubmitting}
                rows={3}
                className="w-full p-4 pr-24 rounded-xl bg-background-elevated border border-white/10 focus:border-primary/50 focus:outline-none resize-none text-white placeholder-white/40"
              />
              
              <div className="absolute bottom-3 right-3 flex items-center gap-3">
                <span className={`text-xs ${inputValue.length >= MAX_CHARS ? 'text-red-400' : 'text-white/40'}`}>
                  {inputValue.length}/{MAX_CHARS}
                </span>
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!inputValue.trim() || isSubmitting}
                  className="relative z-10 p-2 rounded-lg bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <p className="mt-2 text-xs text-white/40 text-center">
              💡 Совет: отвечайте кратко и структурированно. Разбор от модели — после всех задач.
            </p>
          </div>
      </footer>
    </div>
  )
}
