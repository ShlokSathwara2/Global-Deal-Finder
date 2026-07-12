import os
import json
from datetime import datetime

KNOWN_CARD_OFFERS = {
    "IN": [
        {"bank_name": "HDFC Bank", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 10000, "description": "5% cashback on Amazon (up to ₹1000)", "valid_until": "2026-12-31"},
        {"bank_name": "HDFC Bank", "card_type": "credit", "merchant": "flipkart", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 10000, "description": "5% cashback on Flipkart (up to ₹1000)", "valid_until": "2026-12-31"},
        {"bank_name": "ICICI Bank", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 5000, "description": "5% cashback on Amazon Pay ICICI card", "valid_until": "2026-12-31"},
        {"bank_name": "ICICI Bank", "card_type": "credit", "merchant": "flipkart", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 5000, "description": "5% instant discount on Flipkart", "valid_until": "2026-12-31"},
        {"bank_name": "SBI Card", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 10, "value_type": "percent", "min_spend": 15000, "description": "10% instant discount on Amazon (up to ₹1250)", "valid_until": "2026-12-31"},
        {"bank_name": "SBI Card", "card_type": "credit", "merchant": "flipkart", "offer_type": "cashback", "value": 10, "value_type": "percent", "min_spend": 15000, "description": "10% instant discount on Flipkart (up to ₹1250)", "valid_until": "2026-12-31"},
        {"bank_name": "Axis Bank", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 5000, "description": "5% cashback on Amazon with Axis Bank cards", "valid_until": "2026-12-31"},
        {"bank_name": "Axis Bank", "card_type": "credit", "merchant": "flipkart", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 5000, "description": "5% cashback on Flipkart with Axis Bank cards", "valid_until": "2026-12-31"},
        {"bank_name": "Kotak Mahindra", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 10000, "description": "5% cashback on Amazon (up to ₹750)", "valid_until": "2026-12-31"},
        {"bank_name": "HDFC Bank", "card_type": "credit", "merchant": "croma", "offer_type": "emi", "value": 0, "value_type": "flat", "min_spend": 0, "description": "No Cost EMI on HDFC credit cards at Croma", "valid_until": "2026-12-31"},
        {"bank_name": "HDFC Bank", "card_type": "credit", "merchant": "vijay sales", "offer_type": "emi", "value": 0, "value_type": "flat", "min_spend": 0, "description": "No Cost EMI on HDFC credit cards at Vijay Sales", "valid_until": "2026-12-31"},
        {"bank_name": "ICICI Bank", "card_type": "credit", "merchant": "croma", "offer_type": "cashback", "value": 3, "value_type": "percent", "min_spend": 10000, "description": "3% cashback at Croma (up to ₹500)", "valid_until": "2026-12-31"},
        {"bank_name": "SBI Card", "card_type": "credit", "merchant": "electronics", "offer_type": "emi", "value": 0, "value_type": "flat", "min_spend": 0, "description": "No Cost EMI on SBI Credit Cards", "valid_until": "2026-12-31"},
    ],
    "US": [
        {"bank_name": "Chase", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 0, "description": "5% back on Amazon with Chase Freedom Unlimited", "valid_until": "2026-12-31"},
        {"bank_name": "Chase", "card_type": "credit", "merchant": "best buy", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 0, "description": "5% back on Best Buy with Chase Freedom Flex", "valid_until": "2026-12-31"},
        {"bank_name": "American Express", "card_type": "credit", "merchant": "best buy", "offer_type": "cashback", "value": 5, "value_type": "flat", "min_spend": 50, "description": "$5 back on $50+ at Best Buy with Amex", "valid_until": "2026-12-31"},
        {"bank_name": "American Express", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 3, "value_type": "flat", "min_spend": 50, "description": "$3 back on $50+ at Amazon with Amex", "valid_until": "2026-12-31"},
        {"bank_name": "Citi", "card_type": "credit", "merchant": "best buy", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 0, "description": "5% back on electronics at Best Buy with Citi Custom Cash", "valid_until": "2026-12-31"},
        {"bank_name": "Wells Fargo", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 0, "description": "5% back on Amazon with Wells Fargo Autograph", "valid_until": "2026-12-31"},
        {"bank_name": "Capital One", "card_type": "credit", "merchant": "best buy", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 0, "description": "5% back on Best Buy with Capital One SavorOne", "valid_until": "2026-12-31"},
    ],
    "AE": [
        {"bank_name": "Emirates NBD", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 500, "description": "5% cashback on Amazon.ae (up to AED 200)", "valid_until": "2026-12-31"},
        {"bank_name": "Emirates NBD", "card_type": "credit", "merchant": "noon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 300, "description": "5% cashback on Noon (up to AED 150)", "valid_until": "2026-12-31"},
        {"bank_name": "ADCB", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 10, "value_type": "percent", "min_spend": 500, "description": "10% cashback on Amazon.ae (up to AED 100)", "valid_until": "2026-12-31"},
        {"bank_name": "Mashreq Bank", "card_type": "credit", "merchant": "noon", "offer_type": "cashback", "value": 10, "value_type": "percent", "min_spend": 200, "description": "10% cashback on Noon (up to AED 75)", "valid_until": "2026-12-31"},
        {"bank_name": "FAB", "card_type": "credit", "merchant": "electronics", "offer_type": "emi", "value": 0, "value_type": "flat", "min_spend": 0, "description": "0% installment plans for 6 months on electronics", "valid_until": "2026-12-31"},
        {"bank_name": "RAKBANK", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 8, "value_type": "percent", "min_spend": 500, "description": "8% cashback on Amazon.ae (up to AED 150)", "valid_until": "2026-12-31"},
    ],
    "UK": [
        {"bank_name": "Barclaycard", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 3, "value_type": "percent", "min_spend": 0, "description": "3% cashback on Amazon with Barclaycard Rewards", "valid_until": "2026-12-31"},
        {"bank_name": "HSBC", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 3, "value_type": "percent", "min_spend": 0, "description": "3% cashback at Amazon with HSBC Premier", "valid_until": "2026-12-31"},
        {"bank_name": "Santander", "card_type": "credit", "merchant": "currys", "offer_type": "cashback", "value": 3, "value_type": "percent", "min_spend": 0, "description": "3% cashback at Currys with Santander Edge", "valid_until": "2026-12-31"},
        {"bank_name": "Nationwide", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 0, "description": "5% cashback for 12 months on Amazon (FlexPlus)", "valid_until": "2026-12-31"},
        {"bank_name": "Halifax", "card_type": "credit", "merchant": "currys", "offer_type": "emi", "value": 0, "value_type": "flat", "min_spend": 0, "description": "0% interest for 12 months on purchases over £250", "valid_until": "2026-12-31"},
        {"bank_name": "John Lewis", "card_type": "credit", "merchant": "john lewis", "offer_type": "cashback", "value": 2, "value_type": "percent", "min_spend": 0, "description": "2% reward on John Lewis purchases", "valid_until": "2026-12-31"},
    ],
    "AU": [
        {"bank_name": "ANZ", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 100, "description": "5% cashback on Amazon AU (up to AUD 50)", "valid_until": "2026-12-31"},
        {"bank_name": "CommBank", "card_type": "credit", "merchant": "jb hi-fi", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 100, "description": "5% cashback at JB Hi-Fi with CommBank card", "valid_until": "2026-12-31"},
        {"bank_name": "Westpac", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 100, "description": "5% cashback on Amazon AU (up to AUD 40)", "valid_until": "2026-12-31"},
        {"bank_name": "NAB", "card_type": "credit", "merchant": "jb hi-fi", "offer_type": "cashback", "value": 5, "value_type": "percent", "min_spend": 100, "description": "5% cashback at JB Hi-Fi (up to AUD 50)", "valid_until": "2026-12-31"},
        {"bank_name": "AMEX", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 3, "value_type": "flat", "min_spend": 50, "description": "$3 back on $50+ at Amazon AU", "valid_until": "2026-12-31"},
    ],
    "DE": [
        {"bank_name": "DKB", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 3, "value_type": "percent", "min_spend": 0, "description": "3% cashback on Amazon.de with DKB Visa", "valid_until": "2026-12-31"},
        {"bank_name": "N26", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 1, "value_type": "percent", "min_spend": 0, "description": "1% cashback on Amazon.de with N26", "valid_until": "2026-12-31"},
        {"bank_name": "Deutsche Bank", "card_type": "credit", "merchant": "media markt", "offer_type": "emi", "value": 0, "value_type": "flat", "min_spend": 0, "description": "0% financing for 12 months at MediaMarkt", "valid_until": "2026-12-31"},
        {"bank_name": "Commerzbank", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 2, "value_type": "percent", "min_spend": 0, "description": "2% cashback on Amazon.de", "valid_until": "2026-12-31"},
        {"bank_name": "Santander", "card_type": "credit", "merchant": "saturn", "offer_type": "emi", "value": 0, "value_type": "flat", "min_spend": 0, "description": "0% Ratenkauf for 12 months at Saturn", "valid_until": "2026-12-31"},
    ],
    "CA": [
        {"bank_name": "RBC", "card_type": "credit", "merchant": "best buy", "offer_type": "cashback", "value": 4, "value_type": "percent", "min_spend": 0, "description": "4% cashback at Best Buy with RBC Avion", "valid_until": "2026-12-31"},
        {"bank_name": "TD Bank", "card_type": "credit", "merchant": "best buy", "offer_type": "cashback", "value": 3, "value_type": "percent", "min_spend": 0, "description": "3% cashback at Best Buy with TD Cash Visa", "valid_until": "2026-12-31"},
        {"bank_name": "Scotiabank", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 4, "value_type": "percent", "min_spend": 0, "description": "4% cashback on Amazon.ca with Scotiabank Scene+", "valid_until": "2026-12-31"},
        {"bank_name": "CIBC", "card_type": "credit", "merchant": "best buy", "offer_type": "cashback", "value": 2, "value_type": "flat", "min_spend": 50, "description": "$2 back on $50+ at Best Buy with CIBC Aventura", "valid_until": "2026-12-31"},
        {"bank_name": "BMO", "card_type": "credit", "merchant": "amazon", "offer_type": "cashback", "value": 3, "value_type": "percent", "min_spend": 0, "description": "3% cashback on Amazon.ca with BMO Eclipse", "valid_until": "2026-12-31"},
    ],
}


def search_card_offers(product: str, country: str) -> list[dict]:
    offers = KNOWN_CARD_OFFERS.get(country, KNOWN_CARD_OFFERS.get("US", []))
    return offers


def normalize_offer(offer: dict, purchase_amount: float) -> float:
    value = offer.get("value", 0)
    value_type = offer.get("value_type", "percent")
    offer_type = offer.get("offer_type", "cashback")

    if offer_type == "cashback":
        if value_type == "percent":
            return purchase_amount * (value / 100)
        else:
            return min(value, purchase_amount * 0.5)

    elif offer_type == "discount":
        if value_type == "percent":
            return purchase_amount * (value / 100)
        else:
            return min(value, purchase_amount * 0.5)

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
