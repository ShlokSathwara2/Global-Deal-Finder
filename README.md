# Global Deal Finder

**Best Price + Best Card + Best Timing, Worldwide**

A tool where a user describes a product they want to buy and their budget. The tool then:

1. Finds real prices for that product across multiple countries
2. Calculates the TRUE final cost in each scenario — buying locally, importing it yourself with duty/shipping, or having a traveling friend carry it in personally with VAT refund
3. Finds current credit/debit card offers, bank cashback, and coupons that apply
4. Checks if a known sale event (Prime Day, Diwali, Black Friday) is coming up soon that would change the price
5. Generates a clear, human-readable roadmap telling the user exactly where, how, and when to buy for the lowest true cost

---

## Tech Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js + TypeScript + Tailwind CSS | Vercel (free tier) |
| Backend | FastAPI + Python | Render (free tier) |
| Database | Supabase (Postgres + pgvector + Edge Functions + Realtime) | Free tier |
| LLM | Groq (Llama 3.3 70B) + Gemini (backup) | Free tier |
| Price Search | SerpAPI or Tavily | Free tier (100-1000 searches/month) |
| Cache | Upstash Redis | Free tier |
| Notifications | WhatsApp Cloud API / Resend | Free tier |

---

## Project Structure

```
global-deal-finder/
├── frontend/          → Next.js app (deployed to Vercel)
│   ├── src/
│   │   ├── app/       → App router pages
│   │   ├── components/→ UI components
│   │   │   ├── SplitFlapTicker.tsx
│   │   │   ├── StampAnimation.tsx
│   │   │   ├── CountryCard.tsx
│   │   │   ├── ResultsView.tsx
│   │   │   └── FreshnessBadge.tsx
│   │   └── lib/       → Utilities
│   ├── public/
│   ├── .env.local
│   └── package.json
├── backend/           → FastAPI app (deployed to Render)
│   ├── main.py        → App entry + /health, /parse-intent, /compare
│   ├── routers/       → Route modules
│   ├── services/      → Business logic
│   │   ├── intent_parser.py
│   │   ├── price_search.py
│   │   ├── true_cost.py
│   │   ├── card_offers.py
│   │   ├── timing.py
│   │   └── comparison.py
│   ├── models/        → Pydantic schemas
│   ├── tests/         → Unit tests
│   ├── .env
│   └── requirements.txt
├── ROADMAP.md
└── README.md
```

---

## Database Schema

### `parsed_intents`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| raw_input | text | user's original text |
| parsed_json | jsonb | structured intent |
| created_at | timestamp | |

### `price_snapshots`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| product | text | normalized product identifier |
| country | text | IN, US, AE, GB, etc. |
| seller | text | |
| price | numeric | |
| currency | text | |
| url | text | source link |
| created_at | timestamp | |

### `country_rules`
| Column | Type | Notes |
|--------|------|-------|
| country_code | text | primary key |
| customs_duty_pct | numeric | import duty % |
| duty_free_allowance_value | numeric | traveler duty-free limit |
| vat_rate_pct | numeric | sales/VAT tax rate |
| vat_refund_available | boolean | tourist refund scheme |
| vat_refund_deduction_pct | numeric | processing fee deducted |

### `card_offers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| bank_name | text | |
| card_type | text | credit/debit |
| merchant | text | |
| offer_type | text | cashback/discount/emi |
| value | numeric | |
| value_type | text | percent/flat |
| min_spend | numeric | nullable |
| valid_until | date | nullable |
| source_url | text | always keep for trust |
| last_verified_at | timestamp | for staleness check |

### `sale_calendar`
| Column | Type | Notes |
|--------|------|-------|
| country_code | text | |
| event_name | text | |
| date_range | text | |
| category | text | |
| historical_discount_pct | numeric | |

### `watchlist`
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | |
| product | text | |
| target_price | numeric | |
| country | text | |
| channel | text | email/whatsapp |

### `warranty_rules`
| Column | Type | Notes |
|--------|------|-------|
| manufacturer | text | |
| category | text | |
| country | text | |
| international_warranty | boolean | |
| local_service_available | boolean | |

### `resale_reference`
| Column | Type | Notes |
|--------|------|-------|
| category | text | |
| age_years | numeric | |
| retained_value_pct | numeric | |

---

## API Endpoints

### `GET /health`
Health check. Returns `{"status": "ok"}`.

### `POST /parse-intent`
Parses free-text user input into structured JSON.

**Request:**
```json
{
  "text": "I want an S25 Ultra, budget around 1 lakh INR, prefer new"
}
```

**Response:**
```json
{
  "product": "Samsung Galaxy S25 Ultra",
  "budget": 100000,
  "currency": "INR",
  "home_country": "IN",
  "travel_date": null,
  "condition_preference": "new"
}
```

### `POST /compare`
Full comparison across countries, costs, cards, and timing.

**Request:**
```json
{
  "product": "Samsung Galaxy S25 Ultra",
  "budget": 100000,
  "currency": "INR",
  "home_country": "IN"
}
```

**Response:**
```json
{
  "scenarios": [
    {
      "country": "IN",
      "local_price": 134999,
      "imported_price": 148500,
      "carried_price": 112000,
      "best_card": {
        "bank": "HDFC",
        "offer": "10% cashback",
        "net_price": 100800
      }
    }
  ],
  "best_overall": { ... },
  "timing_note": {
    "next_event": "Diwali Sale",
    "date_range": "Oct-Nov",
    "historical_discount": "15-20%"
  }
}
```

