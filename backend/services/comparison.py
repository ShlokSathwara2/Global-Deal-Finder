from pydantic import BaseModel
from services.price_search import search_prices, store_prices
from services.true_cost import calculate_true_cost, CURRENCY_SYMBOLS
from services.timing import get_timing_context
from services.card_offers import search_card_offers, normalize_offer

TARGET_COUNTRIES = ["IN", "US", "AE", "UK", "AU", "DE", "CA"]

EMI_MONTHS = 12
EMI_INTEREST_RATE = 0.12

TRUSTED_SELLERS = {
    "IN": ["amazon", "flipkart", "croma", "reliance digital", "vijay sales", "tata cliq", "paytm mall", "snapdeal", "jiomart", "samsung", "apple", "oneplus", "mi", "xiaomi", "nokia", "aditya birla", "cromā"],
    "US": ["amazon", "best buy", "walmart", "target", "costco", "newegg", "adorama", "bh photo", "samsung", "apple", "bhphotovideo", "staples", "office depot", "micro center"],
    "AE": ["amazon", "noon", "carrefour", "lulu", "emaar", "samsung", "apple", "jumbo", "sharaf dg", "al futtaim", "virgin megastore"],
    "UK": ["amazon", "currys", "john lewis", "argos", "very", "littlewoods", "samsung", "apple", "carphone warehouse", "dixons", "tesco", "sainsburys", "ocado"],
    "AU": ["jb hi-fi", "officeworks", "kogan", "amazon", "the good guys", "harvey norman", "samsung", "apple", "dick smith", "centrecom", "msy", "ple"],
    "DE": ["amazon", "media markt", "saturn", "otto", "idealo", "otto.de", "alternate", "cyberport", "notebooksbilliger", "samsung", "apple", "conrad"],
    "CA": ["amazon", "best buy", "canadian tire", "walmart", "staples", "newegg", "memory express", "samsung", "apple", "costco", "the source"],
}


def is_trusted_seller(seller_name: str, country: str) -> bool:
    seller_lower = seller_name.lower()
    trusted_list = TRUSTED_SELLERS.get(country, TRUSTED_SELLERS["US"])
    for trusted in trusted_list:
        if trusted in seller_lower or seller_lower in trusted:
            return True
    return False


class CardOfferInfo(BaseModel):
    bank: str = ""
    card_type: str = ""
    offer_type: str = ""
    value: float = 0
    value_type: str = "percent"
    savings: float = 0
    description: str = ""


class SellerSchema(BaseModel):
    seller: str
    price: float
    url: str
    title: str = ""
    rating: float | None = None
    reviews: int | None = None
    local_price: float
    imported_price: float
    carried_price: float
    duty: float
    shipping: float
    vat: float
    under_duty_free: bool
    emi_monthly: float
    emi_total: float
    card_offers: list[CardOfferInfo] = []
    best_card_savings: float = 0
    final_price: float = 0


class CountryScenarioSchema(BaseModel):
    country: str
    currency: str
    symbol: str
    sellers: list[SellerSchema]
    total_sellers: int
    best_price: float | None = None
    best_seller: str = ""
    best_url: str = ""
    best_emi_price: float | None = None
    best_emi_monthly: float | None = None
    best_emi_seller: str = ""
    best_emi_url: str = ""
    country_best: str = ""


class ComparisonResponse(BaseModel):
    product: str
    home_country: str
    scenarios: list[CountryScenarioSchema]
    best_country: str
    best_price: float
    best_seller: str
    best_url: str
    best_emi_country: str
    best_emi_price: float
    best_emi_monthly: float
    best_emi_seller: str
    best_emi_url: str
    timing: dict


def get_full_comparison(product: str, home_country: str = "IN") -> dict:
    all_scenarios = []

    for country in TARGET_COUNTRIES:
        currency_info = CURRENCY_SYMBOLS.get(country, ("USD", "$"))

        try:
            results = search_prices(product, country)
        except Exception:
            results = []

        sellers = []
        for r in results:
            price = r.get("price", 0)
            if price <= 0:
                continue

            seller_name = r.get("seller", "Unknown")
            if not is_trusted_seller(seller_name, country):
                continue

            cost = calculate_true_cost(price, country, home_country)
            carried = cost["carried_price"]
            emi_total = carried * (1 + EMI_INTEREST_RATE)
            emi_monthly = emi_total / EMI_MONTHS

            sellers.append({
                "seller": seller_name,
                "price": price,
                "url": r.get("url", ""),
                "title": r.get("title", ""),
                "rating": r.get("rating"),
                "reviews": r.get("reviews"),
                "local_price": cost["local_price"],
                "imported_price": cost["imported_price"],
                "carried_price": carried,
                "duty": cost["duty"],
                "shipping": cost["shipping"],
                "vat": cost["vat"],
                "under_duty_free": cost["under_duty_free"],
                "emi_monthly": round(emi_monthly, 2),
                "emi_total": round(emi_total, 2),
                "card_offers": [],
                "best_card_savings": 0,
                "final_price": carried,
            })

        sellers.sort(key=lambda x: x["final_price"])
        sellers = sellers[:10]
        best = sellers[0] if sellers else None

        sellers_by_emi = sorted(sellers, key=lambda x: x["emi_total"])
        best_emi = sellers_by_emi[0] if sellers_by_emi else None

        if best:
            country_best = f"Best in {country}: {currency_info[1]}{best['final_price']:,.2f} from {best['seller']}"
        else:
            country_best = f"No prices found in {country}"

        all_scenarios.append({
            "country": country,
            "currency": currency_info[0],
            "symbol": currency_info[1],
            "sellers": sellers,
            "total_sellers": len(sellers),
            "best_price": best["final_price"] if best else None,
            "best_seller": best["seller"] if best else "",
            "best_url": best["url"] if best else "",
            "best_emi_price": best_emi["emi_total"] if best_emi else None,
            "best_emi_monthly": best_emi["emi_monthly"] if best_emi else None,
            "best_emi_seller": best_emi["seller"] if best_emi else "",
            "best_emi_url": best_emi["url"] if best_emi else "",
            "country_best": country_best,
        })

    all_with_prices = [s for s in all_scenarios if s["best_price"] is not None]
    all_with_emi = [s for s in all_scenarios if s["best_emi_price"] is not None]

    if not all_with_prices:
        return None

    all_with_prices.sort(key=lambda x: x["best_price"])
    best_scenario = all_with_prices[0]

    all_with_emi.sort(key=lambda x: x["best_emi_price"])
    best_emi_scenario = all_with_emi[0] if all_with_emi else best_scenario

    try:
        timing = get_timing_context(product, TARGET_COUNTRIES)
    except Exception:
        timing = {}

    return {
        "product": product,
        "home_country": home_country,
        "scenarios": all_scenarios,
        "best_country": best_scenario["country"],
        "best_price": best_scenario["best_price"],
        "best_seller": best_scenario["best_seller"],
        "best_url": best_scenario["best_url"],
        "best_emi_country": best_emi_scenario["country"],
        "best_emi_price": best_emi_scenario["best_emi_price"],
        "best_emi_monthly": best_emi_scenario["best_emi_monthly"],
        "best_emi_seller": best_emi_scenario["best_emi_seller"],
        "best_emi_url": best_emi_scenario["best_emi_url"],
        "timing": timing,
    }
