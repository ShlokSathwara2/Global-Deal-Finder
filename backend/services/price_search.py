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
        "num": 10,
    }

    search = GoogleSearch(params)
    data = search.get_dict()

    results = []
    for item in data.get("shopping_results", []):
        results.append({
            "product": product,
            "country": country,
            "seller": item.get("source", "Unknown"),
            "price": item.get("extracted_price", 0),
            "currency": item.get("currency", "USD"),
            "url": item.get("product_link") or item.get("link") or "",
            "title": item.get("title", ""),
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
