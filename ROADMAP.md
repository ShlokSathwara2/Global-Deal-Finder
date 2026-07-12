# GLOBAL DEAL FINDER
## Full Build Roadmap — Zero to Sellable Product
**Stack:** Next.js + Vercel • FastAPI + Render • Groq / Gemini • Supabase • Free-tier APIs

---

# PART 1 — One-time setup (do this before Phase 0)

## Accounts to create (all free tier):

| Service | Purpose | Free tier notes |
|---------|---------|-----------------|
| **GitHub** | Your code home | Free for public/private repos |
| **Vercel** | Frontend hosting | Connects directly to GitHub |
| **Render** | Backend hosting | Connects to GitHub |
| **Supabase** | Postgres database + pgvector + Edge Functions + Realtime | Free tier, generous |
| **Groq** (console.groq.com) | Fast free LLM inference (Llama models) | No card needed |
| **Google AI Studio** | Free Gemini API key (backup/secondary LLM) | Free tier with daily quota |
| **SerpAPI** (100 free searches/month) or **Tavily** (1000 free/month) | Price search | Free monthly credits |
| **Upstash** | Free Redis for caching | Pay-as-you-grow after |
| **Resend** or reuse your **WhatsApp Cloud API** | For notifications (Phase 11) | Free tier |

## Local tools:
- Node.js (v20+)
- Python 3.11+
- Git
- VS Code

## Repo structure:
```
global-deal-finder/
  frontend/   → Next.js app
  backend/    → FastAPI app
```

---

# PART 2 — Phase-by-phase build

---

## Phase 0 — Foundations

### Backend:
```bash
pip install fastapi uvicorn python-dotenv --break-system-packages
```
Create `main.py` with one `/health` route. Push to GitHub. On Render: New → Web Service → connect repo → build command `pip install -r requirements.txt`, start command `uvicorn main:app --host 0.0.0.0 --port $PORT`.

### Frontend:
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
```
Push to GitHub → import into Vercel → deploy (zero config needed).

### Database:
Create a Supabase project. Copy the `SUPABASE_URL` and `SUPABASE_ANON_KEY` into both frontend `.env.local` and backend `.env`.

### Test:
Hit your Render `/health` URL from the deployed Vercel app using fetch, confirm it returns 200.

---

## Phase 1 — Intent Parsing

**Backend only.**

```bash
pip install groq pydantic
```

Write a Pydantic model:

```python
class Intent(BaseModel):
    product: str
    budget: float
    currency: str
    home_country: str
    travel_date: str | None = None
```

Write `/parse-intent` endpoint: takes raw text → sends to Groq (`llama-3.3-70b-versatile`) with a system prompt instructing it to return ONLY JSON matching that schema → validate with Pydantic → if validation fails, re-prompt once, then return an error.

Store both raw input and parsed JSON in a Supabase table `parsed_intents`.

---

## Phase 2 — Global Price Search Engine

**Backend:**

```bash
pip install google-search-results  # SerpAPI SDK
# or use Tavily's SDK
```

Write `search_prices(product, country)` — loops through a list of target countries, calls SerpAPI's Google Shopping engine per country.

Create Supabase table `price_snapshots`:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | primary key |
| product | text | |
| country | text | |
| seller | text | |
| price | numeric | |
| currency | text | |
| url | text | |
| created_at | timestamp | |

Insert every result into that table on every search.

Add Upstash Redis:
```bash
pip install upstash-redis
```
Cache key = product+country, TTL ~1 hour, so repeat queries don't re-search.

---

## Phase 3 — True Cost Calculator

**Backend, pure Python, no AI calls.**

Create Supabase table `country_rules`:

| Column | Type | Notes |
|--------|------|-------|
| country_code | text | e.g. US, AE, GB |
| customs_duty_pct | numeric | duty % on import |
| duty_free_allowance_value | numeric | traveler duty-free limit |
| vat_rate_pct | numeric | sales/VAT tax rate |
| vat_refund_available | boolean | tourist refund scheme |
| vat_refund_deduction_pct | numeric | processing fee deducted |

Manually populate rows for India, USA, UAE, UK, Australia, Germany, Canada (look up real current government rates).

Write `calculate_true_cost(price, country_rules)` returning three numbers:

- **local_price** — base price, no adjustment
- **imported_price** — `price + (price * duty_pct) + shipping_estimate`
- **carried_price** — `price - (price * vat_rate * (1 - refund_deduction))` — only valid if under `duty_free_allowance_value`, else flag it.

Add the bulk-quantity check: if `quantity * price > allowance`, switch scenario label to "bulk import" instead of "personally carried."

Unit test with known example numbers (write these as plain `assert` statements in a test file).

---

## Phase 4 — Card, Bank Offer & Coupon Layer

**Backend + a scheduled job.**

Create Supabase table `card_offers`:

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
| last_verified_at | timestamp | for staleness |

Write `fetch_offers(merchant)` — calls Tavily/Serper with query `"<merchant> credit card offer 2026"` and `"<merchant> coupon code"`.

Feed raw snippets to Groq with a strict extraction prompt → output JSON matching the table schema → insert into `card_offers`.

Schedule this: Supabase has Edge Functions + `pg_cron` (free) — set it to run every 12–24 hours per tracked merchant. Alternative: a free Render Cron Job service type.

Write `normalize_offer(offer, purchase_amount)` — converts cashback %, flat discount, and no-cost EMI into one comparable "effective price" number.

In your main comparison logic, JOIN `price_snapshots.seller` to `card_offers.merchant` and compute net price per seller×card pair.

---

## Phase 5 — Timing Advisor

**Backend.**

Create Supabase table `sale_calendar`:

| Column | Type | Notes |
|--------|------|-------|
| country_code | text | |
| event_name | text | |
| date_range | text | |
| category | text | |
| historical_discount_pct | numeric | |

Manually populate known events (Republic Day Sale, Black Friday, EOFY, etc.).

Write `get_timing_context(category, countries[])` — loops each country, returns nearest event + any historical drop pattern computed from your own `price_snapshots` (e.g., group by month, compare avg price).

Add one Tavily search call for `"recent news + tariff + <category>"` as a disruptive-context flag only — never let the LLM turn this into a predicted price.

Add currency risk note: if `travel_date` is >2 weeks out, attach a static disclaimer string.

---

## Phase 6 — Comparison Engine

**Backend — pure orchestration, no new AI calls here.**

Write one function `get_full_comparison(intent)`:

```python
def get_full_comparison(intent):
    prices = [search_prices(intent.product, c) for c in target_countries]
    costs = [calculate_true_cost(p, country_rules[c]) for p, c in ...]
    offers = join_and_normalize(prices, card_offers)
    timing = get_timing_context(intent.category, target_countries)
    return {"scenarios": costs, "best_overall": ..., "timing_note": timing}
