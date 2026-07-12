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

// Bouncing pointer component
function BouncingPointer({
  countries,
  activeIndex,
  markerPositions,
  rotation,
}: {
  countries: typeof COUNTRIES
  activeIndex: number
  markerPositions: Record<string, { angle: number; ring: number }>
  rotation: number
}) {
  const active = countries[activeIndex]
  const pos = markerPositions[active.code]

  // Calculate pointer position on the outer edge of the globe
  // The pointer sits outside and points inward toward the marker
  const pointerAngle = ((pos.angle - rotation) * Math.PI) / 180
  const globeRadius = 150 // half of 300px globe
  const pointerDistance = globeRadius + 35 // distance from center to pointer

  // Position on the circle around the globe
  const px = 210 + Math.cos(pointerAngle) * pointerDistance // 210 = center of 420px container
  const py = 210 + Math.sin(pointerAngle) * pointerDistance

  // Angle the pointer should face (toward center of globe)
  const faceAngle = Math.atan2(210 - py, 210 - px) * (180 / Math.PI)

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Trail dots - ghost positions that fade out */}
      {[...Array(5)].map((_, i) => {
        const trailIndex = ((activeIndex - (i + 1) + countries.length * 2) % countries.length)
        const trailCountry = countries[trailIndex]
        const trailPos = markerPositions[trailCountry.code]
        const trailAngle = ((trailPos.angle - rotation) * Math.PI) / 180
        const trailX = 210 + Math.cos(trailAngle) * pointerDistance
        const trailY = 210 + Math.sin(trailAngle) * pointerDistance

        return (
          <motion.div
            key={`trail-${i}`}
            className="absolute"
            animate={{
              left: trailX,
              top: trailY,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration: 0.3,
              delay: 0,
            }}
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: `${trailCountry.color}20`,
                boxShadow: `0 0 8px ${trailCountry.color}10`,
              }}
            />
          </motion.div>
        )
      })}

      {/* Main bouncing pointer */}
      <motion.div
        className="absolute"
        animate={{
          left: px,
          top: py,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 12,
          mass: 0.8,
        }}
        style={{
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
        }}
      >
        {/* Glow behind pointer */}
        <motion.div
          className="absolute -inset-4 rounded-full"
          animate={{
            background: [
              `radial-gradient(circle, ${active.color}15 0%, transparent 70%)`,
              `radial-gradient(circle, ${active.color}25 0%, transparent 70%)`,
              `radial-gradient(circle, ${active.color}15 0%, transparent 70%)`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Pointer body - pin shape */}
        <motion.div
          className="relative"
          animate={{ rotate: faceAngle }}
          transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        >
          {/* Beam line from pointer to globe center */}
          <div
            className="absolute top-1/2 left-1/2 origin-left"
            style={{
              width: pointerDistance - 20,
              height: '1px',
              background: `linear-gradient(to right, ${active.color}40, transparent)`,
              transform: 'translateY(-50%)',
            }}
          />

          {/* Pointer pin */}
          <motion.div
            className="relative flex items-center justify-center"
            animate={{
              scale: [1, 1.15, 1],
              y: [0, -3, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {/* Pin glow */}
            <div
              className="absolute w-8 h-8 rounded-full"
              style={{
                background: `radial-gradient(circle, ${active.color}30 0%, transparent 70%)`,
                filter: 'blur(4px)',
              }}
            />
            {/* Pin body */}
            <div
              className="relative w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${active.color}, ${active.color}90)`,
                boxShadow: `0 0 12px ${active.color}50, 0 0 24px ${active.color}25, 0 2px 8px rgba(0,0,0,0.3)`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  boxShadow: '0 0 4px rgba(255,255,255,0.5)',
                }}
              />
            </div>
            {/* Pin tail (triangle pointing toward globe) */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `8px solid ${active.color}`,
                filter: `drop-shadow(0 2px 4px ${active.color}40)`,
              }}
            />
          </motion.div>
        </motion.div>

        {/* Ripple rings emanating from pointer */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 20,
              height: 20,
              border: `1px solid ${active.color}30`,
            }}
            animate={{
              scale: [1, 3],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      {/* Country label next to pointer */}
      <motion.div
        className="absolute z-30"
        animate={{
          left: px + (px > 210 ? 25 : -25),
          top: py - 30,
        }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 12,
          mass: 0.8,
        }}
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <motion.div
          key={active.code}
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap"
          style={{
            background: 'rgba(11,18,32,0.9)',
            backdropFilter: 'blur(8px)',
            border: `1px solid ${active.color}30`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.3), 0 0 20px ${active.color}10`,
          }}
        >
          <span className="text-lg">{active.flag}</span>
          <span className="text-xs font-semibold text-paper/90">{active.name}</span>
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: active.color }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
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
        {/* Outer atmosphere glow */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: '82%',
            height: '82%',
            background: `radial-gradient(circle, ${activeCountry.color}08 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Main sphere */}
        <div
          className="relative w-[240px] h-[240px] md:w-[300px] md:h-[300px] rounded-full overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 35% 35%, rgba(47,111,98,0.12) 0%, rgba(11,18,32,0.98) 40%, rgba(11,18,32,1) 100%)',
            boxShadow: `
              inset -40px -40px 80px rgba(0,0,0,0.6),
              inset 15px 15px 40px rgba(138,109,30,0.04),
              0 0 80px rgba(138,109,30,0.06),
              0 0 160px rgba(47,111,98,0.04),
              0 0 1px 1px rgba(138,109,30,0.1)
            `,
          }}
        >
          {/* ---- LAYER 1: Deep atmosphere ---- */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(ellipse at 25% 25%, rgba(47,111,98,0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 75% 75%, rgba(138,109,30,0.06) 0%, transparent 50%)
              `,
            }}
          />

          {/* ---- LAYER 2: Aurora / Nebula effect ---- */}
          <motion.div
            className="absolute inset-0 rounded-full overflow-hidden"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            <motion.div
              className="absolute"
              style={{
                width: '120%',
                height: '40%',
                top: '20%',
                left: '-10%',
                background: `linear-gradient(90deg, transparent, ${activeCountry.color}08, rgba(47,111,98,0.06), transparent)`,
                filter: 'blur(15px)',
              }}
              animate={{
                x: ['-20%', '20%', '-20%'],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute"
              style={{
                width: '40%',
                height: '120%',
                top: '-10%',
                left: '30%',
                background: `linear-gradient(180deg, transparent, rgba(138,109,30,0.05), rgba(47,111,98,0.04), transparent)`,
                filter: 'blur(20px)',
              }}
              animate={{
                y: ['-10%', '10%', '-10%'],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </motion.div>

          {/* ---- LAYER 3: Grid lines (longitude) with pulse ---- */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: rotation }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={`lon-${i}`}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: `${50 + Math.cos((i * 30) * Math.PI / 180) * 50}%`,
                    width: '1px',
                    transform: `perspective(300px) rotateY(${i * 15}deg)`,
                  }}
                  animate={{
                    background: [
                      'linear-gradient(to bottom, transparent, rgba(138,109,30,0.06) 30%, rgba(138,109,30,0.06) 70%, transparent)',
                      'linear-gradient(to bottom, transparent, rgba(138,109,30,0.14) 30%, rgba(138,109,30,0.14) 70%, transparent)',
                      'linear-gradient(to bottom, transparent, rgba(138,109,30,0.06) 30%, rgba(138,109,30,0.06) 70%, transparent)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          </div>

          {/* ---- LAYER 4: Grid lines (latitude) with pulse ---- */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`lat-${i}`}
                className="absolute left-0 right-0"
                style={{
                  top: `${15 + i * 10}%`,
                  height: '1px',
                }}
                animate={{
                  background: [
                    'linear-gradient(to right, transparent, rgba(47,111,98,0.04) 30%, rgba(47,111,98,0.04) 70%, transparent)',
                    'linear-gradient(to right, transparent, rgba(47,111,98,0.1) 30%, rgba(47,111,98,0.1) 70%, transparent)',
                    'linear-gradient(to right, transparent, rgba(47,111,98,0.04) 30%, rgba(47,111,98,0.04) 70%, transparent)',
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>

          {/* ---- LAYER 5: Continents with active glow ---- */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: rotation }}
              transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* North America */}
              <div className="absolute" style={{ left: '12%', top: '25%', width: '18%', height: '22%' }}>
                <div className="w-full h-full rounded-[40%_60%_50%_40%]" style={{
                  background: 'linear-gradient(135deg, rgba(138,109,30,0.08), rgba(138,109,30,0.03))',
                  boxShadow: 'inset 0 0 10px rgba(138,109,30,0.05)',
                }} />
              </div>
              {/* South America */}
              <div className="absolute" style={{ left: '22%', top: '55%', width: '10%', height: '20%' }}>
                <div className="w-full h-full rounded-[50%_40%_60%_40%]" style={{
                  background: 'linear-gradient(135deg, rgba(138,109,30,0.06), rgba(138,109,30,0.02))',
                }} />
              </div>
              {/* Europe */}
              <div className="absolute" style={{ left: '45%', top: '20%', width: '12%', height: '15%' }}>
                <div className="w-full h-full rounded-[40%_50%_40%_60%]" style={{
                  background: 'linear-gradient(135deg, rgba(138,109,30,0.08), rgba(138,109,30,0.03))',
                  boxShadow: 'inset 0 0 8px rgba(138,109,30,0.04)',
                }} />
              </div>
              {/* Africa */}
              <div className="absolute" style={{ left: '48%', top: '40%', width: '14%', height: '25%' }}>
                <div className="w-full h-full rounded-[50%_40%_45%_55%]" style={{
                  background: 'linear-gradient(135deg, rgba(138,109,30,0.06), rgba(138,109,30,0.02))',
                }} />
              </div>
              {/* Asia */}
              <div className="absolute" style={{ left: '60%', top: '22%', width: '22%', height: '25%' }}>
                <div className="w-full h-full rounded-[45%_55%_50%_40%]" style={{
                  background: 'linear-gradient(135deg, rgba(138,109,30,0.08), rgba(138,109,30,0.03))',
                  boxShadow: 'inset 0 0 12px rgba(138,109,30,0.05)',
                }} />
              </div>
              {/* India */}
              <div className="absolute" style={{ left: '66%', top: '38%', width: '6%', height: '10%' }}>
                <div className="w-full h-full rounded-[40%_50%_60%_40%]" style={{
                  background: 'linear-gradient(135deg, rgba(138,109,30,0.12), rgba(138,109,30,0.06))',
                  boxShadow: 'inset 0 0 6px rgba(138,109,30,0.08)',
                }} />
              </div>
              {/* Australia */}
              <div className="absolute" style={{ left: '76%', top: '60%', width: '12%', height: '10%' }}>
                <div className="w-full h-full rounded-[50%_40%_45%_55%]" style={{
                  background: 'linear-gradient(135deg, rgba(138,109,30,0.06), rgba(138,109,30,0.02))',
                }} />
              </div>
            </motion.div>
          </div>

          {/* ---- LAYER 6: Floating cloud particles ---- */}
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`cloud-${i}`}
                className="absolute rounded-full"
                style={{
                  width: `${20 + i * 8}px`,
                  height: `${8 + i * 3}px`,
                  background: `radial-gradient(ellipse, rgba(138,109,30,${0.02 + i * 0.005}) 0%, transparent 70%)`,
                  filter: 'blur(3px)',
                  top: `${20 + (i * 11) % 60}%`,
                  left: `${-10 + (i * 17) % 100}%`,
                }}
                animate={{
                  x: [0, 30 + i * 5, 0],
                  y: [0, -5 + i * 2, 0],
                  opacity: [0.2, 0.5, 0.2],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 1.5,
                }}
              />
            ))}
          </div>

          {/* ---- LAYER 7: Data stream particles ---- */}
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`stream-${i}`}
                className="absolute"
                style={{
                  width: '2px',
                  height: '15px',
                  background: `linear-gradient(to bottom, ${activeCountry.color}40, transparent)`,
                  borderRadius: '2px',
                  left: `${20 + i * 15}%`,
                  top: '-5%',
                }}
                animate={{
                  y: ['0%', '400%'],
                  opacity: [0, 0.8, 0],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: 'linear',
                  delay: i * 0.8,
                }}
              />
            ))}
          </div>

          {/* ---- LAYER 8: Country markers ---- */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {COUNTRIES.map((country, i) => {
              const pos = MARKER_POSITIONS[country.code]
              const isActive = i === activeIndex
              const x = 50 + Math.cos((pos.angle - rotation) * Math.PI / 180) * 40
              const y = 50 + (pos.ring - 1) * 15

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
                  {/* Expanding pulse rings */}
                  {isActive && (
                    <>
                      <motion.div
                        className="absolute -inset-3 rounded-full"
                        style={{ border: `1px solid ${country.color}30` }}
                        animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                      />
                      <motion.div
                        className="absolute -inset-3 rounded-full"
                        style={{ border: `1px solid ${country.color}20` }}
                        animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                      />
                    </>
                  )}

                  {/* Marker dot */}
                  <motion.div
                    className="w-3 h-3 rounded-full relative"
                    style={{
                      background: isActive
                        ? `radial-gradient(circle, ${country.color}, ${country.color}80)`
                        : 'rgba(138,109,30,0.25)',
                      boxShadow: isActive
                        ? `0 0 14px ${country.color}70, 0 0 28px ${country.color}30, 0 0 3px ${country.color}`
                        : 'none',
                    }}
                    animate={isActive ? { scale: [1, 1.4, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <div
                      className="absolute inset-[3px] rounded-full"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.7)' : 'rgba(138,109,30,0.15)',
                      }}
                    />
                  </motion.div>

                  {/* Vertical beam when active */}
                  {isActive && (
                    <motion.div
                      className="absolute left-1/2 -translate-x-1/2 bottom-full"
                      style={{
                        width: '1px',
                        height: '20px',
                        background: `linear-gradient(to top, ${country.color}50, transparent)`,
                      }}
                      initial={{ scaleY: 0, opacity: 0 }}
                      animate={{ scaleY: 1, opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* ---- LAYER 9: Glass reflection ---- */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `
                linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%),
                linear-gradient(315deg, rgba(255,255,255,0.01) 0%, transparent 30%)
              `,
            }}
          />

          {/* ---- LAYER 10: Edge shadow for depth ---- */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4), inset 0 0 120px rgba(0,0,0,0.2)',
            }}
          />

          {/* ---- LAYER 11: Noise texture ---- */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              opacity: 0.03,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 64 64' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '64px 64px',
              mixBlendMode: 'overlay',
            }}
          />

          {/* ---- LAYER 12: Atmosphere rim (outer edge glow) ---- */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, transparent 60%, ${activeCountry.color}06 80%, transparent 100%)`,
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

      {/* Bouncing Pointer - jumps between countries */}
      <BouncingPointer
        countries={COUNTRIES}
        activeIndex={activeIndex}
        markerPositions={MARKER_POSITIONS}
        rotation={rotation}
      />

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
