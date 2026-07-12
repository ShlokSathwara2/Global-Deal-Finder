import os
import json
from serpapi import GoogleSearch
from groq import Groq
from datetime import datetime

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

CARD_OFFER_PROMPT = """Extract ALL credit card and debit card offers from this search result. For each offer, return a JSON array of objects with these fields:

[
  {
    "bank_name": "bank or card issuer name",
    "card_type": "credit or debit",
    "merchant": "merchant or category (e.g., Amazon, Flipkart, Electronics)",
    "offer_type": "cashback, discount, emi, or reward",
    "value": number (percentage or flat amount),
    "value_type": "percent or flat",
    "min_spend": number or null,
    "description": "short description of the offer",
    "valid_until": "date string or null"
  }
]

Rules:
- Only include real, specific offers with numbers
- If no offers found, return an empty array []
- Return ONLY the JSON array, no explanations"""


def search_card_offers(product: str, country: str) -> list[dict]:
    merchant = product.split()[0] if product else "electronics"
    query = f"{merchant} credit card offer {country} 2026"

    params = {
        "engine": "google",
        "q": query,
        "api_key": os.getenv("SERPAPI_KEY"),
        "gl": country,
        "num": 5,
    }

    try:
        search = GoogleSearch(params)
        data = search.get_dict()
    except Exception:
        return []

    snippets = []
    for result in data.get("organic_results", [])[:5]:
        title = result.get("title", "")
        snippet = result.get("snippet", "")
        link = result.get("link", "")
        snippets.append(f"Title: {title}\nSnippet: {snippet}\nURL: {link}")

    if not snippets:
        return []

    combined = "\n\n".join(snippets)

    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": CARD_OFFER_PROMPT},
                {"role": "user", "content": combined},
            ],
            temperature=0,
            max_tokens=800,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        offers = json.loads(raw)
        if not isinstance(offers, list):
            offers = []
    except Exception:
        offers = []

    return offers


def normalize_offer(offer: dict, purchase_amount: float) -> float:
    value = offer.get("value", 0)
    value_type = offer.get("value_type", "percent")
    offer_type = offer.get("offer_type", "cashback")

    if offer_type == "cashback":
        if value_type == "percent":
            return purchase_amount * (value / 100)
        else:
            return value

    elif offer_type == "discount":
        if value_type == "percent":
            return purchase_amount * (value / 100)
        else:
            return value

    elif offer_type == "emi":
        return 0

    elif offer_type == "reward":
        if value_type == "percent":
            return purchase_amount * (value / 100) * 0.5
        else:
            return value * 0.5

    return 0


def store_offers(supabase, offers: list[dict], product: str, country: str):
    for offer in offers:
        try:
            supabase.table("card_offers").insert({
                "bank_name": offer.get("bank_name", ""),
                "card_type": offer.get("card_type", ""),
                "merchant": offer.get("merchant", ""),
                "offer_type": offer.get("offer_type", ""),
                "value": offer.get("value", 0),
                "value_type": offer.get("value_type", "percent"),
                "min_spend": offer.get("min_spend"),
                "valid_until": offer.get("valid_until"),
                "source_url": "",
                "last_verified_at": datetime.now().isoformat(),
            }).execute()
        except Exception:
            pass
