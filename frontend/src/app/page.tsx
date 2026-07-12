'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Globe, Loader2, MapPin } from 'lucide-react'
import ResultsView from '@/components/ResultsView'

const COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'UK', name: 'UK', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
]

export default function Home() {
  const [query, setQuery] = useState('')
  const [homeCountry, setHomeCountry] = useState('IN')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults(null)

    try {
      const res = await fetch('https://global-deal-finder.onrender.com/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: query, home_country: homeCountry }),
      })
      if (!res.ok) throw new Error('Failed to fetch comparison')
      const data = await res.json()
      setResults(data)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
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
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-paper/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="What do you want to buy? e.g. Samsung Galaxy S25 Ultra"
                className="w-full bg-ink-navy border border-brass/20 rounded-lg pl-10 pr-4 py-3 text-paper placeholder:text-paper/40 focus:outline-none focus:border-brass/50"
              />
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
              onClick={handleSearch}
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

        {!results && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-paper/30 py-16"
          >
            <Globe size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Enter a product above to compare prices worldwide</p>
            <p className="text-sm mt-2">Try: "iPhone 16 Pro Max", "Sony WH-1000XM5", "Dyson V15"</p>
          </motion.div>
        )}
      </div>
    </main>
  )
}
