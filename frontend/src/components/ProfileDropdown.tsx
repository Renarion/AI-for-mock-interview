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

function EyeIcon({ open: visible }: { open: boolean }) {
  if (visible) {
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    )
  }
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

export default function ProfileDropdown() {
  const { token, user, logout, fetchUser } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [showPasswordHint, setShowPasswordHint] = useState(false)
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
        onClick={() =>
          setOpen((o) => {
            if (o) setShowPasswordHint(false)
            return !o
          })
        }
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
            <div className="rounded-lg bg-white/5 p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-white/50">Пароль</span>
                  <p className="text-white font-mono mt-0.5 break-all tracking-widest">
                    {showPasswordHint
                      ? user?.password_length != null
                        ? '•'.repeat(Math.min(Math.max(user.password_length, 6), 64))
                        : '—'
                      : user?.password_masked ?? '••••••••'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordHint((v) => !v)}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  aria-pressed={showPasswordHint}
                  aria-label={showPasswordHint ? 'Скрыть подсказку по паролю' : 'Показать длину пароля'}
                >
                  <EyeIcon open={showPasswordHint} />
                  {showPasswordHint ? 'Скрыть' : 'Показать'}
                </button>
              </div>
              {showPasswordHint && (
                <p className="text-xs text-white/45 mt-2 leading-relaxed">
                  {user?.password_length != null
                    ? 'Показана только длина пароля (точки), не сами символы. Открытый пароль на сервере не хранится.'
                    : 'Для этого аккаунта длина не сохранена (регистрация до обновления). Пароль хранится только в защищённом виде, восстановить текст нельзя.'}
                </p>
              )}
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
