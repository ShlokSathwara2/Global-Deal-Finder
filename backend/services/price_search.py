import os
import json
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
    matched = sum(1 for kw in keywords if kw in title_lower)
    return matched >= max(1, len(keywords) // 2)


def search_prices(product: str, country: str) -> list[dict]:
    cache_key = f"prices:{product}:{country}"

    if redis:
        try:
            cached = redis.get(cache_key)
            if cached:
                if isinstance(cached, str):
                    return json.loads(cached)
                return cached
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

    keywords = _extract_keywords(product)

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

    if redis:
        try:
            redis.setex(cache_key, 3600, json.dumps(results))
        except Exception:
            pass

    return results


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
