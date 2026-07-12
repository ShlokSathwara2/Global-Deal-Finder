import os
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
from groq import Groq
from supabase import create_client
from serpapi import GoogleSearch
from services.price_search import search_prices, store_prices
from services.true_cost import calculate_true_cost, get_country_rules, CURRENCY_SYMBOLS
from services.card_offers import search_card_offers, normalize_offer, store_offers
from services.timing import get_timing_context
from services.comparison import get_full_comparison, ComparisonResponse

load_dotenv()

app = FastAPI(title="Global Deal Finder API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY"),
)


class Intent(BaseModel):
    product: str
    budget: float
    currency: str
    home_country: str
    travel_date: str | None = None


INTENT_SYSTEM_PROMPT = """You are an intent parser. Extract the following from the user's text and return ONLY valid JSON, no other text:

{
  "product": "product name",
  "budget": number,
  "currency": "currency code like INR, USD, AED",
  "home_country": "2-letter country code like IN, US, AE",
  "travel_date": "YYYY-MM-DD or null"
}

Rules:
- If budget is not mentioned, use 0
- If currency is not mentioned, infer from context or default to USD
- If country is not mentioned, default to "US"
- travel_date is optional, default to null
- Return ONLY the JSON object, no explanations"""


def parse_intent_with_groq(text: str) -> Intent:
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": INTENT_SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ],
        temperature=0,
        max_tokens=300,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return Intent(**json.loads(raw))


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/suggest")
async def suggest(q: str = "", country: str = "IN"):
    if not q or len(q) < 2:
        return {"suggestions": []}

    try:
        params = {
            "engine": "google_autocomplete",
            "q": q,
            "api_key": os.getenv("SERPAPI_KEY"),
            "gl": country,
            "hl": "en",
        }
        data = GoogleSearch(params).get_dict()
        suggestions = [
            {"text": s["value"], "relevance": s.get("relevance", 0)}
            for s in data.get("suggestions", [])[:8]
        ]
    except Exception:
        suggestions = []

    return {"query": q, "country": country, "suggestions": suggestions}


CLARIFY_SYSTEM_PROMPT = """You are a smart shopping assistant. The user wants to search for a product but the query is ambiguous or vague.

Your job: generate 2-4 short clarifying questions to narrow down exactly what they want.

Return ONLY valid JSON:
{
  "needs_clarification": true,
  "questions": [
    {"question": "What exactly are you looking for?", "options": ["iPhone 17", "iPhone 17 Pro", "iPhone 17 Pro Max"]},
    {"question": "What's your budget range?", "options": ["Under $500", "$500-$1000", "$1000+"]}
  ]
}

If the query is already specific enough (has brand + model), return:
{
  "needs_clarification": false,
  "clarified_product": "exact product name",
  "questions": []
}

Rules:
- Questions should be short and actionable
- Options should be specific, not generic
- If brand is missing but product type is clear, ask about brand
- If model is vague, ask about specific model
- If it's clearly a specific product, don't ask anything
- Examples of specific: "iPhone 17 Pro Max 256GB", "Samsung Galaxy S25 Ultra", "Sony WH-1000XM5"
- Examples of vague: "headphones", "phone", "laptop", "earbuds", "watch"
"""


@app.post("/clarify")
async def clarify(request: Request):
    body = await request.json()
    text = body.get("text", "")

    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": CLARIFY_SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            temperature=0,
            max_tokens=500,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        result = json.loads(raw)
    except Exception:
        result = {"needs_clarification": False, "clarified_product": text, "questions": []}

    return {"original_query": text, **result}


@app.post("/parse-intent")
async def parse_intent(request: Request):
    body = await request.json()
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    try:
        intent = parse_intent_with_groq(text)
    except (json.JSONDecodeError, ValidationError):
        try:
            intent = parse_intent_with_groq(text)
        except (json.JSONDecodeError, ValidationError) as e:
            raise HTTPException(status_code=422, detail=f"Could not parse intent: {e}")

    supabase.table("parsed_intents").insert({
        "raw_input": text,
        "parsed_json": intent.model_dump(),
    }).execute()

    return intent.model_dump()


@app.post("/search-prices")
async def search_product_prices(request: Request):
    body = await request.json()
    product = body.get("product", "")
    country = body.get("country", "US")

    if not product:
        raise HTTPException(status_code=400, detail="product is required")

    try:
        results = search_prices(product, country)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

    try:
        store_prices(supabase, results)
    except Exception:
        pass

    return {"product": product, "country": country, "count": len(results), "results": results}


TARGET_COUNTRIES = ["IN", "US", "AE", "UK", "AU", "DE", "CA"]


@app.post("/compare")
async def compare(request: Request):
    body = await request.json()
    product = body.get("product", "")
    home_country = body.get("home_country", "IN")

    if not product:
        raise HTTPException(status_code=400, detail="product is required")

    result = get_full_comparison(product, home_country)

    if not result:
        raise HTTPException(status_code=404, detail="No prices found for this product")

    try:
        validated = ComparisonResponse(**result)
        return validated.model_dump()
    except ValidationError as e:
        raise HTTPException(status_code=500, detail=f"Response validation failed: {e}")


