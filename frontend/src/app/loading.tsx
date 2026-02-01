'use client'

// Shown immediately while page loads - gives instant feedback
export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0F]">
      <div className="w-16 h-16 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-white/60">Загрузка...</p>
    </div>
  )
}