```

Validate the output against a fixed Pydantic schema before returning it. This becomes your `/compare` endpoint.

---

## Phase 7 — Roadmap Generation

**Backend, one LLM call.**

Send the Phase 6 JSON to Groq/Gemini with a prompt like:

> "Format this data into a short summary, a ranked list of options, and a timing note. Do not invent or estimate any number not present in this JSON."

Return plain text + keep source URLs attached separately so the LLM can't drop them.

---

## Phase 8 — Premium Frontend & Design System

**Frontend.**

```bash
npx shadcn@latest init  # inside frontend/ — pulls in free component primitives
npm install framer-motion lucide-react
```

Add fonts via `next/font/google`:
- **Fraunces** (display)
- **IBM Plex Mono** (numbers)
- **Inter** (body)

Set up Tailwind config with your color tokens as named colors — not raw hex scattered through components:

| Token | Hex | Usage |
|-------|-----|-------|
| ink-navy | #0B1220 | Primary background |
| paper | #F6F3EA | Light surface for cards |
| brass | #8A6D1E | Primary accent, CTAs |
| ochre | #9C3F2E | Duty/alert context only |
| teal | #2F6F62 | Savings/positive numbers only |

Build the **split-flap ticker** as a small reusable component: each digit is a div that rotates via CSS `transform: rotateX()` on value change — no external library needed.

Build the **results view**: one card per country, each showing local/shipped/carried, best-card badge, freshness badge (`last_verified_at` formatted as "checked 2h ago").

Build the **stamp animation** using Framer Motion's scale + rotate keyframes triggered when `best_overall` loads.

Test on a real phone viewport (Chrome DevTools mobile view at minimum) before moving on.

---

## Phase 9 — Real Testing & Trust Hardening

No new code beyond:
- A feedback table: `user`, `product`, `issue_description`, `created_at`
- A simple rate limiter (FastAPI middleware using `slowapi`, free)

Then go get 15–20 real testers.

---

## Phase 10 — Packaging It to Sell

Write OpenAPI docs (FastAPI gives you this for free at `/docs` automatically). Clean up the `/compare` endpoint's request/response naming so it reads well to an outside developer.

---

## Phase 11 — Price-Drop Alerts

Supabase table `watchlist`:

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | |
| product | text | |
| target_price | numeric | |
| country | text | |
| channel | text | email/whatsapp |

Supabase Edge Function on a schedule (`pg_cron`) checks new `price_snapshots` rows against open `watchlist` rows.

Send via WhatsApp Cloud API (reuse your SmartStudy integration) or Resend free tier for email.

---

## Phase 12 — Cart Comparison

Extend Phase 1's parser to accept a list. Loop Phase 6 per item, then sum per-country totals and re-check the duty-free allowance against the combined total, not each item alone.

---

## Phase 13 — Total Cost of Ownership

Supabase table `warranty_rules`:

| Column | Type | Notes |
|--------|------|-------|
| manufacturer | text | |
| category | text | |
| country | text | |
| international_warranty | boolean | |
| local_service_available | boolean | |

Attach as a caveat string in the Phase 3 output.

---

## Phase 14 — Alternative Suggestions

LLM proposes substitute product names → run each through the existing Phase 2–6 pipeline as if it were a fresh query → only show it if a real price was found.

---

## Phase 15 — Resale Value Estimator

Supabase table `resale_reference`:

| Column | Type | Notes |
|--------|------|-------|
| category | text | |
| age_years | numeric | |
| retained_value_pct | numeric | |

Combine with Phase 3 output to show an optional "effective cost after 1 year" number, clearly labeled as an estimate.

---

## Phase 16 — Browser Extension

A Manifest V3 Chrome extension (free to build/publish) — content script detects a product page, calls your `/compare` endpoint, injects an overlay badge styled with your Phase 8 design tokens.

---

## Phase 17 — Public Trust Dashboard

A public Next.js page that reads an aggregated (anonymized) view of your feedback/accuracy log table and shows simple stats — no new backend logic beyond a read-only aggregate query.

---

## Final Note

Phases 2–5 are the data layer, and they are what make every later feature — alerts, resale estimates, the extension, the trust dashboard — actually trustworthy rather than decorative. A striking split-flap ticker over thin or fake data will not survive a company's due diligence any more than a plain one would. Build the boring data foundation first, genuinely well, and let the design system in Phase 8 be the payoff once there's real data underneath it to display.
