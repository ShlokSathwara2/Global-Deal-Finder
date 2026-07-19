'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, ExternalLink, Star, CreditCard, Loader2 } from 'lucide-react'
import FreshnessBadge from './FreshnessBadge'

interface CardOffer {
  bank: string
  card_type: string
  offer_type: string
  value: number
  value_type: string
  savings: number
  description: string
}

interface Seller {
  seller: string
  price: number
  url: string
  title: string
  rating: number | null
  reviews: number | null
  local_price: number
  imported_price: number
  carried_price: number
  carried_price_home: number
  duty: number
  shipping: number
  vat: number
  under_duty_free: boolean
  emi_monthly: number
  emi_total: number
  emi_monthly_home: number
  emi_total_home: number
  card_offers: CardOffer[]
  best_card_savings: number
  final_price: number
  final_price_home: number
}

interface CountryCardProps {
  country: string
  currency: string
  symbol: string
  homeCurrency: string
  homeSymbol: string
  totalSellers: number
  sellers: Seller[]
  bestPrice: number | null
  bestPriceHome: number | null
  bestSeller: string
  bestUrl: string
  bestEmiPrice: number | null
  bestEmiPriceHome: number | null
  bestEmiMonthly: number | null
  bestEmiMonthlyHome: number | null
  bestEmiSeller: string
  bestEmiUrl: string
  countryBest: string
  isBestCountry: boolean
  isBestEmiCountry: boolean
  homeCountry: string
  product: string
  isHighlighted?: boolean
}

const FLAG_EMOJIS: Record<string, string> = {
  IN: '\u{1F1EE}\u{1F1F3}', US: '\u{1F1FA}\u{1F1F8}', AE: '\u{1F1E6}\u{1F1EA}', UK: '\u{1F1EC}\u{1F1E7}', AU: '\u{1F1E6}\u{1F1FA}', DE: '\u{1F1E9}\u{1F1EA}', CA: '\u{1F1E8}\u{1F1E6}',
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', AE: 'UAE', UK: 'United Kingdom', AU: 'Australia', DE: 'Germany', CA: 'Canada',
}

