'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { Search, Globe, Loader2, MapPin, Sparkles, ChevronRight, X, ArrowRight, Zap, Shield, BarChart3 } from 'lucide-react'
import ResultsView from '@/components/ResultsView'
import { SplineScene } from '@/components/ui/splite'
import { FloatingPaths } from '@/components/ui/background-paths'
import WelcomeScreen from '@/components/WelcomeScreen'
import ShimmerLoader from '@/components/ShimmerLoader'
import MagneticButton from '@/components/MagneticButton'
import RippleButton from '@/components/RippleButton'
import SearchTimer from '@/components/SearchTimer'

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

const STATS = [
  { icon: Globe, value: '7', label: 'Countries' },
  { icon: BarChart3, value: '100+', label: 'Retailers' },
  { icon: Zap, value: 'Real-time', label: 'Prices' },
  { icon: Shield, value: 'Best', label: 'Deals' },
]

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true)
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
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

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

  const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    if (spotlightRef.current) {
      spotlightRef.current.style.left = `${relX}px`
      spotlightRef.current.style.top = `${relY}px`
      spotlightRef.current.style.opacity = '1'
    }
    if (cursorRef.current) {
      cursorRef.current.style.left = `${relX}px`
      cursorRef.current.style.top = `${relY}px`
      cursorRef.current.style.opacity = '1'
    }
  }, [])

  const handleHeroMouseLeave = useCallback(() => {
    if (spotlightRef.current) spotlightRef.current.style.opacity = '0'
    if (cursorRef.current) cursorRef.current.style.opacity = '0'
  }, [])

  const doSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    setResults(null)
    setClarify(null)
    setShowSuggestions(false)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000)
      const clarifyRes = await fetch('https://global-deal-finder.onrender.com/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: searchQuery }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
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
    } catch (err: unknown) {
      console.error('Search error:', err)
      await runCompare(searchQuery)
    }
  }

  const runCompare = async (product: string) => {
    setLoading(true)
    setError('')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 90000)
      const res = await fetch('https://global-deal-finder.onrender.com/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, home_country: homeCountry }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ detail: 'Server error' }))
        throw new Error(errBody.detail || `Request failed (${res.status})`)
      }
      const data = await res.json()
      setResults(data)
    } catch (err: unknown) {
      console.error('Compare error:', err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('Server is waking up, please try again in a moment.')
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error. Check your connection and try again.')
      } else {
        setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      }
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
    <>
      {showWelcome && <WelcomeScreen onEnter={() => setShowWelcome(false)} />}

      <main className="min-h-screen">
        {/* Hero Section */}
        <motion.div
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="relative w-full overflow-hidden cursor-none"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Animated background */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0" style={{
              background: 'linear-gradient(135deg, #0B1220 0%, #0d1525 30%, #0B1220 60%, #0a1018 100%)',
            }} />
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(138,109,30,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(47,111,98,0.06) 0%, transparent 50%)',
            }} />

            {/* Animated gradient mesh */}
            <div className="gradient-mesh" />

            {/* Animated grid */}
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(rgba(138,109,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(138,109,30,0.04) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
              }}
              animate={{ backgroundPosition: ['0 0', '60px 60px'] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  background: i % 3 === 0 ? 'rgba(138,109,30,0.4)' : i % 3 === 1 ? 'rgba(47,111,98,0.4)' : 'rgba(246,243,234,0.15)',
                  left: `${10 + i * 12}%`,
                  top: `${15 + (i * 13) % 70}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 4 + i,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'easeInOut',
                }}
              />
            ))}

            {/* Floating paths animation */}
            <div className="absolute inset-0 opacity-30">
              <FloatingPaths position={1} />
              <FloatingPaths position={-1} />
            </div>
          </div>

          {/* Spline 3D background */}
          <div className="absolute inset-0 z-0">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full opacity-30"
            />
          </div>

          {/* Cursor spotlight */}
          <div
            ref={spotlightRef}
            className="pointer-events-none absolute z-[2] -translate-x-1/2 -translate-y-1/2 opacity-0"
            style={{ transition: 'opacity 0.4s ease', width: 600, height: 600 }}
          >
            <div className="absolute inset-0 blur-3xl" style={{ background: 'radial-gradient(circle, rgba(138,109,30,0.12) 0%, transparent 70%)', animation: 'pulse-glow 6s ease-in-out infinite' }} />
            <div className="absolute inset-0 blur-xl" style={{ background: 'radial-gradient(circle, rgba(138,109,30,0.18) 0%, transparent 60%)' }} />
          </div>

          {/* Custom cursor */}
          <div
            ref={cursorRef}
            className="pointer-events-none absolute z-[3] -translate-x-1/2 -translate-y-1/2 opacity-0"
            style={{ transition: 'opacity 0.2s ease', width: 40, height: 40 }}
          >
            <div className="absolute inset-0 rounded-full border-2 opacity-50" style={{ borderColor: 'rgba(138,109,30,0.4)', animation: 'pulse-ring 4s ease-in-out infinite' }} />
            <div className="absolute rounded-full bg-white" style={{ inset: 12, opacity: 0.9 }} />
          </div>

          {/* Hero content */}
          <div className="relative z-10 h-[500px] md:h-[600px] flex flex-col items-center justify-center px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-3xl"
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono mb-8"
                style={{
                  background: 'rgba(138,109,30,0.1)',
                  border: '1px solid rgba(138,109,30,0.2)',
                  color: 'rgba(246,243,234,0.7)',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Sparkles size={12} className="text-brass" />
                AI-Powered Price Comparison
              </motion.div>

              {/* Main title */}
              <motion.h1
                className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-6"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 1, ease: [0.4, 0, 0.2, 1] }}
              >
                <span className="block" style={{
                  background: 'linear-gradient(135deg, #F6F3EA 0%, #F6F3EA 50%, rgba(138,109,30,0.8) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 30px rgba(138,109,30,0.15))',
                }}>
                  Find the Best
                </span>
                <span className="block mt-2" style={{
                  background: 'linear-gradient(135deg, #8A6D1E 0%, #2F6F62 50%, #8A6D1E 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 30px rgba(138,109,30,0.2))',
                }}>
                  Deal Anywhere
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                className="text-lg md:text-xl text-paper/40 max-w-xl mx-auto mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                Compare prices, card offers, and EMI deals across{' '}
                <span className="text-brass/80">7 countries</span> and{' '}
                <span className="text-brass/80">100+ retailers</span> in seconds.
              </motion.p>

              {/* Stats */}
              <motion.div
                className="flex justify-center gap-6 md:gap-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                {STATS.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="text-center"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <stat.icon size={14} className="text-brass/60" />
                      <span className="text-xl md:text-2xl font-bold font-mono text-paper/80">{stat.value}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-paper/30 font-mono">{stat.label}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10" style={{ background: 'linear-gradient(to top, #0B1220, transparent)' }} />
        </motion.div>

        {/* Search + Content */}
        <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-20 pb-8 md:pb-16">

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 80, damping: 15 }}
            className="relative group"
          >
            {/* Animated border glow */}
            <motion.div
              className="absolute -inset-[2px] rounded-2xl animate-rotate-border"
              style={{
                background: 'linear-gradient(to right, rgba(138,109,30,0.3), rgba(47,111,98,0.3), rgba(138,109,30,0.3))',
                opacity: searchFocused ? 0.9 : 0.5,
                backgroundSize: '200% 200%',
              }}
            />

            <div className="relative rounded-2xl p-6 md:p-8" style={{
              background: 'rgba(11,18,32,0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(138,109,30,0.1)',
            }}>
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
                    onFocus={() => { setSearchFocused(true); suggestions.length > 0 && setShowSuggestions(true) }}
                    onBlur={() => setSearchFocused(false)}
                    onKeyDown={handleKeyDown}
                    placeholder="What do you want to buy?"
                    className="w-full bg-transparent border-none pl-12 pr-5 py-4 text-white placeholder:text-paper/25 focus:outline-none transition-all duration-300 text-base"
                  />

                  <AnimatePresence>
                    {showSuggestions && (suggestions.length > 0 || suggestLoading) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute top-full left-0 right-0 mt-4 rounded-2xl overflow-hidden z-50"
                        style={{
                          background: 'rgba(11,18,32,0.98)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(138,109,30,0.15)',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                        }}
                      >
                        {suggestLoading && (
                          <div className="flex items-center gap-3 px-5 py-4 text-sm text-paper/40">
                            <Loader2 size={16} className="animate-spin text-primary" />
                            <span>Finding suggestions...</span>
                          </div>
                        )}
                        {suggestions.map((s, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => {
                              setQuery(s.text)
                              setShowSuggestions(false)
                              doSearch(s.text)
                            }}
                            className={`w-full text-left px-5 py-3 text-sm flex items-center gap-4 transition-all duration-200 ${
                              i === activeSuggestion
                                ? 'bg-secondary/10 border-l-2 border-secondary text-secondary'
                                : 'hover:bg-white/3 border-l-2 border-transparent text-paper/70 hover:border-primary/20'
                            }`}
                          >
                            <Search size={14} className="text-primary/30 flex-shrink-0" />
                            <span className="flex-1">{s.text}</span>
                            <ChevronRight size={12} className="text-paper/15 flex-shrink-0" />
                          </motion.button>
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
                    className="w-full md:w-auto bg-transparent border-none pl-12 pr-9 py-4 text-white appearance-none focus:outline-none transition-all duration-300 text-base cursor-pointer"
                  >
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code} className="bg-background text-white">{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>

                <MagneticButton strength={0.15}>
                  <RippleButton
                    onClick={() => doSearch(query)}
                    className={`w-full md:w-auto font-semibold px-8 py-4 rounded-xl transition-all duration-300 overflow-hidden group/btn ${
                      loading || !query.trim() ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(135deg, #8A6D1E, #2F6F62)',
                        color: '#0B1220',
                        boxShadow: '0 0 30px rgba(138,109,30,0.2)',
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }}
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    />
                    <div className="relative flex items-center justify-center gap-3">
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
                  </RippleButton>
                </MagneticButton>
              </div>

              <p className="text-xs text-paper/25 mt-4 text-center font-mono">
                Searches across Amazon, Flipkart, Best Buy, and 100+ retailers in 7 countries
              </p>
            </div>
          </motion.div>

          {/* Clarify modal */}
          <AnimatePresence>
            {clarify && clarify.questions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="relative mt-8"
              >
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-brass/15 via-teal/15 to-brass/15 opacity-50 blur-sm" />
                <div className="relative rounded-2xl p-6 md:p-8" style={{
                  background: 'rgba(11,18,32,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
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
                            <MagneticButton key={oi} strength={0.1}>
                              <motion.button
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
                            </MagneticButton>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative mt-6"
              >
                <div className="relative rounded-xl p-4 text-center text-ochre" style={{
                  background: 'rgba(156,63,46,0.1)',
                  border: '1px solid rgba(156,63,46,0.2)',
                }}>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading timer */}
          {loading && !results && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SearchTimer estimatedSeconds={15} query={query} />
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <ResultsView data={results} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!results && !loading && !clarify && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-center py-20"
            >
              {/* Animated icon */}
              <motion.div
                className="relative inline-block mb-8"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150" />
                <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center" style={{
                  background: 'linear-gradient(135deg, rgba(138,109,30,0.1), rgba(47,111,98,0.1))',
                  border: '1px solid rgba(138,109,30,0.2)',
                  boxShadow: '0 0 40px rgba(138,109,30,0.1)',
                }}>
                  <Globe size={28} className="text-primary/60" />
                </div>
              </motion.div>

              <h3 className="text-xl font-display font-semibold text-paper/60 mb-2">
                Ready to find the best deal?
              </h3>
              <p className="text-sm text-paper/30 mb-8 max-w-md mx-auto">
                Enter any product above and we will compare prices, card offers, and EMI deals across the globe.
              </p>

              {/* Suggestion pills */}
              <div className="flex flex-wrap justify-center gap-3">
                {['iPhone 17 Pro Max', 'Sony WH-1000XM5', 'Dyson V15', 'Samsung Galaxy S25 Ultra'].map((term, index) => (
                  <MagneticButton key={term} strength={0.12}>
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setQuery(term); doSearch(term) }}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
                      style={{
                        background: 'rgba(246,243,234,0.03)',
                        border: '1px solid rgba(246,243,234,0.08)',
                        color: 'rgba(246,243,234,0.5)',
                      }}
                    >
                      {term}
                    </motion.button>
                  </MagneticButton>
                ))}
              </div>

              {/* Bottom features */}
              <motion.div
                className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
              >
                {[
                  { icon: Zap, label: 'Instant Results' },
                  { icon: Shield, label: 'Trusted Sellers' },
                  { icon: BarChart3, label: 'Price History' },
                ].map((feat, i) => (
                  <div key={feat.label} className="text-center">
                    <feat.icon size={18} className="mx-auto mb-2 text-brass/40" />
                    <p className="text-[10px] uppercase tracking-wider text-paper/25 font-mono">{feat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
    </>
  )
}
