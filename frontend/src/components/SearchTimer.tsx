'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Clock, Search, Sparkles } from 'lucide-react'

interface SearchTimerProps {
  estimatedSeconds?: number
  query?: string
}

const MESSAGES = [
  'Scanning retailers worldwide...',
  'Comparing prices across countries...',
  'Checking card offers & EMI deals...',
  'Analyzing best deals for you...',
  'Crunching the numbers...',
]

export default function SearchTimer({ estimatedSeconds = 8, query = '' }: SearchTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % MESSAGES.length)
    }, 2500)
    return () => clearInterval(msgInterval)
  }, [])

  const remaining = Math.max(0, estimatedSeconds - elapsed)
  const isOvertime = elapsed >= estimatedSeconds
  const progress = Math.min(1, elapsed / estimatedSeconds)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center gap-6 py-8"
    >
      {/* Circular progress */}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(138,109,30,0.1)"
            strokeWidth="3"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#timerGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8A6D1E" />
              <stop offset="100%" stopColor="#2F6F62" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={18} className="text-brass" />
          </motion.div>
          <span className="text-base font-mono font-bold text-paper/80 mt-1 whitespace-nowrap">
            {isOvertime ? (
              <span className="text-brass animate-pulse">Waking up...</span>
            ) : (
              `${remaining}s`
            )}
          </span>
        </div>
      </div>

      {/* Elapsed time */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm text-paper/40">
          <Clock size={14} />
          <span className="font-mono">
            {minutes > 0 ? `${minutes}:` : ''}{seconds.toString().padStart(2, '0')} elapsed
          </span>
        </div>

        {/* Animated message */}
        <motion.div
          key={messageIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="flex items-center justify-center gap-2"
        >
          <Sparkles size={14} className="text-brass/60" />
          <span className="text-sm text-paper/50">{MESSAGES[messageIndex]}</span>
        </motion.div>
      </div>

      {/* Query badge */}
      {query && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs"
          style={{
            background: 'rgba(138,109,30,0.08)',
            border: '1px solid rgba(138,109,30,0.15)',
          }}
        >
          <Search size={12} className="text-brass/50" />
          <span className="text-paper/40 max-w-[200px] truncate">{query}</span>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(138,109,30,0.1)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(to right, #8A6D1E, #2F6F62)' }}
          initial={{ width: '0%' }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  )
}
