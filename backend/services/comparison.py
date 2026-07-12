from pydantic import BaseModel
from services.price_search import search_prices, store_prices
from services.true_cost import calculate_true_cost, CURRENCY_SYMBOLS, COUNTRY_CURRENCY, convert_to_home_currency
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
    carried_price_home: float
    duty: float
    shipping: float
    vat: float
    under_duty_free: bool
    emi_monthly: float
    emi_total: float
    emi_monthly_home: float
    emi_total_home: float
    card_offers: list[CardOfferInfo] = []
    best_card_savings: float = 0
    final_price: float = 0
    final_price_home: float = 0


class CountryScenarioSchema(BaseModel):
    country: str
    currency: str
    symbol: str
    home_currency: str
    home_symbol: str
    sellers: list[SellerSchema]
    total_sellers: int
    best_price: float | None = None
    best_price_home: float | None = None
    best_seller: str = ""
    best_url: str = ""
    best_emi_price: float | None = None
    best_emi_price_home: float | None = None
    best_emi_monthly: float | None = None
    best_emi_monthly_home: float | None = None
    best_emi_seller: str = ""
    best_emi_url: str = ""
    country_best: str = ""


class ComparisonResponse(BaseModel):
    product: str
    home_country: str
    home_currency: str
    home_symbol: str
    scenarios: list[CountryScenarioSchema]
    best_country: str
    best_price: float
    best_price_home: float
    best_seller: str
    best_url: str
    best_emi_country: str
    best_emi_price: float
    best_emi_price_home: float
    best_emi_monthly: float
    best_emi_monthly_home: float
    best_emi_seller: str
    best_emi_url: str
    timing: dict


def get_full_comparison(product: str, home_country: str = "IN") -> dict:
    all_scenarios = []
    home_currency_info = CURRENCY_SYMBOLS.get(home_country, ("INR", "₹"))
    home_currency_code = home_currency_info[0]
    home_currency_symbol = home_currency_info[1]

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
            carried_home = cost["carried_price_home"]
            emi_total = carried * (1 + EMI_INTEREST_RATE)
            emi_monthly = emi_total / EMI_MONTHS
            emi_total_home = convert_to_home_currency(emi_total, COUNTRY_CURRENCY.get(country, "USD"), home_currency_code)
            emi_monthly_home = convert_to_home_currency(emi_monthly, COUNTRY_CURRENCY.get(country, "USD"), home_currency_code)

            sellers.append({
                "seller": seller_name,
                "price": price,
                "url": r.get("url", ""),
                "title": r.get("title", ""),
                "rating": r.get("rating"),
                "reviews": int(r["reviews"]) if r.get("reviews") else None,
                "local_price": cost["local_price"],
                "imported_price": cost["imported_price"],
                "carried_price": carried,
                "carried_price_home": carried_home,
                "duty": cost["duty"],
                "shipping": cost["shipping"],
                "vat": cost["vat"],
                "under_duty_free": cost["under_duty_free"],
                "emi_monthly": round(emi_monthly, 2),
                "emi_total": round(emi_total, 2),
                "emi_monthly_home": round(emi_monthly_home, 2),
                "emi_total_home": round(emi_total_home, 2),
                "card_offers": [],
                "best_card_savings": 0,
                "final_price": carried,
                "final_price_home": carried_home,
            })

        # Sort by home currency price (the actual comparison metric)
        sellers.sort(key=lambda x: x["final_price_home"])
        sellers = sellers[:10]
        best = sellers[0] if sellers else None

        sellers_by_emi = sorted(sellers, key=lambda x: x["emi_total_home"])
        best_emi = sellers_by_emi[0] if sellers_by_emi else None

        if best:
            country_best = f"Best in {country}: {currency_info[1]}{best['final_price']:,.2f} ({home_currency_symbol}{best['final_price_home']:,.2f}) from {best['seller']}"
        else:
            country_best = f"No prices found in {country}"

        all_scenarios.append({
            "country": country,
            "currency": currency_info[0],
            "symbol": currency_info[1],
            "home_currency": home_currency_code,
            "home_symbol": home_currency_symbol,
            "sellers": sellers,
            "total_sellers": len(sellers),
            "best_price": best["final_price"] if best else None,
            "best_price_home": best["final_price_home"] if best else None,
            "best_seller": best["seller"] if best else "",
            "best_url": best["url"] if best else "",
            "best_emi_price": best_emi["emi_total"] if best_emi else None,
            "best_emi_price_home": best_emi["emi_total_home"] if best_emi else None,
            "best_emi_monthly": best_emi["emi_monthly"] if best_emi else None,
            "best_emi_monthly_home": best_emi["emi_monthly_home"] if best_emi else None,
            "best_emi_seller": best_emi["seller"] if best_emi else "",
            "best_emi_url": best_emi["url"] if best_emi else "",
            "country_best": country_best,
        })

    all_with_prices = [s for s in all_scenarios if s["best_price_home"] is not None]
    all_with_emi = [s for s in all_scenarios if s["best_emi_price_home"] is not None]

    if not all_with_prices:
        return None

    # Compare ALL countries by home currency price
    all_with_prices.sort(key=lambda x: x["best_price_home"])
    best_scenario = all_with_prices[0]

    all_with_emi.sort(key=lambda x: x["best_emi_price_home"])
    best_emi_scenario = all_with_emi[0] if all_with_emi else best_scenario

    try:
        timing = get_timing_context(product, TARGET_COUNTRIES)
    except Exception:
        timing = {}

    return {
        "product": product,
        "home_country": home_country,
        "home_currency": home_currency_code,
        "home_symbol": home_currency_symbol,
        "scenarios": all_scenarios,
        "best_country": best_scenario["country"],
        "best_price": best_scenario["best_price"],
        "best_price_home": best_scenario["best_price_home"],
        "best_seller": best_scenario["best_seller"],
        "best_url": best_scenario["best_url"],
        "best_emi_country": best_emi_scenario["country"],
        "best_emi_price": best_emi_scenario["best_emi_price"],
        "best_emi_price_home": best_emi_scenario["best_emi_price_home"],
        "best_emi_monthly": best_emi_scenario["best_emi_monthly"],
        "best_emi_monthly_home": best_emi_scenario["best_emi_monthly_home"],
        "best_emi_seller": best_emi_scenario["best_emi_seller"],
        "best_emi_url": best_emi_scenario["best_emi_url"],
        "timing": timing,
    }
