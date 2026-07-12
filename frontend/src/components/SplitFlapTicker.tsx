'use client'

import { useEffect, useState } from 'react'

interface SplitFlapTickerProps {
  value: number
  currency?: string
  symbol?: string
  className?: string
}

export default function SplitFlapTicker({ value, currency = 'USD', symbol = '$', className = '' }: SplitFlapTickerProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isFlipping, setIsFlipping] = useState(false)

  useEffect(() => {
    if (displayValue !== value) {
      setIsFlipping(true)
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsFlipping(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [value, displayValue])

  const formattedValue = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const digits = `${symbol}${formattedValue}`.split('')

  return (
    <div className={`split-flap font-mono text-2xl md:text-4xl font-bold ${className}`}>
      {digits.map((digit, i) => (
        <span
          key={i}
          className={`inline-block bg-ink-navy border border-brass/30 rounded px-1 md:px-2 py-1 mx-0.5 ${
            isFlipping ? 'flipping' : ''
          }`}
        >
          {digit}
        </span>
      ))}
    </div>
  )
}
