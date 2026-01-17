'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, SignInButton, useClerk } from '@clerk/nextjs'
import LandingPage from '@/components/LandingPage'
import SelectionFlow from '@/components/SelectionFlow'
import InterviewChat from '@/components/InterviewChat'
import FinalReport from '@/components/FinalReport'
import PaymentModal from '@/components/PaymentModal'
import { useInterviewStore } from '@/store/interviewStore'

type AppScreen = 'landing' | 'selection' | 'interview' | 'report' | 'payment'

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('landing')
  const [showPayment, setShowPayment] = useState(false)
  const { resetInterview, sessionId } = useInterviewStore()

  // Handle initial load animation
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 2000) // Initial sphere animation duration
    
    return () => clearTimeout(timer)
  }, [])

  const handleStartInterview = () => {
    if (!isSignedIn) {
      // Clerk will handle the sign-in flow
      return
    }
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
  }

  const handleBackToLanding = () => {
    resetInterview()
    setCurrentScreen('landing')
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-background-elevated via-background to-black z-0" />
      
      {/* Animated background particles */}
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

      {/* Main content */}
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
                isSignedIn={isSignedIn || false}
                onStart={handleStartInterview}
                onPayClick={() => setShowPayment(true)}
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

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <PaymentModal
            onClose={() => setShowPayment(false)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      {/* Social links footer */}
      <footer className="fixed bottom-6 left-6 z-20 flex items-center gap-3">
        <span className="text-white/50 text-sm">Connect for updates</span>
        <div className="flex gap-2">
          <a
            href="#"
            className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center hover:scale-110 transition-transform"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a
            href="#"
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center hover:scale-110 transition-transform"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a
            href="#"
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
