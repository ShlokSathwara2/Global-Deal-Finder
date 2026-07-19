'use client'

import { motion } from 'framer-motion'

interface WorldMapProps {
  bestCountry?: string
  countries?: string[]
  onCountryClick?: (country: string) => void
}

const COUNTRY_POSITIONS: Record<string, { x: number; y: number; label: string; flag: string }> = {
  IN: { x: 68, y: 48, label: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
  US: { x: 22, y: 35, label: 'USA', flag: '\u{1F1FA}\u{1F1F8}' },
  AE: { x: 58, y: 45, label: 'UAE', flag: '\u{1F1E6}\u{1F1EA}' },
  UK: { x: 47, y: 28, label: 'UK', flag: '\u{1F1EC}\u{1F1E7}' },
  AU: { x: 82, y: 72, label: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  DE: { x: 50, y: 30, label: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  CA: { x: 22, y: 25, label: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
}

export default function WorldMap({ bestCountry = '', countries = [], onCountryClick }: WorldMapProps) {
  const activeCountries = countries.length > 0 ? countries : Object.keys(COUNTRY_POSITIONS)

  return (
    <motion.div
      className="relative w-full aspect-[2/1] rounded-xl overflow-hidden"
      style={{
        background: 'rgba(11,18,32,0.5)',
        border: '1px solid rgba(138,109,30,0.1)',
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* SVG World Map Outline */}
      <svg
        viewBox="0 0 100 50"
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.15 }}
      >
        {/* Simplified world continents */}
        {/* North America */}
        <path d="M10,15 Q15,10 25,12 L30,18 Q28,22 25,25 L20,28 Q15,30 12,28 L10,22 Z" fill="rgba(138,109,30,0.3)" />
        {/* South America */}
        <path d="M22,32 Q28,30 30,35 L32,45 Q28,48 25,45 L22,38 Z" fill="rgba(138,109,30,0.2)" />
        {/* Europe */}
        <path d="M44,18 Q48,15 52,17 L54,22 Q52,25 48,26 L45,24 Z" fill="rgba(138,109,30,0.3)" />
        {/* Africa */}
        <path d="M46,28 Q52,26 55,30 L56,40 Q52,44 48,42 L46,35 Z" fill="rgba(138,109,30,0.2)" />
        {/* Asia */}
        <path d="M55,15 Q65,10 75,15 L80,25 Q78,32 70,35 L60,30 Q55,25 55,20 Z" fill="rgba(138,109,30,0.3)" />
        {/* India */}
        <path d="M65,30 Q70,28 72,32 L70,42 Q66,44 64,40 Z" fill="rgba(138,109,30,0.4)" />
        {/* Australia */}
        <path d="M78,38 Q85,35 88,40 L86,46 Q82,48 78,44 Z" fill="rgba(138,109,30,0.3)" />
      </svg>

      {/* Animated grid lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(138,109,30,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(138,109,30,0.03) 1px, transparent 1px)',
        backgroundSize: '10% 10%',
      }} />

      {/* Connection lines between countries */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {activeCountries.map((code, i) => {
          const pos = COUNTRY_POSITIONS[code]
          if (!pos) return null
          const nextCode = activeCountries[(i + 1) % activeCountries.length]
          const nextPos = COUNTRY_POSITIONS[nextCode]
          if (!nextPos) return null
          return (
            <motion.line
              key={`${code}-${nextCode}`}
              x1={`${pos.x}%`}
              y1={`${pos.y}%`}
              x2={`${nextPos.x}%`}
              y2={`${nextPos.y}%`}
              stroke="rgba(138,109,30,0.08)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: i * 0.2 }}
            />
          )
        })}
      </svg>

      {/* Country dots */}
      {activeCountries.map((code, i) => {
        const pos = COUNTRY_POSITIONS[code]
        if (!pos) return null
        const isBest = code === bestCountry

        return (
          <motion.div
            key={code}
            className="absolute flex flex-col items-center"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
          >
            {/* Pulse ring for best country */}
            {isBest && (
              <>
                <motion.div
                  className="absolute w-10 h-10 rounded-full"
                  style={{ border: '1px solid rgba(47,111,98,0.4)' }}
                  animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute w-10 h-10 rounded-full"
                  style={{ border: '1px solid rgba(47,111,98,0.3)' }}
                  animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                />
              </>
            )}

            {/* Dot */}
            <motion.div
              className="relative z-10 flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400 }}
              onClick={() => onCountryClick?.(code)}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm cursor-pointer"
                style={{
                  background: isBest
                    ? 'linear-gradient(135deg, rgba(47,111,98,0.4), rgba(47,111,98,0.2))'
                    : 'rgba(11,18,32,0.8)',
                  border: isBest
                    ? '2px solid rgba(47,111,98,0.6)'
                    : '1px solid rgba(138,109,30,0.2)',
                  boxShadow: isBest
                    ? '0 0 20px rgba(47,111,98,0.3)'
                    : '0 0 10px rgba(0,0,0,0.3)',
                }}
              >
                {pos.flag}
              </div>

              {/* Label */}
              <motion.div
                className="absolute -bottom-7 whitespace-nowrap text-[10px] font-mono cursor-pointer"
                style={{
                  color: isBest ? 'rgba(47,111,98,0.9)' : 'rgba(246,243,234,0.4)',
                }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => onCountryClick?.(code)}
              >
                {pos.label}
                {isBest && (
                  <span className="ml-1 text-teal">&#9733;</span>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
