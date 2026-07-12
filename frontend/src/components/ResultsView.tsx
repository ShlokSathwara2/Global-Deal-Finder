'use client'

import { motion } from 'framer-motion'
import CountryCard from './CountryCard'
import SplitFlapTicker from './SplitFlapTicker'
import StampAnimation from './StampAnimation'
import { Clock, TrendingDown, ShoppingCart, CreditCard, AlertTriangle, ExternalLink } from 'lucide-react'

interface Scenario {
  country: string
  currency: string
  symbol: string
  sellers: any[]
  total_sellers: number
  best_price: number | null
  best_seller: string
  best_url: string
  best_emi_price: number | null
  best_emi_monthly: number | null
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
    scenarios: Scenario[]
    best_country: string
    best_price: number
    best_seller: string
    best_url: string
    best_emi_country: string
    best_emi_price: number
    best_emi_monthly: number
    best_emi_seller: string
    best_emi_url: string
    timing: Record<string, TimingInfo>
  }
}

export default function ResultsView({ data }: ResultsViewProps) {
  const {
    product, home_country, scenarios, best_country, best_price, best_seller, best_url,
    best_emi_country, best_emi_price, best_emi_monthly, best_emi_seller, best_emi_url, timing,
  } = data
  const bestScenario = scenarios.find(s => s.country === best_country)
  const bestEmiScenario = scenarios.find(s => s.country === best_emi_country)

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="font-display text-2xl md:text-3xl font-bold mb-2">{product}</h2>
        <p className="text-paper/60">Comparing prices across {scenarios.length} countries</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-4">
        <StampAnimation>
          <a href={best_url || '#'} target="_blank" rel="noopener noreferrer"
            className="block bg-ink-navy/80 border-2 border-teal rounded-xl p-6 text-center hover:scale-[1.02] transition">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ShoppingCart size={18} className="text-teal" />
              <p className="text-sm text-teal font-mono">BEST ONE-TIME PRICE</p>
            </div>
            <SplitFlapTicker value={best_price} symbol={bestScenario?.symbol || '$'} className="justify-center mb-2" />
            <p className="text-paper/70">
              from <span className="font-semibold text-paper">{best_seller}</span> in{' '}
              <span className="font-semibold text-paper">{best_country}</span>
            </p>
            <p className="flex items-center justify-center gap-1 text-xs text-brass mt-3">
              Visit store <ExternalLink size={10} />
            </p>
          </a>
        </StampAnimation>

        <StampAnimation>
          <a href={best_emi_url || '#'} target="_blank" rel="noopener noreferrer"
            className="block bg-ink-navy/80 border-2 border-brass rounded-xl p-6 text-center hover:scale-[1.02] transition">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CreditCard size={18} className="text-brass" />
              <p className="text-sm text-brass font-mono">BEST EMI DEAL</p>
            </div>
            <SplitFlapTicker value={best_emi_monthly} symbol={bestEmiScenario?.symbol || '$'} className="justify-center mb-2" />
            <p className="text-paper/70 text-sm">
              per month for 12 months
            </p>
            <p className="text-paper/50 text-xs mt-1">
              Total: {bestEmiScenario?.symbol}{best_emi_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-paper/70 mt-2">
              from <span className="font-semibold text-paper">{best_emi_seller}</span> in{' '}
              <span className="font-semibold text-paper">{best_emi_country}</span>
            </p>
            <p className="flex items-center justify-center gap-1 text-xs text-brass mt-3">
              Visit store <ExternalLink size={10} />
            </p>
          </a>
        </StampAnimation>
      </div>

      {Object.keys(timing).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-ink-navy/50 border border-brass/20 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-brass" />
            <h3 className="font-display font-semibold">Timing Insights</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(timing).slice(0, 4).map(([country, info]) => (
              <div key={country} className={`rounded-lg p-3 text-sm ${
                info.recommendation === 'wait' ? 'bg-ochre/20 border border-ochre/30' : 'bg-teal/10 border border-teal/20'
              }`}>
                <p className="font-mono font-semibold">{country}</p>
                {info.next_event ? (
                  <>
                    <p className="text-xs text-paper/60 mt-1">{info.next_event}</p>
                    <p className="text-xs text-paper/50">{info.days_away}d away · {info.expected_discount} off</p>
                  </>
                ) : (
                  <p className="text-xs text-paper/60 mt-1">No upcoming sales</p>
                )}
                <p className={`text-xs font-semibold mt-1 ${
                  info.recommendation === 'wait' ? 'text-ochre' : 'text-teal'
                }`}>
                  {info.recommendation === 'wait' ? '⏳ Wait' : '✓ Buy now'}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div>
        <h3 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingDown size={20} className="text-brass" />
          All Countries Compared
        </h3>
        <div className="grid gap-4">
          {scenarios.map((scenario, i) => (
            <motion.div
              key={scenario.country}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CountryCard
                country={scenario.country}
                currency={scenario.currency}
                symbol={scenario.symbol}
                totalSellers={scenario.total_sellers}
                sellers={scenario.sellers}
                bestPrice={scenario.best_price}
                bestSeller={scenario.best_seller}
                bestUrl={scenario.best_url}
                bestEmiPrice={scenario.best_emi_price}
                bestEmiMonthly={scenario.best_emi_monthly}
                bestEmiSeller={scenario.best_emi_seller}
                bestEmiUrl={scenario.best_emi_url}
                countryBest={scenario.country_best}
                isBestCountry={scenario.country === best_country}
                isBestEmiCountry={scenario.country === best_emi_country}
                homeCountry={home_country}
                product={product}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {home_country && (
        <div className="bg-ink-navy/50 border border-brass/20 rounded-xl p-4 text-sm text-paper/60">
          <AlertTriangle size={16} className="inline mr-2 text-brass" />
          Importing to {home_country} may incur customs duty. "Carried" prices assume the product is brought in
          personal baggage under the duty-free limit. EMI rates are estimated at 12% interest over 12 months.
        </div>
      )}
    </div>
  )
}
