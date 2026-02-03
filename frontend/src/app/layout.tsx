import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Mock Interview - Data & Product Analyst Practice',
  description: 'Prepare for your Data Analyst or Product Analyst interview with AI-powered mock interviews. Get instant feedback and improve your skills.',
  keywords: ['mock interview', 'data analyst', 'product analyst', 'interview prep', 'AI interview'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
