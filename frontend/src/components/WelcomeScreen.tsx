'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ArrowRight, Sparkles, TrendingDown, CreditCard, Clock, ChevronRight } from 'lucide-react'

interface WelcomeScreenProps {
  onEnter: () => void
}

const FLOATING_WORDS = [
  'iPhone 17 Pro', 'MacBook Air', 'Sony WH-1000XM5', 'Dyson V15',
  'Samsung Galaxy S25', 'iPad Pro', 'AirPods Max', 'PS5 Pro',
  'RTX 5090', 'Canon R5', 'Nintendo Switch 2', 'Tesla Model Q',
]

const FEATURES = [
  { icon: TrendingDown, title: 'Best Price', desc: 'Across 100+ retailers worldwide' },
  { icon: CreditCard, title: 'Best Card', desc: 'Bank offers & EMI deals' },
  { icon: Clock, title: 'Best Timing', desc: 'Know when to buy' },
]

const COUNTRY_FLAGS = ['\u{1F1EE}\u{1F1F3}', '\u{1F1FA}\u{1F1F8}', '\u{1F1E6}\u{1F1EA}', '\u{1F1EC}\u{1F1E7}', '\u{1F1E6}\u{1F1FA}', '\u{1F1E9}\u{1F1EA}', '\u{1F1E8}\u{1F1E6}']

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const [phase, setPhase] = useState(0)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2600),
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
          {/* Animated background gradients */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute w-[800px] h-[800px] -top-[200px] -left-[200px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(138,109,30,0.12) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute w-[600px] h-[600px] -bottom-[100px] -right-[100px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(47,111,98,0.1) 0%, transparent 70%)' }}
              animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 0] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(138,109,30,0.06) 0%, transparent 60%)' }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
          </div>

          {/* Floating product words */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {FLOATING_WORDS.map((word, i) => (
              <motion.div
                key={word}
                className="absolute text-xs font-mono whitespace-nowrap"
                style={{
                  color: 'rgba(246,243,234,0.06)',
                  left: `${10 + (i * 7) % 80}%`,
                  top: `${5 + (i * 13) % 90}%`,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: [0, 0.08, 0],
                  y: [20, -30, -80],
                }}
                transition={{
                  duration: 6 + (i % 3),
                  repeat: Infinity,
                  delay: i * 0.8,
                  ease: 'easeInOut',
                }}
              >
                {word}
              </motion.div>
            ))}
          </div>

          {/* Floating country flags */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {COUNTRY_FLAGS.map((flag, i) => (
              <motion.div
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${8 + (i * 13) % 85}%`,
                  top: `${15 + (i * 17) % 70}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.15, 0],
                  scale: [0.5, 1, 0.8],
                  y: [0, -40, -80],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  delay: 1.5 + i * 0.6,
                  ease: 'easeInOut',
                }}
              >
                {flag}
              </motion.div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.03 }}>
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(138,109,30,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(138,109,30,0.5) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }} />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">

            {/* Animated logo globe */}
            <motion.div
              className="relative mb-8"
              initial={{ scale: 0, rotate: -180 }}
              animate={phase >= 1 ? { scale: 1, rotate: 0 } : {}}
              transition={{ type: 'spring', stiffness: 100, damping: 12, delay: 0.1 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-8 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(138,109,30,0.2) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, rgba(138,109,30,0.15), rgba(47,111,98,0.15))',
                    border: '1px solid rgba(138,109,30,0.3)',
                    boxShadow: '0 0 60px rgba(138,109,30,0.15), inset 0 0 30px rgba(138,109,30,0.05)',
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                >
                  <Globe size={40} className="text-primary md:w-14 md:h-14" style={{ filter: 'drop-shadow(0 0 20px rgba(138,109,30,0.4))' }} />
                </motion.div>

                {/* Orbiting dots */}
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: i % 2 === 0 ? 'rgba(138,109,30,0.6)' : 'rgba(47,111,98,0.6)',
                      boxShadow: `0 0 8px ${i % 2 === 0 ? 'rgba(138,109,30,0.4)' : 'rgba(47,111,98,0.4)'}`,
                      top: '50%',
                      left: '50%',
                      transformOrigin: `0 ${55 + i * 8}px`,
                      marginTop: `-${55 + i * 8}px`,
                    }}
                    animate={{
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 6 + i,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 0.5,
                    }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.h1
                className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-none"
                style={{
                  background: 'linear-gradient(135deg, #F6F3EA 0%, #8A6D1E 40%, #2F6F62 60%, #F6F3EA 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 40px rgba(138,109,30,0.2))',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              >
                Global Deal
                <br />
                Finder
              </motion.h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="mt-6 text-lg md:text-xl text-paper/50 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Best Price + Best Card + Best Timing
              <br />
              <span className="text-paper/30">across 100+ retailers in 7 countries</span>
            </motion.p>

            {/* Feature pills */}
            <motion.div
              className="flex flex-wrap justify-center gap-3 mt-8"
              initial={{ opacity: 0 }}
              animate={phase >= 3 ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {FEATURES.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                  style={{
                    background: 'rgba(246,243,234,0.03)',
                    border: '1px solid rgba(246,243,234,0.08)',
                    backdropFilter: 'blur(10px)',
                  }}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={phase >= 3 ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ delay: 0.4 + i * 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                  whileHover={{ scale: 1.05, borderColor: 'rgba(138,109,30,0.3)' }}
                >
                  <feat.icon size={16} className="text-brass" />
                  <span className="text-paper/70 font-medium">{feat.title}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Enter button */}
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 30 }}
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
                  style={{
                    background: 'linear-gradient(135deg, rgba(138,109,30,0.4), rgba(47,111,98,0.4))',
                  }}
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

            {/* Subtle hint */}
            <motion.p
              className="mt-6 text-xs text-paper/20 font-mono"
              initial={{ opacity: 0 }}
              animate={phase >= 4 ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
            >
              Search any product. Compare across the globe.
            </motion.p>
          </div>

          {/* Bottom decorative line */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(138,109,30,0.3), transparent)' }}
            initial={{ scaleX: 0 }}
            animate={phase >= 3 ? { scaleX: 1 } : {}}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Corner accents */}
          <motion.div
            className="absolute top-8 left-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            <div className="w-8 h-px bg-brass/30" />
            <div className="w-px h-8 bg-brass/30" />
          </motion.div>
          <motion.div
            className="absolute top-8 right-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.6 }}
          >
            <div className="w-8 h-px bg-brass/30 ml-auto" />
            <div className="w-px h-8 bg-brass/30 ml-auto" />
          </motion.div>
          <motion.div
            className="absolute bottom-8 left-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
          >
            <div className="w-px h-8 bg-brass/30" />
            <div className="w-8 h-px bg-brass/30" />
          </motion.div>
          <motion.div
            className="absolute bottom-8 right-8"
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ delay: 0.8 }}
          >
            <div className="w-px h-8 bg-brass/30 ml-auto" />
            <div className="w-8 h-px bg-brass/30 ml-auto" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
