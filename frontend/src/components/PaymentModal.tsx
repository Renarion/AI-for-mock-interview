'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { paymentApi } from '@/lib/api'

interface PaymentModalProps {
  onClose: () => void
  onSuccess: () => void
}

interface PricingPlan {
  plan_id: string
  name: string
  questions_count: number
  price: number
  currency: string
  description: string
}

export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const token = useAuthStore((s) => s.token)
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await paymentApi.getPlans()
        setPlans(response.plans)
        if (response.plans.length > 1) {
          setSelectedPlan(response.plans[1].plan_id) // Default to second plan
        }
      } catch (err) {
        console.error('Failed to load plans:', err)
        setError('Не удалось загрузить тарифы')
      } finally {
        setIsLoadingPlans(false)
      }
    }
    
    loadPlans()
  }, [])

  const handlePayment = async () => {
    if (!selectedPlan) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      if (!token) throw new Error('Требуется авторизация')
      
      const response = await paymentApi.createPayment(
        token,
        selectedPlan,
        `${window.location.origin}/payment/success`
      )
      
      // Redirect to payment page
      window.location.href = response.confirmation_url
    } catch (err) {
      console.error('Failed to create payment:', err)
      setError(err instanceof Error ? err.message : 'Ошибка при создании платежа')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getPlanHighlight = (plan: PricingPlan) => {
    if (plan.plan_id === '6_questions') return 'Популярный'
    if (plan.plan_id === '24_questions') return 'Лучшая цена'
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl glass p-6 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Выберите тариф</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* Plans grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {plans.map((plan) => {
                const highlight = getPlanHighlight(plan)
                const isSelected = selectedPlan === plan.plan_id
                const pricePerQuestion = plan.price / plan.questions_count
                
                return (
                  <button
                    key={plan.plan_id}
                    onClick={() => setSelectedPlan(plan.plan_id)}
                    className={`relative p-4 rounded-xl text-center transition-all ${
                      isSelected
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-white/5 border border-white/10 hover:border-white/30'
                    }`}
                  >
                    {highlight && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-accent-orange text-xs font-medium rounded-full whitespace-nowrap">
                        {highlight}
                      </span>
                    )}
                    
                    <div className="text-3xl font-bold mb-1">{plan.questions_count}</div>
                    <div className="text-white/60 text-sm mb-2">вопросов</div>
                    <div className="text-xl font-semibold text-primary">
                      {formatPrice(plan.price)}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      {formatPrice(pricePerQuestion)}/вопрос
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected plan details */}
            {selectedPlan && (
              <div className="p-4 rounded-xl bg-white/5 mb-6">
                {plans.find((p) => p.plan_id === selectedPlan)?.description}
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePayment}
              disabled={!selectedPlan || isLoading}
              className="w-full btn-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Обработка...
                </span>
              ) : (
                `Оплатить ${selectedPlan ? formatPrice(plans.find((p) => p.plan_id === selectedPlan)?.price || 0) : ''}`
              )}
            </button>

            {/* Payment info */}
            <p className="mt-4 text-center text-xs text-white/40">
              Безопасная оплата через YooKassa. Деньги списываются сразу после подтверждения.
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
