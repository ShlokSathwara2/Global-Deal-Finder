'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface GlobeCinematicProps {
  onEnter?: () => void
}

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '\u{1F1EE}\u{1F1F3}', color: '#FF9933' },
  { code: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', color: '#3C3B6E' },
  { code: 'AE', name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}', color: '#FF0000' },
  { code: 'UK', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', color: '#00247D' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', color: '#00008B' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', color: '#DD0000' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', color: '#FF0000' },
]

// Positions on the globe (longitude-based X, latitude-based Y mapped to our sphere)
const MARKER_POSITIONS: Record<string, { angle: number; ring: number }> = {
  IN: { angle: 78, ring: 1 },
  US: { angle: 200, ring: 1 },
  AE: { angle: 55, ring: 1 },
  UK: { angle: 355, ring: 0 },
  AU: { angle: 115, ring: 2 },
  DE: { angle: 10, ring: 0 },
  CA: { angle: 230, ring: 0 },
}

export default function GlobeCinematic({ onEnter }: GlobeCinematicProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % COUNTRIES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const targetAngle = MARKER_POSITIONS[COUNTRIES[activeIndex].code].angle
    setRotation(360 - targetAngle + 90)
  }, [activeIndex])

  const activeCountry = COUNTRIES[activeIndex]

  return (
    <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] mx-auto">
      {/* Outer glow rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '110%',
            height: '110%',
            border: '1px solid rgba(138,109,30,0.08)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '125%',
            height: '125%',
            border: '1px dashed rgba(47,111,98,0.06)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '140%',
            height: '140%',
            border: '1px solid rgba(138,109,30,0.04)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Globe body */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Main sphere */}
        <div
          className="relative w-[240px] h-[240px] md:w-[300px] md:h-[300px] rounded-full overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(47,111,98,0.15) 0%, rgba(11,18,32,0.95) 50%, rgba(11,18,32,1) 100%)',
            boxShadow: `
              inset -30px -30px 60px rgba(0,0,0,0.5),
              inset 10px 10px 30px rgba(138,109,30,0.05),
              0 0 60px rgba(138,109,30,0.08),
              0 0 120px rgba(47,111,98,0.05)
            `,
          }}
        >
          {/* Atmosphere rim light */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(47,111,98,0.1) 0%, transparent 40%)',
            }}
          />

          {/* Grid lines (longitude) */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: rotation }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={`lon-${i}`}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${50 + Math.cos((i * 30) * Math.PI / 180) * 50}%`,
                    width: '1px',
                    background: 'linear-gradient(to bottom, transparent, rgba(138,109,30,0.12) 30%, rgba(138,109,30,0.12) 70%, transparent)',
                    transform: `perspective(300px) rotateY(${i * 15}deg)`,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Grid lines (latitude) */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {[...Array(8)].map((_, i) => (
              <div
                key={`lat-${i}`}
                className="absolute left-0 right-0"
                style={{
                  top: `${15 + i * 10}%`,
                  height: '1px',
                  background: 'linear-gradient(to right, transparent, rgba(47,111,98,0.08) 30%, rgba(47,111,98,0.08) 70%, transparent)',
                }}
              />
            ))}
          </div>

          {/* Continents (simplified shapes) */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: rotation }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* North America */}
              <div className="absolute" style={{ left: '12%', top: '25%', width: '18%', height: '22%' }}>
                <div className="w-full h-full rounded-[40%_60%_50%_40%] bg-brass/8" />
              </div>
              {/* South America */}
              <div className="absolute" style={{ left: '22%', top: '55%', width: '10%', height: '20%' }}>
                <div className="w-full h-full rounded-[50%_40%_60%_40%] bg-brass/6" />
              </div>
              {/* Europe */}
              <div className="absolute" style={{ left: '45%', top: '20%', width: '12%', height: '15%' }}>
                <div className="w-full h-full rounded-[40%_50%_40%_60%] bg-brass/8" />
              </div>
              {/* Africa */}
              <div className="absolute" style={{ left: '48%', top: '40%', width: '14%', height: '25%' }}>
                <div className="w-full h-full rounded-[50%_40%_45%_55%] bg-brass/6" />
              </div>
              {/* Asia */}
              <div className="absolute" style={{ left: '60%', top: '22%', width: '22%', height: '25%' }}>
                <div className="w-full h-full rounded-[45%_55%_50%_40%] bg-brass/8" />
              </div>
              {/* India (highlighted) */}
              <div className="absolute" style={{ left: '66%', top: '38%', width: '6%', height: '10%' }}>
                <div className="w-full h-full rounded-[40%_50%_60%_40%] bg-brass/12" />
              </div>
              {/* Australia */}
              <div className="absolute" style={{ left: '76%', top: '60%', width: '12%', height: '10%' }}>
                <div className="w-full h-full rounded-[50%_40%_45%_55%] bg-brass/6" />
              </div>
            </motion.div>
          </div>

          {/* Country markers */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {COUNTRIES.map((country, i) => {
              const pos = MARKER_POSITIONS[country.code]
              const isActive = i === activeIndex
              const x = 50 + Math.cos((pos.angle - rotation) * Math.PI / 180) * 40
              const y = 50 + (pos.ring - 1) * 15

              // Only show if on the "front" of the globe
              const normalizedAngle = ((pos.angle - rotation) % 360 + 360) % 360
              const isVisible = normalizedAngle > 90 && normalizedAngle < 270

              return (
                <div
                  key={country.code}
                  className="absolute"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isActive ? 10 : 1,
                    opacity: isVisible ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {/* Pulse ring */}
                  {isActive && (
                    <motion.div
                      className="absolute -inset-3 rounded-full"
                      style={{
                        border: `1px solid ${country.color}40`,
                        boxShadow: `0 0 20px ${country.color}20`,
                      }}
                      animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}

                  {/* Marker dot */}
                  <motion.div
                    className="w-3 h-3 rounded-full relative"
                    style={{
                      background: isActive
                        ? `radial-gradient(circle, ${country.color}, ${country.color}80)`
                        : 'rgba(138,109,30,0.3)',
                      boxShadow: isActive
                        ? `0 0 12px ${country.color}60, 0 0 24px ${country.color}30`
                        : 'none',
                    }}
                    animate={isActive ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    {/* Inner glow */}
                    <div
                      className="absolute inset-[3px] rounded-full"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.6)' : 'rgba(138,109,30,0.2)',
                      }}
                    />
                  </motion.div>
                </div>
              )
            })}
          </div>

          {/* Atmosphere highlight */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
            }}
          />
        </div>
      </div>

      {/* Country label display */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCountry.code}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center"
          >
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl" style={{
              background: 'rgba(11,18,32,0.8)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${activeCountry.color}30`,
              boxShadow: `0 0 30px ${activeCountry.color}10`,
            }}>
              <span className="text-2xl">{activeCountry.flag}</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-paper/90">{activeCountry.name}</p>
                <p className="text-[10px] text-paper/40 font-mono">Comparing prices</p>
              </div>
              <motion.div
                className="w-1.5 h-1.5 rounded-full ml-2"
                style={{ background: activeCountry.color }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Side indicators */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-8 space-y-2">
        {COUNTRIES.map((country, i) => (
          <motion.div
            key={country.code}
            className="flex items-center gap-1.5"
            animate={{ opacity: i === activeIndex ? 1 : 0.2 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="w-1 h-1 rounded-full"
              style={{
                background: i === activeIndex ? country.color : 'rgba(246,243,234,0.2)',
                boxShadow: i === activeIndex ? `0 0 6px ${country.color}60` : 'none',
              }}
            />
            <span className="text-[8px] font-mono text-paper/30 hidden md:block">{country.code}</span>
          </motion.div>
        ))}
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-8 space-y-2">
        {COUNTRIES.map((country, i) => (
          <motion.div
            key={country.code}
            className="flex items-center gap-1.5 justify-end"
            animate={{ opacity: i === activeIndex ? 1 : 0.2 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-[8px] font-mono text-paper/30 hidden md:block">{country.code}</span>
            <div
              className="w-1 h-1 rounded-full"
              style={{
                background: i === activeIndex ? country.color : 'rgba(246,243,234,0.2)',
                boxShadow: i === activeIndex ? `0 0 6px ${country.color}60` : 'none',
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
