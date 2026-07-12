'use client'

import { useState } from 'react'
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
  duty: number
  shipping: number
  vat: number
  under_duty_free: boolean
  emi_monthly: number
  emi_total: number
  card_offers: CardOffer[]
  best_card_savings: number
  final_price: number
}

interface CountryCardProps {
  country: string
  currency: string
  symbol: string
  totalSellers: number
  sellers: Seller[]
  bestPrice: number | null
  bestSeller: string
  bestUrl: string
  bestEmiPrice: number | null
  bestEmiMonthly: number | null
  bestEmiSeller: string
  bestEmiUrl: string
  countryBest: string
  isBestCountry: boolean
  isBestEmiCountry: boolean
  homeCountry: string
  product: string
}

const FLAG_EMOJIS: Record<string, string> = {
  IN: '🇮🇳', US: '🇺🇸', AE: '🇦🇪', UK: '🇬🇧', AU: '🇦🇺', DE: '🇩🇪', CA: '🇨🇦',
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', AE: 'UAE', UK: 'United Kingdom', AU: 'Australia', DE: 'Germany', CA: 'Canada',
}

export default function CountryCard({
  country, currency, symbol, totalSellers, sellers, bestPrice, bestSeller, bestUrl,
  bestEmiPrice, bestEmiMonthly, bestEmiSeller, bestEmiUrl,
  countryBest, isBestCountry, isBestEmiCountry, homeCountry, product,
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

  return (
    <div className={`relative rounded-xl border ${
      isBestCountry ? 'border-teal bg-teal/10' : isBestEmiCountry ? 'border-brass bg-brass/10' : 'border-brass/20 bg-ink-navy/50'
    } p-4 md:p-6 transition-all`}>
      {isBestCountry && (
        <div className="absolute -top-3 left-4 bg-teal text-ink-navy text-xs font-bold px-3 py-1 rounded-full font-mono">
          BEST ONE-TIME PRICE
        </div>
      )}
      {isBestEmiCountry && !isBestCountry && (
        <div className="absolute -top-3 left-4 bg-brass text-ink-navy text-xs font-bold px-3 py-1 rounded-full font-mono">
          BEST EMI DEAL
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{FLAG_EMOJIS[country]}</span>
          <div>
            <h3 className="font-display text-lg font-semibold">{COUNTRY_NAMES[country]}</h3>
            <p className="text-sm text-paper/60">{totalSellers} trusted sellers</p>
          </div>
        </div>
      </div>

      {bestPrice !== null && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <a href={bestUrl || '#'} target="_blank" rel="noopener noreferrer"
            className={`block rounded-lg p-3 border transition hover:scale-[1.02] ${
              isBestCountry ? 'bg-teal/20 border-teal/40' : 'bg-ink-navy/80 border-brass/10'
            }`}>
            <p className="text-xs text-paper/50 mb-1">One-Time Payment</p>
            <p className="font-mono text-xl font-bold text-teal">
              {symbol}{bestPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-paper/60 mt-1">from {bestSeller}</p>
            <p className="flex items-center gap-1 text-xs text-brass mt-1">
              Visit store <ExternalLink size={10} />
            </p>
          </a>

          <a href={bestEmiUrl || '#'} target="_blank" rel="noopener noreferrer"
            className={`block rounded-lg p-3 border transition hover:scale-[1.02] ${
              isBestEmiCountry ? 'bg-brass/20 border-brass/40' : 'bg-ink-navy/80 border-brass/10'
            }`}>
            <p className="text-xs text-paper/50 mb-1">EMI (12 months)</p>
            <p className="font-mono text-xl font-bold text-brass">
              {symbol}{bestEmiMonthly?.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
            </p>
            <p className="text-xs text-paper/60 mt-1">Total: {symbol}{bestEmiPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            <p className="flex items-center gap-1 text-xs text-brass mt-1">
              Visit store <ExternalLink size={10} />
            </p>
          </a>
        </div>
      )}

      {sellers.length === 0 ? (
        <p className="text-center text-paper/40 py-4">No trusted sellers found in {COUNTRY_NAMES[country]}</p>
      ) : (
        <>
          <div className="space-y-2">
            {displaySellers.map((seller, i) => (
              <div key={i}>
                <button
                  onClick={() => handleSellerClick(i, seller)}
                  className={`w-full text-left flex items-center justify-between p-3 rounded-lg transition ${
                    i === 0 ? 'bg-teal/10 border border-teal/20' : 'bg-ink-navy/30 hover:bg-ink-navy/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{seller.seller}</p>
                    <div className="flex items-center gap-2 text-xs text-paper/50">
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
                        {symbol}{seller.carried_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="font-mono text-xs text-brass">
                        EMI: {symbol}{seller.emi_monthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo
                      </p>
                    </div>
                    {openSeller === i ? <ChevronUp size={14} className="text-paper/40" /> : <ChevronDown size={14} className="text-paper/40" />}
                  </div>
                </button>

                {openSeller === i && (
                  <div className="mt-2 p-4 bg-ink-navy/80 rounded-lg border border-brass/10 space-y-4">
                    <a href={seller.url || '#'} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-teal text-ink-navy py-2 rounded-lg font-semibold hover:bg-teal/90 transition">
                      Buy from {seller.seller} <ExternalLink size={14} />
                    </a>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-ink-navy/50 rounded p-2">
                        <p className="text-paper/50">Listed Price</p>
                        <p className="font-mono font-semibold">{symbol}{seller.price.toLocaleString()}</p>
                      </div>
                      <div className="bg-ink-navy/50 rounded p-2">
                        <p className="text-paper/50">Carried Price</p>
                        <p className="font-mono font-semibold text-teal">{symbol}{seller.carried_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-ink-navy/50 rounded p-2">
                        <p className="text-paper/50">EMI Monthly</p>
                        <p className="font-mono font-semibold text-brass">{symbol}{seller.emi_monthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="bg-ink-navy/50 rounded p-2">
                        <p className="text-paper/50">EMI Total</p>
                        <p className="font-mono font-semibold">{symbol}{seller.emi_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-paper/50">Cost Breakdown</p>
                      <div className="flex justify-between"><span>Duty</span><span className="font-mono">{symbol}{seller.duty.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between"><span>Shipping</span><span className="font-mono">{symbol}{seller.shipping.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between"><span>VAT/GST</span><span className="font-mono">{symbol}{seller.vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
                      <div className="flex justify-between"><span>Under duty-free?</span><span>{seller.under_duty_free ? '✓ Yes' : '✗ No'}</span></div>
                    </div>

                    <div>
                      <p className="text-xs text-paper/50 mb-2 flex items-center gap-1">
                        <CreditCard size={12} /> Card Offers
                      </p>
                      {loadingOffers[i] ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 size={16} className="animate-spin text-brass" />
                          <span className="ml-2 text-xs text-paper/50">Loading offers...</span>
                        </div>
                      ) : cardOffers[i] && cardOffers[i].length > 0 ? (
                        <div className="space-y-2">
                          {cardOffers[i].map((offer, j) => (
                            <div key={j} className="bg-teal/10 border border-teal/20 rounded-lg p-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-xs">{offer.bank} {offer.card_type}</p>
                                  <p className="text-xs text-paper/60">{offer.description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-mono text-xs font-bold text-teal">
                                    {offer.value_type === 'percent' ? `${offer.value}%` : `${symbol}${offer.value}`} {offer.offer_type}
                                  </p>
                                  <p className="text-xs text-teal">Save {symbol}{offer.savings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-paper/40 text-center py-2">No card offers found</p>
                      )}
                    </div>

                    <FreshnessBadge />
                  </div>
                )}
              </div>
            ))}
          </div>

          {sellers.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 flex items-center justify-center gap-1 text-sm text-brass hover:text-brass/80"
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
    </div>
  )
}
