'use client'

import { motion } from 'framer-motion'
import AnimatedSphere from './AnimatedSphere'

interface LandingPageProps {
  isLoading: boolean
  isSignedIn: boolean
  onStart: () => void
  onPayClick: () => void
  onStartClick: () => void
}

export default function LandingPage({ isLoading, isSignedIn, onStart, onPayClick, onStartClick }: LandingPageProps) {
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
              Start the interview
            </button>
          </motion.div>
          
          {/* Learn more link */}
          <motion.a
            href="#about"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: isLoading ? 2.3 : 0.3, duration: 0.5 }}
            className="mt-4 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Learn more
          </motion.a>
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

      {/* Decorative star in bottom right */}
      <motion.div
        initial={{ opacity: 0, rotate: -45 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ delay: isLoading ? 3 : 1, duration: 0.5 }}
        className="fixed bottom-24 right-8"
      >
        <svg className="w-6 h-6 text-white/40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z" />
        </svg>
      </motion.div>
    </div>
  )
}
