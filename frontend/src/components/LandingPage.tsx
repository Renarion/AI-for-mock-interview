'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedSphere from './AnimatedSphere'

const TELEGRAM_CHANNEL_URL = 'https://t.me/+t2TmjzZcohU5ODli'

interface LandingPageProps {
  isLoading: boolean
  isSignedIn: boolean
  onStart: () => void
  onPayClick: () => void
  onStartClick: () => void
}

export default function LandingPage({ isLoading, isSignedIn, onStart, onPayClick, onStartClick }: LandingPageProps) {
  const [showAboutModal, setShowAboutModal] = useState(false)

  const handleStartClick = () => {
    if (isSignedIn) {
      onStart()
    } else {
      onStartClick()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* Sphere container */}
      <div className="relative">
        <AnimatedSphere isLoading={isLoading} />
        
        {/* Central button */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: isLoading ? 2 : 0, duration: 0.5 }}
          >
            <button
              onClick={handleStartClick}
              className="btn-primary text-white shadow-2xl"
            >
              Начать интервью
            </button>
          </motion.div>
          
          {/* Узнать больше */}
          <motion.button
            type="button"
            onClick={() => setShowAboutModal(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: isLoading ? 2.3 : 0.3, duration: 0.5 }}
            className="mt-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Узнать больше
          </motion.button>
        </div>
      </div>

      {/* Product description */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isLoading ? 2.5 : 0.5, duration: 0.5 }}
        className="mt-8 max-w-lg text-center px-6"
      >
        <p className="text-white/70 text-lg leading-relaxed">
          Подготовься к интервью на позицию Data/Product Analyst с помощью AI-powered мок-интервью. Реши задачу и получи мгновенный фидбек и рекомендации.
        </p>
      </motion.div>

      {/* About modal */}
      <AnimatePresence>
        {showAboutModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAboutModal(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#12121A]/95 p-6 shadow-2xl backdrop-blur-xl"
            >
              <h3 className="text-lg font-semibold text-white mb-4">О проекте</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Этот проект был создан, чтобы аналитикам было проще готовиться к техническим секциям в тех компаниях. Мы собрали сотни задач с реальных собеседований. Часть из них мы решали в качестве соискателя, часть спрашивали в роли нанимающего менеджера. Под капотом работает обученная специально под проведение мок-интервью GPT-5. Мы будем благодарны фидбеку и подписке в нашем{' '}
                <a
                  href={TELEGRAM_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B5CF6] hover:text-[#A78BFA] underline underline-offset-2 transition-colors"
                >
                  телеграм-канале
                </a>
                .
              </p>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
              >
                Закрыть
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pay button - fixed at bottom */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isLoading ? 2.8 : 0.8, duration: 0.5 }}
        onClick={onPayClick}
        className="fixed bottom-6 right-6 px-6 py-3 rounded-full glass hover:bg-white/10 transition-all text-white/80 hover:text-white flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Pay
      </motion.button>
    </div>
  )
}