@app.post("/card-offers")
async def get_card_offers(request: Request):
    body = await request.json()
    product = body.get("product", "")
    country = body.get("country", "IN")

    if not product:
        raise HTTPException(status_code=400, detail="product is required")

    try:
        offers = search_card_offers(product, country)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Offer search failed: {str(e)}")

    normalized = []
    for offer in offers:
        savings = normalize_offer(offer, 10000)
        normalized.append({
            **offer,
            "savings_per_10k": round(savings, 2),
        })

    try:
        store_offers(supabase, offers, product, country)
    except Exception:
        pass

    return {"product": product, "country": country, "count": len(normalized), "offers": normalized}


@app.post("/seller-offers")
async def get_seller_offers(request: Request):
    body = await request.json()
    product = body.get("product", "")
    country = body.get("country", "IN")
    seller = body.get("seller", "")
    price = body.get("price", 0)

    if not product or not seller:
        raise HTTPException(status_code=400, detail="product and seller are required")

    try:
        offers = search_card_offers(product, country)
    except Exception:
        offers = []

    matched = []
    for offer in offers:
        merchant = offer.get("merchant", "").lower()
        seller_lower = seller.lower()
        if (merchant in seller_lower or seller_lower in merchant
                or merchant in "electronics"
                or any(t in seller_lower for t in ["amazon", "flipkart", "best buy", "croma", "currys", "media markt", "jb hi-fi"])):
            savings = normalize_offer(offer, price)
            if savings > 0:
                matched.append({
                    "bank": offer.get("bank_name", ""),
                    "card_type": offer.get("card_type", ""),
                    "offer_type": offer.get("offer_type", ""),
                    "value": offer.get("value", 0),
                    "value_type": offer.get("value_type", "percent"),
                    "savings": round(savings, 2),
                    "description": offer.get("description", ""),
                })

    if not matched:
        for offer in offers:
            savings = normalize_offer(offer, price)
            if savings > 0:
                matched.append({
                    "bank": offer.get("bank_name", ""),
                    "card_type": offer.get("card_type", ""),
                    "offer_type": offer.get("offer_type", ""),
                    "value": offer.get("value", 0),
                    "value_type": offer.get("value_type", "percent"),
                    "savings": round(savings, 2),
                    "description": offer.get("description", ""),
                })

    matched.sort(key=lambda x: x["savings"], reverse=True)
    return {"seller": seller, "country": country, "offers": matched}


@app.post("/timing")
async def timing(request: Request):
    body = await request.json()
    product = body.get("product", "")
    countries = body.get("countries", TARGET_COUNTRIES)

    if not product:
        raise HTTPException(status_code=400, detail="product is required")

    context = get_timing_context(product, countries)

    recommendation = "buy now"
    wait_reason = None
    for country, info in context.items():
        if info.get("recommendation") == "wait":
            recommendation = "wait"
            wait_reason = f"{info['next_event']} in {country} in {info['days_away']} days ({info['expected_discount']} off)"
            break

    return {
        "product": product,
        "timing_by_country": context,
        "overall_recommendation": recommendation,
        "wait_reason": wait_reason,
    }


ROADMAP_SYSTEM_PROMPT = """You are a shopping advisor. Given comparison data for a product across countries, generate a clear, actionable buying roadmap.

Format your response as:

## Summary
One paragraph: what the product is, what the best option is, and the final price.

## Ranked Options (best to worst)
For each country scenario, list:
- Country + seller
- Best price (with card offer if available)
- Why it's ranked here (duty, VAT, shipping, card savings)

## Timing Note
- Is there a sale coming up? When? How much could they save?
- Should they buy now or wait?

## Quick Verdict
One line: "Buy [product] from [seller] in [country] for [price] using [card]."

Rules:
- Only use numbers present in the data. Never estimate or invent prices.
- If a card offer is the best deal, highlight it.
- Keep it short and scannable.
- Use the user's home country for import duty context."""


@app.post("/roadmap")
async def roadmap(request: Request):
    body = await request.json()
    product = body.get("product", "")
    home_country = body.get("home_country", "IN")

    if not product:
        raise HTTPException(status_code=400, detail="product is required")

    comparison = get_full_comparison(product, home_country)
    if not comparison:
        raise HTTPException(status_code=404, detail="No prices found for this product")

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": ROADMAP_SYSTEM_PROMPT},
                {"role": "user", "content": json.dumps(comparison, default=str)},
            ],
            temperature=0.3,
            max_tokens=1000,
        )
        roadmap_text = response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")

    return {
        "product": product,
        "home_country": home_country,
        "roadmap": roadmap_text,
        "source_urls": [s["best_url"] for s in comparison["scenarios"] if s.get("best_url")],
        "best_country": comparison["best_country"],
        "best_price": comparison["best_price"],
        "best_seller": comparison["best_seller"],
    }
