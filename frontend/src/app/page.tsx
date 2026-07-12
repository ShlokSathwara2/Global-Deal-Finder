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

  // Smooth eye tracking with lerp
  const targetRot = useRef({ x: 0, y: 0 })
  const currentRot = useRef({ x: 0, y: 0 })
  const rafId = useRef<number | null>(null)

  const animateEyes = useCallback(() => {
    const spline = splineRef.current
    if (!spline) {
      rafId.current = requestAnimationFrame(animateEyes)
      return
    }

    // Lerp towards target for smooth organic movement
    currentRot.current.x += (targetRot.current.x - currentRot.current.x) * 0.08
    currentRot.current.y += (targetRot.current.y - currentRot.current.y) * 0.08

    try {
      const head = spline.findObjectByName('Head') || spline.findObjectByName('head')
      const eyeL = spline.findObjectByName('EyeL') || spline.findObjectByName('eye_l') || spline.findObjectByName('LeftEye') || spline.findObjectByName('eyeL')
      const eyeR = spline.findObjectByName('EyeR') || spline.findObjectByName('eye_r') || spline.findObjectByName('RightEye') || spline.findObjectByName('eyeR')
      const eye = spline.findObjectByName('Eye') || spline.findObjectByName('eye') || spline.findObjectByName('Eyes')

      const rotX = currentRot.current.x
      const rotY = currentRot.current.y

      if (head) { head.rotation.x = rotX * 0.6; head.rotation.y = rotY * 0.6 }
      if (eyeL) { eyeL.rotation.x = rotX; eyeL.rotation.y = rotY }
      if (eyeR) { eyeR.rotation.x = rotX; eyeR.rotation.y = rotY }
      if (eye && !eyeL && !eyeR) { eye.rotation.x = rotX; eye.rotation.y = rotY }
    } catch {}

    rafId.current = requestAnimationFrame(animateEyes)
  }, [])

  useEffect(() => {
    rafId.current = requestAnimationFrame(animateEyes)
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current) }
  }, [animateEyes])

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return

    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top

    // Move cursor-following spotlight
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${relX}px`
      spotlightRef.current.style.top = `${relY}px`
      spotlightRef.current.style.opacity = '1'
    }

    // Move custom cursor dot
    if (cursorRef.current) {
      cursorRef.current.style.left = `${relX}px`
      cursorRef.current.style.top = `${relY}px`
      cursorRef.current.style.opacity = '1'
    }

    // Set eye tracking target (robot looks toward cursor)
    const x = ((relX / rect.width) - 0.5) * 2
    const y = ((relY / rect.height) - 0.5) * 2
    targetRot.current.y = x * 30
    targetRot.current.x = -y * 20
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
    } else if (e.key === 'Escape') {
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
        className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-black cursor-none"
      >
        {/* Cursor-following spotlight glow */}
        <div
          ref={spotlightRef}
          className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300"
          style={{
            width: '600px',
            height: '600px',
            left: '50%',
            top: '50%',
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 30%, transparent 70%)',
          }}
        />
        {/* Custom cursor dot */}
        <div
          ref={cursorRef}
          className="pointer-events-none absolute z-[3] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200"
          style={{
            width: '12px',
            height: '12px',
            left: '50%',
            top: '50%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #8A6D1E 0%, #8A6D1E80 60%, transparent 100%)',
            boxShadow: '0 0 20px 4px rgba(138,109,30,0.5)',
          }}
        />
        <div className="absolute inset-0 z-0">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
            onSplineLoad={handleSplineLoad}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Globe size={32} className="text-brass" />
              <h1 className="font-display text-3xl md:text-5xl font-bold drop-shadow-lg">
                Global Deal Finder
              </h1>
            </div>
            <p className="text-paper/80 text-lg drop-shadow-md max-w-xl mx-auto">
              Best Price + Best Card + Best Timing, Worldwide
            </p>
          </motion.div>
        </div>
        {/* Bottom gradient fade into search area */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-navy to-transparent z-10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20 pb-8 md:pb-16">

        {/* Redesigned Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
          className="relative group"
        >
          {/* Animated glow border */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-brass/40 via-teal/30 to-brass/40 opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-brass/40 via-teal/30 to-brass/40 opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative bg-ink-navy/90 backdrop-blur-xl rounded-2xl p-5 md:p-6 border border-white/5">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative" ref={dropdownRef}>
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brass/60 z-10" />
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-paper placeholder:text-paper/30 focus:outline-none focus:border-brass/50 focus:bg-white/8 transition-all duration-300"
                />

                <AnimatePresence>
                  {showSuggestions && (suggestions.length > 0 || suggestLoading) && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-ink-navy/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {suggestLoading && (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-paper/50">
                          <Loader2 size={14} className="animate-spin text-brass" />
                          Finding suggestions...
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
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-all duration-200 ${
                            i === activeSuggestion
                              ? 'bg-teal/15 text-teal'
                              : 'hover:bg-white/5 text-paper/80'
                          }`}
                        >
                          <Search size={14} className="text-brass/40 shrink-0" />
                          <span className="flex-1">{s.text}</span>
                          <ChevronRight size={14} className="text-paper/20" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brass/60 pointer-events-none" />
                <select
                  value={homeCountry}
                  onChange={(e) => setHomeCountry(e.target.value)}
                  className="w-full md:w-auto bg-white/5 border border-white/10 rounded-xl pl-11 pr-8 py-3.5 text-paper appearance-none focus:outline-none focus:border-brass/50 focus:bg-white/8 transition-all duration-300 cursor-pointer"
                >
                  {COUNTRIES.map(c => (
                    <option key={c.code} value={c.code} className="bg-ink-navy text-paper">{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => doSearch(query)}
                disabled={loading || !query.trim()}
                className="relative bg-gradient-to-r from-brass to-brass/80 text-ink-navy px-7 py-3.5 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-brass/20 hover:shadow-brass/40"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Searching...</>
                ) : (
                  <><Search size={18} /> Compare Prices</>
                )}
              </motion.button>
            </div>
            <p className="text-xs text-paper/30 mt-3 text-center">
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center py-20"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-brass/10 blur-3xl rounded-full" />
              <Globe size={56} className="relative text-brass/40" />
            </div>
            <p className="text-lg text-paper/50">Enter a product above to compare prices worldwide</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['iPhone 17 Pro Max', 'Sony WH-1000XM5', 'Dyson V15'].map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); doSearch(term) }}
                  className="px-4 py-1.5 rounded-full text-sm text-paper/40 border border-white/10 hover:border-brass/30 hover:text-paper/60 transition-all duration-200"
                >
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
