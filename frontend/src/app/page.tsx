'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from '@/components/LandingPage'
import SelectionFlow from '@/components/SelectionFlow'
import InterviewChat from '@/components/InterviewChat'
import FinalReport from '@/components/FinalReport'
import PaymentModal from '@/components/PaymentModal'
import AuthModal from '@/components/AuthModal'
import ProfileDropdown from '@/components/ProfileDropdown'
import { useInterviewStore } from '@/store/interviewStore'
import { useAuthStore } from '@/store/authStore'

type AppScreen = 'landing' | 'selection' | 'interview' | 'report' | 'payment'

export default function Home() {
  const { token, user, fetchUser } = useAuthStore()
  const isSignedIn = !!token && !!user
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('landing')
  const [showPayment, setShowPayment] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { resetInterview, sessionId } = useInterviewStore()

  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setIsInitialLoading(false), 800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (token) fetchUser()
  }, [token, fetchUser])

  const handleStartInterview = () => {
    if (!isSignedIn) {
      setShowAuthModal(true)
      return
    }
    setCurrentScreen('selection')
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    setCurrentScreen('selection')
  }

  const handleSelectionComplete = () => {
    setCurrentScreen('interview')
  }

  const handleInterviewComplete = () => {
    setCurrentScreen('report')
  }

  const handleRetry = () => {
    resetInterview()
    setCurrentScreen('selection')
  }

  const handlePaymentRequired = () => {
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    setShowPayment(false)
    setCurrentScreen('landing')
    fetchUser()
  }

  const handleBackToLanding = () => {
    resetInterview()
    setCurrentScreen('landing')
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-radial from-background-elevated via-background to-black z-0" />
      <div className="fixed inset-0 z-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Profile icon - top right */}
      <div className="fixed top-4 right-4 z-20">
        <ProfileDropdown />
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {currentScreen === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <LandingPage
                isLoading={isInitialLoading}
                isSignedIn={isSignedIn}
                onStart={handleStartInterview}
                onPayClick={() => setShowPayment(true)}
                onStartClick={() => setShowAuthModal(true)}
              />
            </motion.div>
          )}

          {currentScreen === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SelectionFlow
                onComplete={handleSelectionComplete}
                onBack={handleBackToLanding}
              />
            </motion.div>
          )}

          {currentScreen === 'interview' && (
            <motion.div
              key="interview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
            >
              <InterviewChat
                onComplete={handleInterviewComplete}
                onPaymentRequired={handlePaymentRequired}
              />
            </motion.div>
          )}

          {currentScreen === 'report' && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <FinalReport
                onRetry={handleRetry}
                onPaymentRequired={handlePaymentRequired}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPayment && (
          <PaymentModal
            onClose={() => setShowPayment(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      <footer className="fixed bottom-6 left-6 z-20 flex items-center gap-3">
        {/* "Connect for updates" и иконки FB/Instagram убраны; при необходимости раскомментировать ниже */}
        <div className="flex gap-2">
          {/* Instagram
          <a href="#" className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 ...">...</a>
          */}
          {/* Facebook
          <a href="#" className="w-10 h-10 rounded-full bg-blue-600 ...">...</a>
          */}
          <a
            href="https://t.me/+t2TmjzZcohU5ODli"
            className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center hover:scale-110 transition-transform"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
        </div>
      </footer>
    </main>
  )
}
