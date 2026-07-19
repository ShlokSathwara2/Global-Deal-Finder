'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import CountryCard from './CountryCard'
import SplitFlapTicker from './SplitFlapTicker'
import StampAnimation from './StampAnimation'
import ConfettiBurst from './ConfettiBurst'
import WorldMap from './WorldMap'
import { Clock, ShoppingCart, CreditCard, AlertTriangle, ExternalLink, Sparkles, Globe } from 'lucide-react'

interface Scenario {
  country: string
  currency: string
  symbol: string
  home_currency: string
  home_symbol: string
  sellers: any[]
  total_sellers: number
  best_price: number | null
  best_price_home: number | null
  best_seller: string
  best_url: string
  best_emi_price: number | null
  best_emi_price_home: number | null
  best_emi_monthly: number | null
  best_emi_monthly_home: number | null
  best_emi_seller: string
  best_emi_url: string
  country_best: string
}

interface TimingInfo {
  next_event: string | null
  date_range: string
  expected_discount: string
  days_away: number
  recommendation: string
}

interface ResultsViewProps {
  data: {
    product: string
    home_country: string
    home_currency: string
    home_symbol: string
    scenarios: Scenario[]
    best_country: string
    best_price: number
    best_price_home: number
    best_seller: string
    best_url: string
    best_emi_country: string
    best_emi_price: number
    best_emi_price_home: number
    best_emi_monthly: number
    best_emi_monthly_home: number
    best_emi_seller: string
    best_emi_url: string
    timing: Record<string, TimingInfo>
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
}

export default function ResultsView({ data }: ResultsViewProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [highlightedCountry, setHighlightedCountry] = useState<string | null>(null)
  const countryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const {
    product, home_country, home_currency, home_symbol, scenarios, best_country, best_price, best_price_home, best_seller, best_url,
    best_emi_country, best_emi_price, best_emi_price_home, best_emi_monthly, best_emi_monthly_home, best_emi_seller, best_emi_url, timing,
  } = data
  const bestScenario = scenarios.find(s => s.country === best_country)
  const bestEmiScenario = scenarios.find(s => s.country === best_emi_country)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 800)
    return () => clearTimeout(timer)
  }, [])

  const handleCountryClick = useCallback((country: string) => {
    setHighlightedCountry(country)
    const el = countryRefs.current[country]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    setTimeout(() => setHighlightedCountry(null), 2000)
  }, [])

  return (
    <motion.div
      className="space-y-8 mt-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <ConfettiBurst trigger={showConfetti} />

      {/* Product header */}
      <motion.div variants={itemVariants} className="text-center">
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono mb-4"
          style={{
            background: 'rgba(47,111,98,0.1)',
            border: '1px solid rgba(47,111,98,0.2)',
            color: 'rgba(47,111,98,0.8)',
          }}
        >
          <Sparkles size={12} />
          Analysis Complete
        </motion.div>
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">{product}</h2>
        <p className="text-paper/50 text-sm">
          Comparing prices across {scenarios.length} countries
          <span className="ml-2 text-brass/60">| Showing all prices in {home_symbol}{home_currency}</span>
        </p>
      </motion.div>

      {/* World Map */}
      <motion.div variants={itemVariants}>
        <WorldMap
          bestCountry={best_country}
          countries={scenarios.map(s => s.country)}
          onCountryClick={handleCountryClick}
        />
      </motion.div>

      {/* Best deals grid */}
      <motion.div variants={itemVariants} className="grid md:grid-cols-2 gap-4">
        <StampAnimation>
          <a href={best_url || '#'} target="_blank" rel="noopener noreferrer"
            className="block rounded-xl p-6 text-center hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
            style={{
              background: 'rgba(11,18,32,0.8)',
              border: '2px solid rgba(47,111,98,0.3)',
              boxShadow: '0 0 30px rgba(47,111,98,0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ShoppingCart size={18} className="text-teal" />
                <p className="text-sm text-teal font-mono tracking-wider">BEST ONE-TIME PRICE</p>
              </div>
              {/* Show home currency price as primary */}
              <SplitFlapTicker value={best_price_home} symbol={home_symbol} className="justify-center mb-1" />
              {/* Show original price as secondary */}
              <p className="text-paper/30 text-xs font-mono mb-2">
                {bestScenario?.symbol}{best_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {bestScenario?.currency}
              </p>
              <p className="text-paper/60 text-sm">
                from <span className="font-semibold text-paper">{best_seller}</span> in{' '}
                <span className="font-semibold text-paper">{best_country}</span>
              </p>
              <p className="flex items-center justify-center gap-1 text-xs text-brass mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                Visit store <ExternalLink size={10} />
              </p>
            </div>
          </a>
        </StampAnimation>

        <StampAnimation>
          <a href={best_emi_url || '#'} target="_blank" rel="noopener noreferrer"
            className="block rounded-xl p-6 text-center hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
            style={{
              background: 'rgba(11,18,32,0.8)',
              border: '2px solid rgba(138,109,30,0.3)',
              boxShadow: '0 0 30px rgba(138,109,30,0.05)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CreditCard size={18} className="text-brass" />
                <p className="text-sm text-brass font-mono tracking-wider">BEST EMI DEAL</p>
              </div>
              <SplitFlapTicker value={best_emi_monthly_home} symbol={home_symbol} className="justify-center mb-1" />
              <p className="text-paper/50 text-sm">
                per month for 12 months
              </p>
              <p className="text-paper/40 text-xs mt-1">
                Total: {home_symbol}{best_emi_price_home?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span className="ml-1 text-paper/25">({bestEmiScenario?.symbol}{best_emi_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {bestEmiScenario?.currency})</span>
              </p>
              <p className="text-paper/60 mt-2 text-sm">
                from <span className="font-semibold text-paper">{best_emi_seller}</span> in{' '}
                <span className="font-semibold text-paper">{best_emi_country}</span>
              </p>
              <p className="flex items-center justify-center gap-1 text-xs text-brass mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                Visit store <ExternalLink size={10} />
              </p>
            </div>
          </a>
        </StampAnimation>
      </motion.div>

      {/* Timing Insights */}
      {Object.keys(timing).length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="rounded-xl p-5" style={{
            background: 'rgba(11,18,32,0.6)',
            border: '1px solid rgba(138,109,30,0.12)',
          }}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-brass" />
              <h3 className="font-display font-semibold text-lg">Timing Insights</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(timing).slice(0, 4).map(([country, info], i) => (
                <motion.div
                  key={country}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`rounded-lg p-3 text-sm ${
                    info.recommendation === 'wait'
                      ? 'bg-ochre/10 border border-ochre/20'
                      : 'bg-teal/5 border border-teal/15'
                  }`}
                >
                  <p className="font-mono font-semibold text-xs">{country}</p>
                  {info.next_event ? (
                    <>
                      <p className="text-xs text-paper/50 mt-1">{info.next_event}</p>
                      <p className="text-xs text-paper/40">{info.days_away}d away · {info.expected_discount} off</p>
                    </>
                  ) : (
                    <p className="text-xs text-paper/50 mt-1">No upcoming sales</p>
                  )}
                  <p className={`text-xs font-semibold mt-1 ${
                    info.recommendation === 'wait' ? 'text-ochre' : 'text-teal'
                  }`}>
                    {info.recommendation === 'wait' ? '\u23F3 Wait' : '\u2713 Buy now'}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* All Countries */}
      <motion.div variants={itemVariants}>
        <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <Globe size={20} className="text-brass" />
          All Countries Compared
          <span className="text-sm font-normal text-paper/40 ml-2">(sorted by {home_symbol} price)</span>
        </h3>
        <div className="grid gap-4">
          {scenarios.map((scenario, i) => (
            <motion.div
              key={scenario.country}
              ref={(el) => { countryRefs.current[scenario.country] = el }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
            >
              <CountryCard
                country={scenario.country}
                currency={scenario.currency}
                symbol={scenario.symbol}
                homeCurrency={scenario.home_currency}
                homeSymbol={scenario.home_symbol}
                totalSellers={scenario.total_sellers}
                sellers={scenario.sellers}
                bestPrice={scenario.best_price}
                bestPriceHome={scenario.best_price_home}
                bestSeller={scenario.best_seller}
                bestUrl={scenario.best_url}
                bestEmiPrice={scenario.best_emi_price}
                bestEmiPriceHome={scenario.best_emi_price_home}
                bestEmiMonthly={scenario.best_emi_monthly}
                bestEmiMonthlyHome={scenario.best_emi_monthly_home}
                bestEmiSeller={scenario.best_emi_seller}
                bestEmiUrl={scenario.best_emi_url}
                countryBest={scenario.country_best}
                isBestCountry={scenario.country === best_country}
                isBestEmiCountry={scenario.country === best_emi_country}
                homeCountry={home_country}
                product={product}
                isHighlighted={scenario.country === highlightedCountry}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Disclaimer */}
      {home_country && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl p-4 text-sm text-paper/40"
          style={{
            background: 'rgba(11,18,32,0.4)',
            border: '1px solid rgba(138,109,30,0.08)',
          }}
        >
          <AlertTriangle size={14} className="inline mr-2 text-brass/60" />
          Importing to {home_country} may incur customs duty. &quot;Carried&quot; prices assume the product is brought in
          personal baggage under the duty-free limit. EMI rates are estimated at 12% interest over 12 months.
          All prices shown in {home_symbol}{home_currency} for easy comparison.
        </motion.div>
      )}
    </motion.div>
  )
}
