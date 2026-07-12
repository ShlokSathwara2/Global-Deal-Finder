# Exchange rates to INR (base currency)
EXCHANGE_RATES_TO_INR = {
    "INR": 1.0,
    "USD": 83.50,
    "AED": 22.73,
    "GBP": 105.80,
    "AUD": 54.50,
    "EUR": 90.20,
    "CAD": 61.50,
}

COUNTRY_CURRENCY = {
    "IN": "INR",
    "US": "USD",
    "AE": "AED",
    "UK": "GBP",
    "AU": "AUD",
    "DE": "EUR",
    "CA": "CAD",
}


def convert_to_home_currency(amount: float, from_currency: str, to_currency: str) -> float:
    """Convert amount from one currency to another via INR as base."""
    if from_currency == to_currency:
        return amount
    inr_amount = amount * EXCHANGE_RATES_TO_INR.get(from_currency, 1.0)
    result = inr_amount / EXCHANGE_RATES_TO_INR.get(to_currency, 1.0)
    return round(result, 2)


COUNTRY_RULES = {
    "IN": {
        "country_code": "IN",
        "customs_duty_pct": 20.0,
        "duty_free_allowance_value": 50000,
        "vat_rate_pct": 18.0,
        "vat_refund_available": False,
        "vat_refund_deduction_pct": 0.0,
        "shipping_estimate_pct": 5.0,
    },
    "US": {
        "country_code": "US",
        "customs_duty_pct": 0.0,
        "duty_free_allowance_value": 800,
        "vat_rate_pct": 0.0,
        "vat_refund_available": False,
        "vat_refund_deduction_pct": 0.0,
        "shipping_estimate_pct": 8.0,
    },
    "AE": {
        "country_code": "AE",
        "customs_duty_pct": 5.0,
        "duty_free_allowance_value": 3000,
        "vat_rate_pct": 5.0,
        "vat_refund_available": True,
        "vat_refund_deduction_pct": 4.6,
        "shipping_estimate_pct": 6.0,
    },
    "UK": {
        "country_code": "UK",
        "customs_duty_pct": 0.0,
        "duty_free_allowance_value": 390,
        "vat_rate_pct": 20.0,
        "vat_refund_available": True,
        "vat_refund_deduction_pct": 4.0,
        "shipping_estimate_pct": 7.0,
    },
    "AU": {
        "country_code": "AU",
        "customs_duty_pct": 5.0,
        "duty_free_allowance_value": 900,
        "vat_rate_pct": 10.0,
        "vat_refund_available": True,
        "vat_refund_deduction_pct": 4.0,
        "shipping_estimate_pct": 8.0,
    },
    "DE": {
        "country_code": "DE",
        "customs_duty_pct": 0.0,
        "duty_free_allowance_value": 430,
        "vat_rate_pct": 19.0,
        "vat_refund_available": True,
        "vat_refund_deduction_pct": 4.0,
        "shipping_estimate_pct": 7.0,
    },
    "CA": {
        "country_code": "CA",
        "customs_duty_pct": 0.0,
        "duty_free_allowance_value": 200,
        "vat_rate_pct": 5.0,
        "vat_refund_available": False,
        "vat_refund_deduction_pct": 0.0,
        "shipping_estimate_pct": 8.0,
    },
}

CURRENCY_SYMBOLS = {
    "IN": ("INR", "₹"),
    "US": ("USD", "$"),
    "AE": ("AED", "AED "),
    "UK": ("GBP", "£"),
    "AU": ("AUD", "A$"),
    "DE": ("EUR", "€"),
    "CA": ("CAD", "C$"),
}


def get_country_rules(country_code: str) -> dict:
    return COUNTRY_RULES.get(country_code.upper(), COUNTRY_RULES["US"])


def calculate_true_cost(price: float, country_code: str, home_country: str) -> dict:
    rules = get_country_rules(country_code)
    home_rules = get_country_rules(home_country)

    shipping = price * (rules["shipping_estimate_pct"] / 100)
    duty = price * (rules["customs_duty_pct"] / 100)
    imported_price = price + shipping + duty

    vat = price * (rules["vat_rate_pct"] / 100)
    price_with_vat = price + vat

    if rules["vat_refund_available"]:
        refund_amount = price * (rules["vat_rate_pct"] / 100) * (1 - rules["vat_refund_deduction_pct"] / 100)
        carried_price = price_with_vat - refund_amount
    else:
        carried_price = price_with_vat

    under_duty_free = price <= rules["duty_free_allowance_value"]

    from_currency = COUNTRY_CURRENCY.get(country_code, "USD")
    to_currency = COUNTRY_CURRENCY.get(home_country, "INR")
    home_symbol = CURRENCY_SYMBOLS.get(home_country, ("INR", "₹"))[1]

    carried_in_home = convert_to_home_currency(carried_price, from_currency, to_currency)

    return {
        "country": country_code,
        "local_price": price,
        "imported_price": round(imported_price, 2),
        "carried_price": round(carried_price, 2),
        "carried_price_home": carried_in_home,
        "duty": round(duty, 2),
        "shipping": round(shipping, 2),
        "vat": round(vat, 2),
        "vat_refund": round(price * rules["vat_rate_pct"] / 100 * rules["vat_refund_deduction_pct"] / 100, 2) if rules["vat_refund_available"] else 0,
        "duty_free_limit": rules["duty_free_allowance_value"],
        "under_duty_free": under_duty_free,
        "currency": CURRENCY_SYMBOLS.get(country_code, ("USD", "$"))[0],
        "symbol": CURRENCY_SYMBOLS.get(country_code, ("USD", "$"))[1],
        "home_currency": to_currency,
        "home_symbol": home_symbol,
    }
