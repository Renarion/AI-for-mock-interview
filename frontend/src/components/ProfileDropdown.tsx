'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

function AvatarIcon() {
  return (
    <svg
      className="w-8 h-8 text-white/70"
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  )
}

export default function ProfileDropdown() {
  const { token, user, logout, fetchUser } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (token) fetchUser()
  }, [token, fetchUser])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!token) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/20"
        aria-label="Профиль"
      >
        <AvatarIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-[#12121A] border border-white/10 shadow-2xl py-4 z-50">
          <div className="px-4 pb-3 border-b border-white/10">
            <p className="text-white font-medium truncate">{user?.name ?? 'Загрузка...'}</p>
            <p className="text-white/50 text-sm mt-0.5">
              Вопросов для собеседования: <span className="text-[#8B5CF6] font-semibold">{user?.questions_remaining ?? '—'}</span>
            </p>
          </div>
          <div className="px-4 py-3 space-y-2 text-sm">
            {user ? (
              <>
                <div>
                  <span className="text-white/50">Почта:</span>
                  <p className="text-white truncate">{user.email}</p>
                </div>
                {user.telegram_username && (
                  <div>
                    <span className="text-white/50">Telegram:</span>
                    <p className="text-white truncate">@{user.telegram_username}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-white/50">Загрузка данных...</p>
            )}
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-white/50">Пароль:</span>
                <p className="text-white font-mono">********</p>
              </div>
              <span className="text-xs text-white/40 shrink-0">
                В зашифрованном виде
              </span>
            </div>
          </div>
          <div className="px-4 pt-3">
            <button
              type="button"
              onClick={() => {
                logout()
                setOpen(false)
              }}
              className="w-full py-2 rounded-lg bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-red-300 text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
