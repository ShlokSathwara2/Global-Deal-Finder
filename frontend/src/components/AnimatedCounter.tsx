'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  symbol?: string
  duration?: number
  decimals?: number
  className?: string
  textClassName?: string
}

export default function AnimatedCounter({
  value,
  symbol = '$',
  duration = 1.5,
  decimals = 2,
  className = '',
  textClassName = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return

    const startTime = Date.now()
    const startValue = 0
    const endValue = value

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)

      // Easing: ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startValue + (endValue - startValue) * eased

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [hasStarted, value, duration])

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <motion.div
      ref={ref}
      className={`font-mono ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={hasStarted ? { scale: 1, opacity: 1 } : {}}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <span className={textClassName}>
        {symbol}{formatted}
      </span>
    </motion.div>
  )
}
