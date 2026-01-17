'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@clerk/nextjs'
import { paymentApi } from '@/lib/api'
import { useState } from 'react'

/**
 * Mock payment page for development.
 * In production, users would be redirected to YooKassa.
 */
export default function MockPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getToken } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  
  const paymentId = searchParams.get('payment_id')

  const handleConfirmPayment = async () => {
    if (!paymentId) return
    
    setIsProcessing(true)
    
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      
      await paymentApi.mockCompletePayment(token, paymentId)
      router.push('/payment/success')
    } catch (err) {
      console.error('Failed to complete payment:', err)
      router.push('/payment/success?error=failed')
    }
  }

  const handleCancel = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8 rounded-2xl max-w-md w-full"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-3xl">🧪</span>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Тестовая оплата</h1>
          <p className="text-white/60">
            Это mock-страница для тестирования. В продакшене здесь будет страница YooKassa.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60">Payment ID:</span>
            <span className="font-mono text-sm">{paymentId?.slice(0, 8)}...</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Статус:</span>
            <span className="text-yellow-400">Ожидает оплаты</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleConfirmPayment}
            disabled={isProcessing}
            className="w-full btn-primary text-white disabled:opacity-50"
          >
            {isProcessing ? 'Обработка...' : '✅ Симулировать успешную оплату'}
          </button>
          
          <button
            onClick={handleCancel}
            disabled={isProcessing}
            className="w-full px-6 py-3 rounded-full glass hover:bg-white/10 transition-colors"
          >
            ❌ Отменить
          </button>
        </div>
      </motion.div>
    </div>
  )
}
