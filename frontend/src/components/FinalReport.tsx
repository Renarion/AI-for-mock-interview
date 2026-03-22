'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useInterviewStore } from '@/store/interviewStore'

interface FinalReportProps {
  onRetry: () => void
  onPaymentRequired: () => void
  onCloseToHome: () => void
}

export default function FinalReport({ onRetry, onPaymentRequired, onCloseToHome }: FinalReportProps) {
  const { finalReport, hasTrialAvailable, paidQuestionsRemaining } = useInterviewStore()

  if (!finalReport) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/60">Загрузка отчёта...</div>
      </div>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🏆'
    if (score >= 80) return '🌟'
    if (score >= 70) return '👍'
    if (score >= 60) return '💪'
    return '📚'
  }

  const canRetry = hasTrialAvailable || paidQuestionsRemaining >= 3

  const handleRetryClick = () => {
    if (canRetry) {
      onRetry()
    } else {
      onPaymentRequired()
    }
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with score */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="mb-4">
            <span className="text-6xl">{getScoreEmoji(finalReport.overall_score)}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Результаты интервью</h1>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-5xl font-bold ${getScoreColor(finalReport.overall_score)}`}>
              {finalReport.overall_score}
            </span>
            <span className="text-2xl text-white/60">/100</span>
          </div>
        </motion.div>

        {/* Motivational message */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass p-6 rounded-2xl mb-8 text-center bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20"
        >
          <p className="text-lg text-white/90">{finalReport.motivational_message}</p>
        </motion.div>

        {/* Task feedbacks */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">📝 Разбор задач</h2>
          
          {(finalReport.task_feedbacks ?? []).map((feedback, index) => {
            if (feedback == null) return null
            const strengths = feedback.strengths ?? []
            const improvements = feedback.improvements ?? []
            const detailed =
              feedback.detailed_feedback ??
              'Разбор по этой задаче временно недоступен.'
            return (
            <motion.div
              key={feedback.task_id ?? `task-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="glass p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Задача {index + 1}</h3>
                <div className={`text-2xl font-bold ${getScoreColor(feedback.score ?? 0)}`}>
                  {feedback.score ?? 0}/100
                </div>
              </div>
              
              <div className="mb-4 p-4 rounded-lg bg-background-elevated">
                <h4 className="text-white/60 text-sm mb-2">Вопрос:</h4>
                <div className="markdown-content text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {feedback.task_question ?? ''}
                  </ReactMarkdown>
                </div>
              </div>
              
              <div className="mb-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h4 className="text-white/60 text-sm mb-2">Ваш ответ:</h4>
                <p className="text-white/80 text-sm whitespace-pre-wrap">{feedback.user_answer ?? ''}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {strengths.length > 0 && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h4 className="text-green-400 font-medium mb-2 flex items-center gap-2">
                      <span>✅</span> Сильные стороны
                    </h4>
                    <ul className="space-y-1 text-sm text-white/80">
                      {strengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {improvements.length > 0 && (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <h4 className="text-yellow-400 font-medium mb-2 flex items-center gap-2">
                      <span>💡</span> Что улучшить
                    </h4>
                    <ul className="space-y-1 text-sm text-white/80">
                      {improvements.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="markdown-content text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {detailed}
                </ReactMarkdown>
              </div>
            </motion.div>
            )
          })}
        </motion.div>

        {/* Overall analysis */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          {/* Strengths */}
          {finalReport.overall_strengths.length > 0 && (
            <div className="glass p-6 rounded-2xl border-l-4 border-green-500">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="text-green-400">🌟</span> Общие сильные стороны
              </h3>
              <ul className="space-y-2">
                {finalReport.overall_strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/80">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas to improve */}
          {finalReport.areas_to_improve.length > 0 && (
            <div className="glass p-6 rounded-2xl border-l-4 border-yellow-500">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <span className="text-yellow-400">🎯</span> Зоны для развития
              </h3>
              <ul className="space-y-2">
                {finalReport.areas_to_improve.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/80">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>

        {/* Study recommendations */}
        {finalReport.study_recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="glass p-6 rounded-2xl mb-8"
          >
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span>📚</span> Рекомендации по подготовке
            </h3>
            <ul className="space-y-3">
              {finalReport.study_recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 text-white/80">
                  <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-sm">
                    {i + 1}
                  </span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center flex-wrap"
        >
          <button
            onClick={handleRetryClick}
            className="btn-primary text-white min-w-[200px]"
          >
            {canRetry ? 'Пройти ещё раз' : 'Купить вопросы'}
          </button>

          <button
            type="button"
            onClick={onCloseToHome}
            className="px-6 py-3 rounded-full border border-white/20 text-white/90 hover:bg-white/10 transition-colors min-w-[200px]"
          >
            На главную
          </button>
          
          <button
            onClick={() => {
              // TODO: Implement share functionality
              if (navigator.share) {
                navigator.share({
                  title: 'AI Mock Interview',
                  text: `Я прошёл мок-интервью и получил ${finalReport.overall_score}/100! Попробуй и ты!`,
                  url: window.location.origin,
                })
              }
            }}
            className="px-6 py-3 rounded-full glass hover:bg-white/10 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Поделиться
          </button>
        </motion.div>

        {/* Questions remaining info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-center text-white/40 text-sm"
        >
          {hasTrialAvailable ? (
            <p>У вас есть бесплатная пробная попытка</p>
          ) : paidQuestionsRemaining > 0 ? (
            <p>Осталось оплаченных вопросов: {paidQuestionsRemaining}</p>
          ) : (
            <p>У вас закончились вопросы. Приобретите пакет для продолжения.</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