---

## Cost Scenarios Explained

| Scenario | Formula | When it applies |
|----------|---------|-----------------|
| **Local** | base price | Buying in your home country normally |
| **Imported** | `foreign_price + customs_duty + shipping` | Ordering online from abroad |
| **Personally carried** | `foreign_price - vat_refund` | Traveler buys abroad, carries in baggage (under duty-free limit) |

---

## Design System

**Theme:** "Customs & Currency" — departures hall crossed with currency exchange counter

| Token | Hex | Usage |
|-------|-----|-------|
| ink-navy | #0B1220 | Primary background |
| paper | #F6F3EA | Light surface for cards |
| brass | #8A6D1E | Primary accent, CTAs |
| ochre | #9C3F2E | Duty/alert warnings only |
| teal | #2F6F62 | Savings/positive numbers only |

**Fonts:**
- Fraunces — display headlines
- IBM Plex Mono — all numbers, prices, percentages
- Inter — body text

**Signature Elements:**
- Split-flap ticker — airport-style digit flips for price updates
- Customs stamp animation — winner recommendation gets a passport-stamp effect
- Freshness badges — "checked 2h ago" on every price and offer

---

## Setup Instructions

### Prerequisites
- Node.js v20+
- Python 3.11+
- Git
- VS Code (recommended)

### 1. Clone & scaffold
```bash
git clone https://github.com/your-username/global-deal-finder.git
cd global-deal-finder

# Frontend
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend && npm install framer-motion lucide-react && npx shadcn@latest init

# Backend
cd ../backend
pip install fastapi uvicorn python-dotenv groq pydantic google-search-results upstash-redis
```

### 2. Environment variables

**backend/.env**
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_key
SERPAPI_KEY=your_serpapi_key
UPSTASH_REDIS_URL=your_upstash_url
UPSTASH_REDIS_TOKEN=your_upstash_token
```

**frontend/.env.local**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-app.onrender.com
```

### 3. Deploy
```bash
# Frontend → Vercel
# Import repo, set root to /frontend, deploy

# Backend → Render
# New Web Service → connect repo
# Build: pip install -r requirements.txt
# Start: uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## Target Countries (Initial Set)

| Country | Code | Key retailers | VAT/GST | Duty-free allowance |
|---------|------|---------------|---------|---------------------|
| India | IN | Amazon.in, Flipkart, Croma | 18% GST | ₹50,000 |
| USA | US | Amazon.com, Best Buy, Walmart | 0-10% (varies by state) | $800 |
| UAE | AE | Amazon.ae, Noon, Carrefour | 5% VAT | AED 3,000 |
| UK | UK | Amazon.co.uk, Currys, John Lewis | 20% VAT | £390 |
| Australia | AU | JB Hi-Fi, Officeworks, Kogan | 10% GST | AUD 900 |
| Germany | DE | MediaMarkt, Idealo, Otto | 19% VAT | €430 |
| Canada | CA | Best Buy Canada, Canadian Tire | 5% GST + PST | CAD 200 |

---

## Sale Events Calendar

| Country | Major events | Timing |
|---------|-------------|--------|
| India | Republic Day, Prime Day, Big Billion Days / Diwali | Jan • Jul • Oct-Nov |
| USA | Presidents' Day, Prime Day, Black Friday | Feb • Jul • late Nov |
| UAE | Dubai Shopping Festival, White Friday | Dec-Jan • late Nov |
| UK | Black Friday, Boxing Day | late Nov • Dec 26 |
| Australia | EOFY Sale, Black Friday, Boxing Day | Jun • late Nov • Dec 26 |
| Germany | Black Friday, Winter/Summer clearance | late Nov • Jan • Jul |
| Canada | Black Friday, Boxing Day | late Nov • Dec 26 |

---

## Build Phases

See [ROADMAP.md](./ROADMAP.md) for the full 18-phase build plan.

| Phase | Name | Timeline |
|-------|------|----------|
| 0 | Foundations | Week 0 |
| 1 | Intent Parsing | Week 1 |
| 2 | Global Price Search Engine | Weeks 2-3 |
| 3 | True Cost Calculator | Weeks 4-5 |
| 4 | Card, Bank Offer & Coupon Layer | Weeks 6-8 |
| 5 | Timing Advisor | Week 9 |
| 6 | Comparison Engine | Week 10 |
| 7 | Roadmap Generation | Week 11 |
| 8 | Premium Frontend & Design System | Weeks 12-14 |
| 9 | Real Testing & Trust Hardening | Week 15+ |
| 10 | Packaging It to Sell | After Phase 9 |
| 11 | Price-Drop Alerts & Watchlist | After Phase 8 |
| 12 | Multi-Item / Cart Comparison | After Phase 6 |
| 13 | Total Cost of Ownership | Alongside 3 & 5 |
| 14 | Alternative Suggestions | After Phase 6 |
| 15 | Resale Value Estimator | After Phase 13 |
| 16 | Browser Extension | After Phase 8 |
| 17 | Public Trust Dashboard | After Phase 9 |

---

## Who This Is For

- **Personal finance / card comparison** apps and websites
- **E-commerce platforms** wanting a "best card for this purchase" widget
- **Banks / card issuers** wanting to promote offers through your data
- **Fintech startups** building spend-optimization tools

---

## License

TBD
