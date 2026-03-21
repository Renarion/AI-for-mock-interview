'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useInterviewStore } from '@/store/interviewStore'
import { interviewApi } from '@/lib/api'

interface SelectionFlowProps {
  onComplete: () => void
  onBack: () => void
}

type Step = 'specialization' | 'experience' | 'tier' | 'topic' | 'banner'

// При необходимости вернуть шаг выбора специализации — раскомментировать использование 'specialization' в steps,
// вернуть currentStep initial в 'specialization', раскомментировать case 'specialization' в handleSelect/getStepTitle/getOptions/getSelectedValue
const DEFAULT_SPECIALIZATION = 'product_analyst'

interface Option {
  id: string
  name: string
  description?: string
}

export default function SelectionFlow({ onComplete, onBack }: SelectionFlowProps) {
  const token = useAuthStore((s) => s.token)
  const { setSelection, setSessionId, setTasks, resetForNewInterviewSession } = useInterviewStore()
  
  const [currentStep, setCurrentStep] = useState<Step>('experience') // было 'specialization' — шаг выбора product/data analyst отключён
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Selection state
  const [specialization, setSpecialization] = useState<string | null>(null)
  const [experienceLevel, setExperienceLevel] = useState<string | null>(null)
  const [companyTier, setCompanyTier] = useState<string | null>(null)
  const [topic, setTopic] = useState<string | null>(null)
  
  // Options from API (cached). Шаг специализации отключён — при восстановлении раскомментировать шаг в steps и initial currentStep.
  // const [specializations] = useState<Option[]>([
  //   { id: 'product_analyst', name: 'Product Analyst' },
  //   { id: 'data_analyst', name: 'Data Analyst' },
  // ])
  
  const [experienceLevels] = useState<Option[]>([
    { id: 'junior', name: 'Junior' },
    { id: 'middle', name: 'Middle +' },
    // { id: 'senior', name: 'Senior' }, // кнопка Senior удалена по запросу
  ])
  
  const [companyTiers] = useState<Option[]>([
    { id: 'tier1', name: 'Tier 1' }, // description: 'Яндекс, VK, Тинькофф, Ozon, Avito и др.'
    { id: 'tier2', name: 'Tier 2' }, // description: 'Крупные компании с сильными командами'
  ])
  
  const [topics] = useState<Option[]>([
    { id: 'statistics', name: 'Статистика' },
    { id: 'ab_testing', name: 'A/B тестирование' },
    { id: 'probability', name: 'Теория вероятностей' },
    { id: 'python', name: 'Python' },
    { id: 'sql', name: 'SQL' },
    { id: 'random', name: 'Random' },
  ])

  const steps: Step[] = ['experience', 'tier', 'topic', 'banner'] // раньше: ['specialization', 'experience', 'tier', 'topic', 'banner']
  const currentStepIndex = steps.indexOf(currentStep)

  const handleSelect = (value: string) => {
    setError(null)
    
    switch (currentStep) {
      // case 'specialization':
      //   setSpecialization(value)
      //   setCurrentStep('experience')
      //   break
      case 'experience':
        setExperienceLevel(value)
        setCurrentStep('tier')
        break
      case 'tier':
        setCompanyTier(value)
        setCurrentStep('topic')
        break
      case 'topic':
        setTopic(value)
        setCurrentStep('banner')
        break
    }
  }

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1])
    } else {
      onBack()
    }
  }

  const handleStartInterview = async () => {
    const effectiveSpecialization = specialization ?? DEFAULT_SPECIALIZATION
    if (!effectiveSpecialization || !experienceLevel || !companyTier || !topic) {
      setError('Пожалуйста, выберите все параметры')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      if (!token) {
        throw new Error('Требуется авторизация')
      }
      
      const response = await interviewApi.startInterview(token, {
        specialization: effectiveSpecialization,
        experience_level: experienceLevel,
        company_tier: companyTier,
        topic,
      })
      
      // Save to store (сброс индекса/ответов от прошлой сессии из localStorage)
      resetForNewInterviewSession()
      setSelection({
        specialization: effectiveSpecialization,
        experienceLevel,
        companyTier,
        topic,
      })
      setSessionId(response.session_id)
      setTasks(response.tasks)
      
      onComplete()
    } catch (err) {
      console.error('Failed to start interview:', err)
      setError(err instanceof Error ? err.message : 'Не удалось начать интервью. Попробуйте ещё раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      // case 'specialization':
      //   return 'Выберите специализацию'
      case 'experience':
        return 'Выберите уровень опыта'
      case 'tier':
        return 'Выберите уровень компании'
      case 'topic':
        return 'Выберите тему задач'
      case 'banner':
        return 'Готовы начать?'
    }
  }

  const getOptions = (): Option[] => {
    switch (currentStep) {
      // case 'specialization':
      //   return specializations
      case 'experience':
        return experienceLevels
      case 'tier':
        return companyTiers
      case 'topic':
        return topics
      default:
        return []
    }
  }

  const getSelectedValue = (): string | null => {
    switch (currentStep) {
      // case 'specialization':
      //   return specialization
      case 'experience':
        return experienceLevel
      case 'tier':
        return companyTier
      case 'topic':
        return topic
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Progress indicator */}
      <div className="mb-8 flex items-center gap-2">
        {steps.slice(0, -1).map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                index <= currentStepIndex ? 'bg-primary' : 'bg-white/20'
              }`}
            />
            {index < steps.length - 2 && (
              <div
                className={`w-8 h-0.5 transition-colors ${
                  index < currentStepIndex ? 'bg-primary' : 'bg-white/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Назад
      </button>

      <AnimatePresence mode="wait">
        {currentStep !== 'banner' ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <h2 className="text-2xl font-semibold text-center mb-8">{getStepTitle()}</h2>

            <div className="space-y-3">
              {getOptions().map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    getSelectedValue() === option.id
                      ? 'glass bg-primary/20 border-primary'
                      : 'glass hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium">{option.name}</div>
                  {option.description && (
                    <div className="text-sm text-white/60 mt-1">{option.description}</div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="banner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-lg glass p-8"
          >
            <h2 className="text-2xl font-semibold text-center mb-6">
              🎯 Формат интервью
            </h2>

            <div className="space-y-4 text-white/80 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">1</span>
                </div>
                <p>Вам будет предложено <strong className="text-white">от 1 до 3 задач</strong> по выбранной теме (по количеству доступных вопросов).</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">2</span>
                </div>
                <p>На каждую задачу рекомендуется <strong className="text-white">не более 20 минут</strong>. Мы покажем таймер.</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">3</span>
                </div>
                <p>Отвечайте текстом — <strong className="text-white">кратко и по существу</strong>.</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">4</span>
                </div>
                <p>После каждой задачи вы получите фидбек. Можно <strong className="text-white">завершить раньше</strong> или решить все задачи.</p>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">5</span>
                </div>
                <p>В конце — <strong className="text-white">подробный разбор</strong> и рекомендации по улучшению.</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleStartInterview}
              disabled={isLoading}
              className="w-full btn-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Загрузка...
                </span>
              ) : (
                'Начать интервью'
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
