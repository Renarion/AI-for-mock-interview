'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { ApiError } from '@/lib/api'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Tab = 'login' | 'register'

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setToken = useAuthStore((s) => s.setToken)

  // Login
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [telegramUsername, setTelegramUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)

  const resetForm = () => {
    setError(null)
    setLogin('')
    setPassword('')
    setName('')
    setEmail('')
    setTelegramUsername('')
    setRegPassword('')
    setRepeatPassword('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validatePassword = (pwd: string, min = 6) => {
    if (pwd.length < min) {
      return `Пароль должен содержать минимум ${min} символов`
    }
    if (pwd.length > 128) {
      return 'Пароль не должен превышать 128 символов'
    }
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedLogin = login.trim()
    const pwdError = validatePassword(password, 1)
    if (!trimmedLogin) {
      setError('Введите почту или Telegram ник')
      return
    }
    if (pwdError) {
      setError(pwdError)
      return
    }
    setLoading(true)
    try {
      const res = await authApi.login({ login: trimmedLogin, password })
      setToken(res.access_token)
      handleClose()
      onSuccess?.()
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Неверный логин или пароль')
      } else {
        setError(err instanceof ApiError ? err.message : 'Ошибка входа. Попробуйте ещё раз.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (regPassword !== repeatPassword) {
      setError('Пароли не совпадают')
      return
    }
    const pwdError = validatePassword(regPassword)
    if (pwdError) {
      setError(pwdError)
      return
    }
    const emailTrimmed = email.trim()
    if (!emailTrimmed) {
      setError('Введите почту')
      return
    }
    setLoading(true)
    try {
      const res = await authApi.register({
        name,
        email: emailTrimmed,
        telegram_username: telegramUsername.trim() || undefined,
        password: regPassword,
      })
      setToken(res.access_token)
      handleClose()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl bg-[#12121A] border border-white/10 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => { setTab('login'); setError(null) }}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${tab === 'login' ? 'bg-[#8B5CF6] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setError(null) }}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-colors ${tab === 'register' ? 'bg-[#8B5CF6] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                Регистрация
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Почта или ник в Telegram</label>
                  <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none"
                    placeholder="email@example.com или @username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Пароль</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none"
                      placeholder="••••••••"
                      required
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      <EyeIcon show={showPassword} />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Вход...' : 'Войти'}
                </button>
              </form>
            )}

            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-1">Имя</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none"
                    placeholder="Ваше имя"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Почта *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none"
                    placeholder="email@example.com"
                    required
                    pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
                    title="Введите корректную почту (например, user@mail.ru)"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Ник в Telegram (по желанию)</label>
                  <input
                    type="text"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none"
                    placeholder="@username"
                  />
                  <p className="mt-1 text-xs text-white/50">
                    Почта или ник в Telegram будут использоваться для входа (логин).
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Пароль</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      <EyeIcon show={showRegPassword} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    Пароль должен содержать от 6 до 128 символов.
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-1">Повторите пароль</label>
                  <div className="relative">
                    <input
                      type={showRepeatPassword ? 'text' : 'password'}
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-[#8B5CF6] focus:outline-none"
                      placeholder="••••••••"
                      required
                      maxLength={128}
                    />
                    <button
                      type="button"
                      onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                    >
                      <EyeIcon show={showRepeatPassword} />
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] text-white font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="mt-4 w-full py-2 text-white/50 hover:text-white text-sm"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
