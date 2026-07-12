'use client'

import { useCallback, useRef } from 'react'

interface RippleButtonProps {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  className?: string
  color?: string
}

export default function RippleButton({
  children,
  onClick,
  className = '',
  color = 'rgba(138,109,30,0.3)',
}: RippleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = useCallback((e: React.MouseEvent) => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ripple = document.createElement('span')
    ripple.className = 'ripple-effect'
    ripple.style.left = `${x}px`
    ripple.style.top = `${y}px`
    ripple.style.background = color

    button.appendChild(ripple)

    setTimeout(() => ripple.remove(), 600)

    onClick?.(e)
  }, [onClick, color])

  return (
    <button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {children}
    </button>
  )
}
