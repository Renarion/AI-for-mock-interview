'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { paymentApi } from '@/lib/api'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = useAuthStore((s) => s.token)
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const processPayment = async () => {
      const paymentId = searchParams.get('payment_id')
      
      if (!paymentId) {
        // In production, YooKassa will redirect with actual payment data
        // For now, just show success
        setStatus('success')
        return
      }
      
      try {
        if (!token) throw new Error('Not authenticated')
        
        // In development, use mock complete endpoint
        await paymentApi.mockCompletePayment(token, paymentId)
        fetchUser()
        setStatus('success')
      } catch (err) {
        console.error('Payment verification failed:', err)
        setError(err instanceof Error ? err.message : 'Payment verification failed')
        setStatus('error')
      }
    }
    
    processPayment()
  }, [searchParams, token, fetchUser])

  const handleContinue = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-2xl text-center max-w-md w-full"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Проверяем платёж...</h1>
            <p className="text-white/60">Пожалуйста, подождите</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2">Оплата прошла успешно! 🎉</h1>
            <p className="text-white/60 mb-6">
              Вопросы добавлены на ваш баланс. Теперь вы можете продолжить практику.
            </p>
            <button
              onClick={handleContinue}
              className="btn-primary text-white"
            >
              Продолжить
            </button>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2">Ошибка оплаты</h1>
            <p className="text-white/60 mb-2">{error || 'Что-то пошло не так'}</p>
            <p className="text-white/40 text-sm mb-6">
              Если деньги были списаны, пожалуйста, свяжитесь с поддержкой.
            </p>
            <button
              onClick={handleContinue}
              className="px-6 py-3 rounded-full glass hover:bg-white/10 transition-colors"
            >
              Вернуться на главную
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
