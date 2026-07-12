'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Loader2, MapPin, Sparkles, ChevronRight, X } from 'lucide-react'
import ResultsView from '@/components/ResultsView'

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
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe size={32} className="text-brass" />
            <h1 className="font-display text-3xl md:text-5xl font-bold">
              Global Deal Finder
            </h1>
          </div>
          <p className="text-paper/60 text-lg">
            Best Price + Best Card + Best Timing, Worldwide
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-ink-navy/80 border border-brass/20 rounded-2xl p-4 md:p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative" ref={dropdownRef}>
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/40 z-10" />
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
                className="w-full bg-ink-navy border border-brass/20 rounded-lg pl-10 pr-4 py-3 text-paper placeholder:text-paper/40 focus:outline-none focus:border-brass/50"
              />

              <AnimatePresence>
                {showSuggestions && (suggestions.length > 0 || suggestLoading) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-ink-navy border border-brass/30 rounded-lg shadow-2xl overflow-hidden z-50"
                  >
                    {suggestLoading && (
                      <div className="flex items-center gap-2 px-4 py-3 text-sm text-paper/50">
                        <Loader2 size={14} className="animate-spin" />
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
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition ${
                          i === activeSuggestion
                            ? 'bg-teal/20 text-teal'
                            : 'hover:bg-brass/10 text-paper/80'
                        }`}
                      >
                        <Search size={14} className="text-paper/30 shrink-0" />
                        <span className="flex-1">{s.text}</span>
                        <ChevronRight size={14} className="text-paper/20" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/40" />
              <select
                value={homeCountry}
                onChange={(e) => setHomeCountry(e.target.value)}
                className="bg-ink-navy border border-brass/20 rounded-lg pl-10 pr-8 py-3 text-paper appearance-none focus:outline-none focus:border-brass/50"
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => doSearch(query)}
              disabled={loading || !query.trim()}
              className="bg-brass text-ink-navy px-6 py-3 rounded-lg font-semibold hover:bg-brass/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Searching...</>
              ) : (
                <><Search size={18} /> Compare Prices</>
              )}
            </button>
          </div>
          <p className="text-xs text-paper/40 mt-2 text-center">
            Searches across Amazon, Flipkart, Best Buy, and 100+ retailers in 7 countries
          </p>
        </motion.div>

        <AnimatePresence>
          {clarify && clarify.questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-ink-navy/80 border border-brass/30 rounded-2xl p-6 mb-8"
            >
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
                        <button
                          key={oi}
                          onClick={() => handleClarifyAnswer(qi, opt)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                            selectedAnswers[qi] === opt
                              ? 'bg-teal/20 border-teal text-teal'
                              : 'bg-ink-navy/50 border-brass/10 text-paper/70 hover:border-brass/40 hover:text-paper'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-ochre/20 border border-ochre/30 rounded-xl p-4 text-center text-ochre mb-8"
            >
              {error}
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
            transition={{ delay: 0.5 }}
            className="text-center text-paper/30 py-16"
          >
            <Globe size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Enter a product above to compare prices worldwide</p>
            <p className="text-sm mt-2">Try: "iPhone 17 Pro Max", "Sony WH-1000XM5", "Dyson V15"</p>
          </motion.div>
        )}
      </div>
    </main>
  )
}
