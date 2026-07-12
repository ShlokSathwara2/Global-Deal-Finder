'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiBurstProps {
  trigger: boolean
  color?: string
}

export default function ConfettiBurst({ trigger, color = '#8A6D1E' }: ConfettiBurstProps) {
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (trigger && !hasTriggered.current) {
      hasTriggered.current = true

      // Gold and teal confetti burst
      const count = 80
      const defaults = {
        origin: { y: 0.6 },
        zIndex: 100,
      }

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        })
      }

      // Burst from both sides
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        colors: ['#8A6D1E', '#D4A835', '#2F6F62'],
      })
      fire(0.2, {
        spread: 60,
        colors: ['#8A6D1E', '#F6F3EA', '#2F6F62'],
      })
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        colors: ['#8A6D1E', '#D4A835', '#2F6F62', '#00D4AA'],
      })
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        colors: ['#8A6D1E', '#F6F3EA'],
      })
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
        colors: ['#2F6F62', '#00D4AA'],
      })
    }
  }, [trigger])

  return null
}
