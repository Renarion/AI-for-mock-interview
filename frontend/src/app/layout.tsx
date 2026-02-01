import type { Metadata } from 'next'
import { ClerkProvider, ClerkLoading, ClerkLoaded } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Mock Interview - Data & Product Analyst Practice',
  description: 'Prepare for your Data Analyst or Product Analyst interview with AI-powered mock interviews. Get instant feedback and improve your skills.',
  keywords: ['mock interview', 'data analyst', 'product analyst', 'interview prep', 'AI interview'],
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F]">
      <div className="w-16 h-16 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-white/60">Загрузка...</p>
    </div>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="ru">
        <body className="antialiased">
          <ClerkLoading>
            <LoadingSpinner />
          </ClerkLoading>
          <ClerkLoaded>
            {children}
          </ClerkLoaded>
        </body>
      </html>
    </ClerkProvider>
  )
}
