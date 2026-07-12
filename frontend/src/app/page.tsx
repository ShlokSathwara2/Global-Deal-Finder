'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Loader2, MapPin, Sparkles, ChevronRight, X } from 'lucide-react'
import ResultsView from '@/components/ResultsView'
import { SplineScene } from '@/components/ui/splite'

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'US', name: 'USA', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'AE', name: 'UAE', flag: '\u{1F1E6}\u{1F1EA}' },
  { code: 'UK', name: 'UK', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { code: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' },
]

interface Suggestion {
  text: string
  relevance: number
}

interface ClarifyOption {
  question: string
  options: string[]
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [homeCountry, setHomeCountry] = useState('IN')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [clarify, setClarify] = useState<{ original_query: string; needs_clarification: boolean; questions: ClarifyOption[]; clarified_product?: string } | null>(null)
  const [clarifyLoading, setClarifyLoading] = useState(false)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const splineRef = useRef<any>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      return
    }
    setSuggestLoading(true)
    try {
      const res = await fetch(`https://global-deal-finder.onrender.com/suggest?q=${encodeURIComponent(q)}&country=${homeCountry}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(data.suggestions || [])
      }
    } catch {
    } finally {
      setSuggestLoading(false)
    }
  }, [homeCountry])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSplineLoad = useCallback((spline: any) => {
    splineRef.current = spline
  }, [])

  // Enhanced smooth eye tracking with more natural, human-like movement
  const targetRot = useRef({ x: 0, y: 0 })
  const currentRot = useRef({ x: 0, y: 0 })
  const rafId = useRef<number | null>(null)
  const lastMoveTime = useRef<number>(0)
  const isMoving = useRef<boolean>(false)
  const blinkTimer = useRef<NodeJS.Timeout | null>(null)

  const animateEyes = useCallback(() => {
    const spline = splineRef.current
    if (!spline) {
      rafId.current = requestAnimationFrame(animateEyes)
      return
    }

    // Calculate time since last movement for more natural easing
    const deltaTime = Date.now() - lastMoveTime.current
    const movementFactor = Math.min(1, deltaTime / 100) // Dampens when not moving

    // More organic, human-like movement with subtle variations
    const baseEase = 0.06
    const variation = Math.sin(Date.now() * 0.002) * 0.015 // Subtle breathing movement
    const easeFactor = baseEase + variation + (0.04 * movementFactor)

    currentRot.current.x += (targetRot.current.x - currentRot.current.x) * easeFactor
    currentRot.current.y += (targetRot.current.y - currentRot.current.y) * easeFactor

    try {
      const head = spline.findObjectByName('Head') || spline.findObjectByName('head')
      const eyeL = spline.findObjectByName('EyeL') || spline.findObjectByName('eye_l') || spline.findObjectByName('LeftEye') || spline.findObjectByName('eyeL')
      const eyeR = spline.findObjectByName('EyeR') || spline.findObjectByName('eye_r') || spline.findObjectByName('RightEye') || spline.findObjectByName('eyeR')
      const eye = spline.findObjectByName('Eye') || spline.findObjectByName('eye') || spline.findObjectByName('Eyes')

      const rotX = currentRot.current.x
      const rotY = currentRot.current.y

      // Add subtle micro-movements for lifelike quality (like tiny eye twitches)
      const microMoveX = Math.sin(Date.now() * 0.007) * 0.3 + Math.sin(Date.now() * 0.013) * 0.1
      const microMoveY = Math.sin(Date.now() * 0.005) * 0.2 + Math.sin(Date.now() * 0.011) * 0.1

      if (head) {
        // Head moves slightly less than eyes for natural proportion
        head.rotation.x = (rotX * 0.5) + (microMoveX * 0.1)
        head.rotation.y = (rotY * 0.5) + (microMoveY * 0.1)
      }
      if (eyeL) {
        eyeL.rotation.x = rotX + microMoveX
        eyeL.rotation.y = rotY + microMoveY
      }
      if (eyeR) {
        eyeR.rotation.x = rotX + microMoveX
        eyeR.rotation.y = rotY + microMoveY
      }
      if (eye && !eyeL && !eyeR) {
        eye.rotation.x = rotX + microMoveX
        eye.rotation.y = rotY + microMoveY
      }
    } catch {}

    rafId.current = requestAnimationFrame(animateEyes)
  }, [])

  useEffect(() => {
    rafId.current = requestAnimationFrame(animateEyes)
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
      if (blinkTimer.current) clearTimeout(blinkTimer.current)
    }
  }, [animateEyes])

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return

    lastMoveTime.current = Date.now()
    isMoving.current = true

    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top

    // Enhanced cursor-following spotlight with dynamic glow
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${relX}px`
      spotlightRef.current.style.top = `${relY}px`
      spotlightRef.current.style.opacity = '1'

      // Dynamic glow based on movement speed - calculate time since last move
      const speedDeltaTime = Date.now() - lastMoveTime.current
      const speedFactor = Math.min(1, speedDeltaTime / 50) // Faster movement = stronger glow
      spotlightRef.current.style.background = `radial-gradient(circle at center, rgba(255,255,255,${0.2 + speedFactor * 0.1}) 0%, rgba(255,255,255,${0.08 + speedFactor * 0.04}) 30%, transparent 70%)`
    }

    // Enhanced custom cursor with subtle pulse
    if (cursorRef.current) {
      cursorRef.current.style.left = `${relX}px`
      cursorRef.current.style.top = `${relY}px`
      cursorRef.current.style.opacity = '1'
    }

    // Set eye tracking target with more natural, restrained movement
    // Reduced range for more subtle, human-like movement
    const x = ((relX / rect.width) - 0.5) * 1.2
    const y = ((relY / rect.height) - 0.5) * 1.2
    targetRot.current.y = x * 20
    targetRot.current.x = -y * 12
  }, [])

  const handleHeroMouseLeave = useCallback(() => {
    if (spotlightRef.current) {
      spotlightRef.current.style.opacity = '0'
    }
    if (cursorRef.current) {
      cursorRef.current.style.opacity = '0'
    }
  }, [])

  const doSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setResults(null)
    setClarify(null)
    setShowSuggestions(false)

    try {
      const clarifyRes = await fetch('https://global-deal-finder.onrender.com/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: searchQuery }),
      })
      if (clarifyRes.ok) {
        const clarifyData = await clarifyRes.json()
        if (clarifyData.needs_clarification && clarifyData.questions?.length > 0) {
          setClarify(clarifyData)
          setLoading(false)
          return
        }
        const finalProduct = clarifyData.clarified_product || searchQuery
        setQuery(finalProduct)
        await runCompare(finalProduct)
      } else {
        await runCompare(searchQuery)
      }
    } catch {
      await runCompare(searchQuery)
    }
  }

  const runCompare = async (product: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('https://global-deal-finder.onrender.com/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, home_country: homeCountry }),
      })
      if (!res.ok) throw new Error('Failed to fetch comparison')
      const data = await res.json()
      setResults(data)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClarifyAnswer = async (questionIdx: number, answer: string) => {
    const updated = { ...selectedAnswers, [questionIdx]: answer }
    setSelectedAnswers(updated)

    const allAnswered = clarify?.questions.every((_, i) => updated[i])
    if (allAnswered && clarify) {
      const answerList = Object.values(updated).filter(Boolean)
      setClarify(null)
      setSelectedAnswers({})
      setLoading(true)
      try {
        const res = await fetch('https://global-deal-finder.onrender.com/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ original_query: clarify.original_query, answers: answerList }),
        })
        if (res.ok) {
          const data = await res.json()
          const refined = data.refined_product || answerList.join(' ')
          setQuery(refined)
          await runCompare(refined)
        } else {
          const refined = answerList.join(' ')
          setQuery(refined)
          await runCompare(refined)
        }
      } catch {
        const refined = answerList.join(' ')
        setQuery(refined)
        await runCompare(refined)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeSuggestion >= 0 && suggestions[activeSuggestion]) {
        setQuery(suggestions[activeSuggestion].text)
        setShowSuggestions(false)
        doSearch(suggestions[activeSuggestion].text)
      } else {
        doSearch(query)
      }
    } else if (e.key === 'Esc') {
      setShowSuggestions(false)
    }
  }

  return (
    <main className="min-h-screen">
      {/* Hero with 3D Spline background + cursor spotlight */}
      <div
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gradient-to-b from-background/95 to-background/80 cursor-none"
      >
        {/* Enhanced cursor-following spotlight with multiple layers and dynamic glow */}
        <div
          ref={spotlightRef}
          className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-500"
        >
          {/* Outer glow - large and soft */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent blur-3xl animate-pulse-6s" />
          {/* Middle glow - medium intensity */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/15 via-transparent to-transparent blur-xl" />
          {/* Inner glow - bright core */}
          <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent blur-l" />
          {/* Dynamic sparkle effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,transparent_30%,rgba(255,255,255,0.1)_70%)] animate-sparkle-4s" />
        </div>
        {/* Enhanced custom cursor with multiple layers and subtle animations */}
        <div
          ref={cursorRef}
          className="pointer-events-none absolute z-[3] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-400"
        >
          {/* Outer pulse ring */}
          <div className="absolute inset-0 border-2 border-primary/30 rounded-full opacity-0 animate-pulse-4" />
          {/* Middle ring */}
          <div className="absolute inset-0.5 border-1 border-primary/50 rounded-full opacity-0 animate-pulse-3" />
          {/* Inner core with glow */}
          <div className="absolute inset-1 bg-primary/80 rounded-full opacity-0 drop-shadow-[0_0_8px_rgba(138,109,30,0.6)]" />
          {/* Tiny center dot */}
          <div className="absolute inset-2 bg-white/80 rounded-full" />
        </div>
        <div className="absolute inset-0 z-0">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
            onSplineLoad={handleSplineLoad}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-center gap-4 mb-6">
              <Globe size={36} className="text-primary drop-shadow-[0_0_15px_rgba(138,109,30,0.3)]" />
              <div className="space-y-1">
                <h1 className="font-display text-4xl md:text-5xl font-bold drop-shadow-[0_0_20px_rgba(138,109,30,0.4)]">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Global Deal Finder
                  </span>
                </h1>
                <p className="text-paper/70 text-lg drop-shadow-md max-w-xl mx-auto">
                  Best Price + Best Card + Best Timing, Worldwide
                </p>
              </div>
            </div>
          </motion.div>
        </div>
        {/* Enhanced bottom gradient with subtle animation */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/90 to-transparent z-10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20 pb-8 md:pb-16">

        {/* Premium Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100, damping: 15 }}
          className="relative group"
        >
          {/* Animated gradient border with glow */}
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 opacity-80 group-hover:opacity-100 transition-opacity duration-800 blur-2xl" />
          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 opacity-60 group-hover:opacity-100 transition-opacity duration-800" />

          <div className="relative bg-background/85 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/10">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative" ref={dropdownRef}>
                <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShowSuggestions(true)
                    setActiveSuggestion(-1)
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="What do you want to buy? e.g. Samsung Galaxy S25 Ultra"
                  className="w-full bg-transparent border-none pl-12 pr-5 py-4 text-white placeholder:text-paper/30 focus:outline-none focus:border-primary/50 focus:bg-background/80 transition-all duration-300 text-base"
                />

                <AnimatePresence>
                  {showSuggestions && (suggestions.length > 0 || suggestLoading) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute top-full left-0 right-0 mt-4 bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      {suggestLoading && (
                        <div className="flex items-center gap-3 px-5 py-4 text-sm text-paper/40">
                          <Loader2 size={16} className="animate-spin text-primary" />
                          <span>Finding suggestions...</span>
                        </div>
                      )}
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQuery(s.text)
                            setShowSuggestions(false)
                            doSearch(s.text)
                          }}
                          className={`w-full text-left px-5 py-3 text-sm flex items-center gap-4 transition-all duration-300 ${
                            i === activeSuggestion
                              ? 'bg-secondary/15 border-l-2 border-secondary text-secondary shadow-lg'
                              : 'hover:bg-background/50 border-l-2 border-transparent text-paper/80 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <Search size={16} className="text-primary/40" />
                          </div>
                          <div className="flex-1">{s.text}</div>
                          <div className="flex-shrink-0">
                            <ChevronRight size={14} className="text-paper/20" />
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <MapPin size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/50 pointer-events-none" />
                <select
                  value={homeCountry}
                  onChange={(e) => setHomeCountry(e.target.value)}
                  className="w-full md:w-auto bg-transparent border-none pl-12 pr-9 py-4 text-white appearance-none focus:outline-none focus:border-primary/50 focus:bg-background/80 transition-all duration-300 text-base cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-background text-white">{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, rotate: [0, 1, 0] }}
                whileTap={{ scale: 0.98 }}
                onClick={() => doSearch(query)}
                disabled={loading || !query.trim()}
                className="relative w-full md:w-auto bg-gradient-to-r from-primary to-secondary text-background font-semibold px-6 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-400 shadow-xl shadow-primary/30 hover:shadow-primary/40 active:scale-[0.97]"
              >
                <div className="flex items-center gap-3">
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search size={20} />
                      <span>Compare Prices</span>
                    </>
                  )}
                </div>
              </motion.button>
            </div>
            <p className="text-xs text-paper/30 mt-4 text-center">
              Searches across Amazon, Flipkart, Best Buy, and 100+ retailers in 7 countries
            </p>
          </div>
        </motion.div>

        <AnimatePresence>
          {clarify && clarify.questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative mt-8"
            >
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-brass/20 via-teal/20 to-brass/20 opacity-50 blur-sm" />
              <div className="relative bg-ink-navy/90 backdrop-blur-xl border border-white/5 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-brass" />
                  <h3 className="font-display text-lg font-semibold">Let me narrow that down for you</h3>
                </div>
                <p className="text-sm text-paper/50 mb-5">
                  Your search &quot;{clarify.original_query}&quot; could mean a few things. Pick what you need:
                </p>
                <div className="space-y-4">
                  {clarify.questions.map((q, qi) => (
                    <div key={qi}>
                      <p className="text-sm font-medium text-paper/70 mb-2">{q.question}</p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt, oi) => (
                          <motion.button
                            key={oi}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleClarifyAnswer(qi, opt)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                              selectedAnswers[qi] === opt
                                ? 'bg-teal/20 border-teal text-teal shadow-lg shadow-teal/10'
                                : 'bg-white/5 border-white/10 text-paper/70 hover:border-brass/40 hover:text-paper hover:bg-white/8'
                            }`}
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative mt-6"
            >
              <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-ochre/30 to-ochre/10 blur-sm" />
              <div className="relative bg-ink-navy/90 backdrop-blur-xl border border-ochre/20 rounded-xl p-4 text-center text-ochre">
                {error}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <ResultsView data={results} />
            </motion.div>
          )}
        </AnimatePresence>

        {!results && !loading && !clarify && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-center py-20"
          >
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full" />
              <div className="relative w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                <Globe size={24} className="text-primary/50" />
              </div>
            </div>
            <p className="text-lg text-paper/50 mb-6">
              Enter a product above to compare prices worldwide
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {['iPhone 17 Pro Max', 'Sony WH-1000XM5', 'Dyson V15'].map((term, index) => (
                <motion.button
                  key={term}
                  initial={{ opacity: 0, y: 20 * index }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => { setQuery(term); doSearch(term) }}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300 border border-white/10 hover:border-primary/30 hover:text-paper/60 hover:bg-background/50"
                >
                  {term}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
