const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://global-deal-finder.onrender.com'

export async function compareProduct(product: string, homeCountry: string = 'IN') {
  const res = await fetch(`${API_URL}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, home_country: homeCountry }),
  })
  if (!res.ok) throw new Error('Comparison failed')
  return res.json()
}

export async function getRoadmap(product: string, homeCountry: string = 'IN') {
  const res = await fetch(`${API_URL}/roadmap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, home_country: homeCountry }),
  })
  if (!res.ok) throw new Error('Roadmap generation failed')
  return res.json()
}

export async function getCardOffers(product: string, country: string = 'IN') {
  const res = await fetch(`${API_URL}/card-offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, country }),
  })
  if (!res.ok) throw new Error('Card offers fetch failed')
  return res.json()
}

export async function getTiming(product: string, countries: string[] = ['IN', 'US', 'AE', 'UK', 'AU', 'DE', 'CA']) {
  const res = await fetch(`${API_URL}/timing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product, countries }),
  })
  if (!res.ok) throw new Error('Timing fetch failed')
  return res.json()
}