export default function CountryCard({
  country, currency, symbol, homeCurrency, homeSymbol, totalSellers, sellers, bestPrice, bestPriceHome, bestSeller, bestUrl,
  bestEmiPrice, bestEmiPriceHome, bestEmiMonthly, bestEmiMonthlyHome, bestEmiSeller, bestEmiUrl,
  countryBest, isBestCountry, isBestEmiCountry, homeCountry, product, isHighlighted = false,
}: CountryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [openSeller, setOpenSeller] = useState<number | null>(null)
  const [cardOffers, setCardOffers] = useState<Record<number, CardOffer[]>>({})
  const [loadingOffers, setLoadingOffers] = useState<Record<number, boolean>>({})
  const displaySellers = expanded ? sellers : sellers.slice(0, 3)

  const fetchCardOffers = async (sellerIndex: number, seller: Seller) => {
    if (cardOffers[sellerIndex]) return
    setLoadingOffers(prev => ({ ...prev, [sellerIndex]: true }))
    try {
      const res = await fetch('https://global-deal-finder.onrender.com/seller-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, country, seller: seller.seller, price: seller.carried_price }),
      })
      if (res.ok) {
        const data = await res.json()
        setCardOffers(prev => ({ ...prev, [sellerIndex]: data.offers }))
      }
    } catch {
    } finally {
      setLoadingOffers(prev => ({ ...prev, [sellerIndex]: false }))
    }
  }

  const handleSellerClick = (i: number, seller: Seller) => {
    if (openSeller === i) {
      setOpenSeller(null)
    } else {
      setOpenSeller(i)
      fetchCardOffers(i, seller)
    }
  }

  const getBorderStyle = () => {
    if (isBestCountry) return 'border-teal/40'
    if (isBestEmiCountry) return 'border-brass/40'
    return 'border-white/6'
  }

  const getBackgroundStyle = () => {
    if (isBestCountry) return 'rgba(47,111,98,0.06)'
    if (isBestEmiCountry) return 'rgba(138,109,30,0.06)'
    return 'rgba(11,18,32,0.4)'
  }

  return (
    <motion.div
      className={`relative rounded-xl border ${getBorderStyle()} p-4 md:p-6 transition-all duration-300`}
      style={{
        background: getBackgroundStyle(),
        ...(isHighlighted ? {
          borderColor: 'rgba(138,109,30,0.6)',
          boxShadow: '0 0 30px rgba(138,109,30,0.15), 0 0 60px rgba(138,109,30,0.05)',
        } : {}),
      }}
      animate={isHighlighted ? { scale: [1, 1.01, 1] } : {}}
      transition={{ duration: 0.5 }}
      whileHover={{ borderColor: isBestCountry ? 'rgba(47,111,98,0.6)' : isBestEmiCountry ? 'rgba(138,109,30,0.6)' : 'rgba(255,255,255,0.12)' }}
    >
      {isBestCountry && (
        <div className="absolute -top-3 left-4 bg-teal text-ink-navy text-[10px] font-bold px-3 py-1 rounded-full font-mono tracking-wider">
          BEST ONE-TIME PRICE
        </div>
      )}
      {isBestEmiCountry && !isBestCountry && (
        <div className="absolute -top-3 left-4 bg-brass text-ink-navy text-[10px] font-bold px-3 py-1 rounded-full font-mono tracking-wider">
          BEST EMI DEAL
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.span
            className="text-3xl wobble-hover"
            whileHover={{ scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {FLAG_EMOJIS[country]}
          </motion.span>
          <div>
            <h3 className="font-display text-lg font-semibold">{COUNTRY_NAMES[country]}</h3>
            <p className="text-sm text-paper/50">{totalSellers} trusted sellers</p>
          </div>
        </div>
      </div>

      {bestPrice !== null && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a href={bestUrl || '#'} target="_blank" rel="noopener noreferrer"
            className="block rounded-lg p-3 border transition-all duration-200 hover:scale-[1.02] group"
            style={{
              background: isBestCountry ? 'rgba(47,111,98,0.1)' : 'rgba(11,18,32,0.6)',
              borderColor: isBestCountry ? 'rgba(47,111,98,0.3)' : 'rgba(255,255,255,0.05)',
            }}
          >
            <p className="text-[10px] text-paper/40 mb-1 uppercase tracking-wider">One-Time Payment</p>
            <p className="font-mono text-xl font-bold text-teal">
              {homeSymbol}{bestPriceHome?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-paper/35 mt-0.5">{symbol}{bestPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}</p>
            <p className="text-xs text-paper/50 mt-1">from {bestSeller}</p>
            <p className="flex items-center gap-1 text-xs text-brass mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Visit store <ExternalLink size={10} />
            </p>
          </a>

          <a href={bestEmiUrl || '#'} target="_blank" rel="noopener noreferrer"
            className="block rounded-lg p-3 border transition-all duration-200 hover:scale-[1.02] group"
            style={{
              background: isBestEmiCountry ? 'rgba(138,109,30,0.1)' : 'rgba(11,18,32,0.6)',
              borderColor: isBestEmiCountry ? 'rgba(138,109,30,0.3)' : 'rgba(255,255,255,0.05)',
            }}
          >
            <p className="text-[10px] text-paper/40 mb-1 uppercase tracking-wider">EMI (12 months)</p>
            <p className="font-mono text-xl font-bold text-brass">
              {homeSymbol}{bestEmiMonthlyHome?.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
            </p>
            <p className="text-xs text-paper/35 mt-0.5">{symbol}{bestEmiMonthly?.toLocaleString('en-US', { minimumFractionDigits: 2 })} {currency}/mo</p>
            <p className="text-xs text-paper/50 mt-1">Total: {homeSymbol}{bestEmiPriceHome?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="flex items-center gap-1 text-xs text-brass mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              Visit store <ExternalLink size={10} />
            </p>
          </a>
        </div>
      )}

      {sellers.length === 0 ? (
        <p className="text-center text-paper/30 py-4 text-sm">No trusted sellers found in {COUNTRY_NAMES[country]}</p>
      ) : (
        <>
          <div className="space-y-2">
            {displaySellers.map((seller, i) => (
              <div key={i}>
                <button
                  onClick={() => handleSellerClick(i, seller)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    i === 0 ? 'bg-teal/8 border border-teal/15' : 'bg-white/2 hover:bg-white/4'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{seller.seller}</p>
                    <div className="flex items-center gap-2 text-xs text-paper/40">
                      <span className="font-mono">{symbol}{seller.price.toLocaleString()}</span>
                      {seller.rating && (
                        <span className="flex items-center gap-0.5">
                          <Star size={10} className="text-brass fill-brass" />
                          {seller.rating}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-2 flex items-center gap-2">
                    <div>
                      <p className="font-mono text-sm font-semibold text-teal">
                        {homeSymbol}{seller.carried_price_home.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-mono text-xs text-paper/30">{symbol}{seller.carried_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      <p className="font-mono text-xs text-brass">
                        EMI: {homeSymbol}{seller.emi_monthly_home.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: openSeller === i ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={14} className="text-paper/30" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {openSeller === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 p-4 rounded-lg space-y-4" style={{
                        background: 'rgba(11,18,32,0.6)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <a href={seller.url || '#'} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 bg-teal text-ink-navy py-2.5 rounded-lg font-semibold hover:bg-teal/90 transition-all text-sm"
                        >
                          Buy from {seller.seller} <ExternalLink size={14} />
                        </a>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-lg p-2.5" style={{ background: 'rgba(11,18,32,0.5)' }}>
                            <p className="text-paper/40">Listed Price</p>
                            <p className="font-mono font-semibold">{symbol}{seller.price.toLocaleString()}</p>
                          </div>
                          <div className="rounded-lg p-2.5" style={{ background: 'rgba(11,18,32,0.5)' }}>
                            <p className="text-paper/40">Carried ({homeCurrency})</p>
                            <p className="font-mono font-semibold text-teal">{homeSymbol}{seller.carried_price_home.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="rounded-lg p-2.5" style={{ background: 'rgba(11,18,32,0.5)' }}>
                            <p className="text-paper/40">EMI Monthly ({homeCurrency})</p>
                            <p className="font-mono font-semibold text-brass">{homeSymbol}{seller.emi_monthly_home.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="rounded-lg p-2.5" style={{ background: 'rgba(11,18,32,0.5)' }}>
                            <p className="text-paper/40">EMI Total ({homeCurrency})</p>
                            <p className="font-mono font-semibold">{homeSymbol}{seller.emi_total_home.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <div className="text-xs space-y-1.5">
                          <p className="text-paper/40">Cost Breakdown</p>
                          <div className="flex justify-between"><span className="text-paper/50">Duty</span><span className="font-mono">{symbol}{seller.duty.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between"><span className="text-paper/50">Shipping</span><span className="font-mono">{symbol}{seller.shipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between"><span className="text-paper/50">VAT/GST</span><span className="font-mono">{symbol}{seller.vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                          <div className="flex justify-between"><span className="text-paper/50">Under duty-free?</span><span>{seller.under_duty_free ? '✓ Yes' : '✗ No'}</span></div>
                        </div>

                        <div>
                          <p className="text-xs text-paper/40 mb-2 flex items-center gap-1">
                            <CreditCard size={12} /> Card Offers
                          </p>
                          {loadingOffers[i] ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 size={16} className="animate-spin text-brass" />
                              <span className="ml-2 text-xs text-paper/40">Loading offers...</span>
                            </div>
                          ) : cardOffers[i] && cardOffers[i].length > 0 ? (
                            <div className="space-y-2">
                              {cardOffers[i].map((offer, j) => (
                                <div key={j} className="rounded-lg p-2.5" style={{
                                  background: 'rgba(47,111,98,0.06)',
                                  border: '1px solid rgba(47,111,98,0.15)',
                                }}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-xs">{offer.bank} {offer.card_type}</p>
                                      <p className="text-xs text-paper/50">{offer.description}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-mono text-xs font-bold text-teal">
                                        {offer.value_type === 'percent' ? `${offer.value}%` : `${symbol}${offer.value}`} {offer.offer_type}
                                      </p>
                                      <p className="text-xs text-teal/70">Save {symbol}{offer.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-paper/30 text-center py-2">No card offers found</p>
                          )}
                        </div>

                        <FreshnessBadge />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {sellers.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-brass hover:text-brass/80 transition-colors"
            >
              {expanded ? (
                <>Show less <ChevronUp size={14} /></>
              ) : (
                <>Show all {sellers.length} sellers <ChevronDown size={14} /></>
              )}
            </button>
          )}
        </>
      )}

      <FreshnessBadge className="mt-3" />
    </motion.div>
  )
}
