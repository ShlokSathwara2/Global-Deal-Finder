'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, TrendingDown, CreditCard, Clock, Globe, Sparkles } from 'lucide-react'
import GlobeCinematic from './GlobeCinematic'

interface WelcomeScreenProps {
  onEnter: () => void
}

const FEATURES = [
  { icon: TrendingDown, title: 'Best Price', desc: 'Across 100+ retailers worldwide' },
  { icon: CreditCard, title: 'Best Card', desc: 'Bank offers & EMI deals' },
  { icon: Clock, title: 'Best Timing', desc: 'Know when to buy' },
]

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [phase, setPhase] = useState(0)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const handleEnter = useCallback(() => {
    setPhase(5)
    setTimeout(onEnter, 800)
  }, [onEnter])

  return (
    <AnimatePresence>
      {phase < 5 && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
          style={{ background: '#0B1220' }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-[800px] h-[800px] -top-[200px] -left-[200px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(138,109,30,0.08) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[600px] h-[600px] -bottom-[100px] -right-[100px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(47,111,98,0.06) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </div>

          {/* Subtle grid */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.02 }}>
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(138,109,30,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(138,109,30,0.5) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }} />
          </div>

          {/* Main content - two column layout */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 px-6 max-w-6xl w-full">

            {/* Left side - Globe */}
            <motion.div
              className="flex-1 flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={phase >= 1 ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            >
              <GlobeCinematic />
            </motion.div>

            {/* Right side - Text content */}
            <div className="flex-1 text-center lg:text-left max-w-lg">
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono mb-6"
                style={{
                  background: 'rgba(138,109,30,0.1)',
                  border: '1px solid rgba(138,109,30,0.2)',
                  color: 'rgba(246,243,234,0.7)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
              >
                <Sparkles size={12} className="text-brass" />
                AI-Powered Global Price Intelligence
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[0.95] mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                <span className="block" style={{
                  background: 'linear-gradient(135deg, #F6F3EA 0%, #F6F3EA 50%, rgba(138,109,30,0.8) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 30px rgba(138,109,30,0.15))',
                }}>
                  Global Deal
                </span>
                <span className="block mt-1" style={{
                  background: 'linear-gradient(135deg, #8A6D1E 0%, #2F6F62 50%, #8A6D1E 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  Finder
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-base md:text-lg text-paper/40 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8 }}
              >
                Best Price + Best Card + Best Timing.
                <br />
                <span className="text-paper/25">Compared across 7 countries and 100+ retailers in seconds.</span>
              </motion.p>

              {/* Feature pills */}
              <motion.div
                className="flex flex-wrap gap-3 mb-10 justify-center lg:justify-start"
                initial={{ opacity: 0 }}
                animate={phase >= 3 ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {FEATURES.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                    style={{
                      background: 'rgba(246,243,234,0.03)',
                      border: '1px solid rgba(246,243,234,0.08)',
                    }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <feat.icon size={14} className="text-brass" />
                    <span className="text-paper/60 text-xs font-medium">{feat.title}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Enter button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={phase >= 4 ? { opacity: 1, y: 0 } : {}}
                transition={{ type: 'spring', stiffness: 100, damping: 15 }}
              >
                <motion.button
                  className="relative group px-8 py-4 rounded-2xl font-semibold text-base overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(138,109,30,0.2), rgba(47,111,98,0.2))',
                    border: '1px solid rgba(138,109,30,0.3)',
                    color: '#F6F3EA',
                  }}
                  onClick={handleEnter}
                  onMouseEnter={() => setHovering(true)}
                  onMouseLeave={() => setHovering(false)}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(138,109,30,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg, rgba(138,109,30,0.4), rgba(47,111,98,0.4))' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hovering ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10 flex items-center gap-3">
                    Start Comparing
                    <motion.span
                      animate={{ x: hovering ? 5 : 0 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <ArrowRight size={20} />
                    </motion.span>
                  </span>
                </motion.button>
              </motion.div>

              {/* Hint */}
              <motion.p
                className="mt-6 text-xs text-paper/15 font-mono"
                initial={{ opacity: 0 }}
                animate={phase >= 4 ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                Search any product. Compare across the globe.
              </motion.p>
            </div>
          </div>

          {/* Corner accents */}
          <motion.div
            className="absolute top-8 left-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <div className="w-8 h-px bg-brass/20" />
            <div className="w-px h-8 bg-brass/20" />
          </motion.div>
          <motion.div
            className="absolute top-8 right-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
          >
            <div className="w-8 h-px bg-brass/20 ml-auto" />
            <div className="w-px h-8 bg-brass/20 ml-auto" />
          </motion.div>
          <motion.div
            className="absolute bottom-8 left-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
          >
            <div className="w-px h-8 bg-brass/20" />
            <div className="w-8 h-px bg-brass/20" />
          </motion.div>
          <motion.div
            className="absolute bottom-8 right-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
          >
            <div className="w-px h-8 bg-brass/20 ml-auto" />
            <div className="w-8 h-px bg-brass/20 ml-auto" />
          </motion.div>

          {/* Bottom decorative line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(138,109,30,0.2), transparent)' }}
            initial={{ scaleX: 0 }}
            animate={phase >= 3 ? { scaleX: 1 } : {}}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
