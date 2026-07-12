'use client'

import { motion } from 'framer-motion'

interface FreshnessBadgeProps {
  timestamp?: string
  className?: string
}

export default function FreshnessBadge({ timestamp, className = '' }: FreshnessBadgeProps) {
  const getTimeAgo = (ts?: string) => {
    if (!ts) return 'just now'
    const diff = Date.now() - new Date(ts).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <span className={`freshness-badge inline-flex items-center gap-1 text-xs text-brass/70 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-teal"></span>
      checked {getTimeAgo(timestamp)}
    </span>
  )
}
