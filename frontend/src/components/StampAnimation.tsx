'use client'

import { motion } from 'framer-motion'

interface StampAnimationProps {
  children: React.ReactNode
  className?: string
}

export default function StampAnimation({ children, className = '' }: StampAnimationProps) {
  return (
    <motion.div
      initial={{ scale: 2, rotate: -15, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
