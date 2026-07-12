import os
import json
from statistics import median
from serpapi import GoogleSearch

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

try:
    from upstash_redis import Redis
    redis = Redis(
        url=os.getenv("UPSTASH_REDIS_REST_URL", ""),
        token=os.getenv("UPSTASH_REDIS_REST_TOKEN", ""),
    )
except Exception:
    redis = None

COUNTRY_LANGUAGES = {
    "US": "en", "IN": "en", "AE": "en", "UK": "en",
    "AU": "en", "DE": "de", "CA": "en",
}

NOISE_WORDS = {"the", "a", "an", "with", "for", "and", "or", "new", "original", "genuine", "imported", "international"}


def _extract_keywords(product: str) -> list[str]:
    words = product.lower().split()
    return [w for w in words if w not in NOISE_WORDS and len(w) > 1]


def _is_relevant(title: str, keywords: list[str]) -> bool:
    title_lower = title.lower()
    if not keywords:
        return True
    matched = sum(1 for kw in keywords if kw in title_lower)
    if matched < len(keywords):
        return False
    return True


def _filter_by_price_floor(results: list[dict]) -> list[dict]:
    prices = [r["price"] for r in results if r.get("price", 0) > 0]
    if len(prices) < 3:
        return results
    med = median(prices)
    floor = med * 0.15
    return [r for r in results if r.get("price", 0) >= floor]


def search_prices(product: str, country: str) -> list[dict]:
    keywords = _extract_keywords(product)
    cache_key = f"prices:{product}:{country}"

    if redis:
        try:
            cached = redis.get(cache_key)
            if cached:
                raw = json.loads(cached) if isinstance(cached, str) else cached
                filtered = [r for r in raw if _is_relevant(r.get("title", ""), keywords) and r.get("price", 0) > 0]
                return _filter_by_price_floor(filtered)
        except Exception:
            pass

    params = {
        "engine": "google_shopping",
        "q": product,
        "api_key": SERPAPI_KEY,
        "gl": country,
        "hl": COUNTRY_LANGUAGES.get(country, "en"),
        "num": 20,
    }

    search = GoogleSearch(params)
    data = search.get_dict()

    results = []
    for item in data.get("shopping_results", []):
        title = item.get("title", "")
        price = item.get("extracted_price", 0)
        if price <= 0:
            continue
        if not _is_relevant(title, keywords):
            continue
        results.append({
            "product": product,
            "country": country,
            "seller": item.get("source", "Unknown"),
            "price": price,
            "currency": item.get("currency", "USD"),
            "url": item.get("product_link") or item.get("link") or "",
            "title": title,
            "rating": item.get("rating"),
            "reviews": item.get("reviews"),
            "thumbnail": item.get("thumbnail"),
        })

    filtered = _filter_by_price_floor(results)

    if redis:
        try:
            redis.setex(cache_key, 3600, json.dumps(filtered))
        except Exception:
            pass

    return filtered


def store_prices(supabase, results: list[dict]):
    for r in results:
        try:
            supabase.table("price_snapshots").insert({
                "product": r["product"],
                "country": r["country"],
                "seller": r["seller"],
                "price": r["price"],
                "currency": r["currency"],
                "url": r["url"],
            }).execute()
        except Exception:
            pass
