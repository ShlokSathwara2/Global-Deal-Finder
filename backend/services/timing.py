from datetime import datetime, timedelta

SALE_CALENDAR = [
    {"country_code": "IN", "event_name": "Republic Day Sale", "date_range": "Jan 20-26", "category": "all", "historical_discount_pct": 15},
    {"country_code": "IN", "event_name": "Holi Sale", "date_range": "Mar", "category": "all", "historical_discount_pct": 10},
    {"country_code": "IN", "event_name": "Amazon Prime Day", "date_range": "Jul 15-16", "category": "electronics", "historical_discount_pct": 20},
    {"country_code": "IN", "event_name": "Big Billion Days / Diwali Sale", "date_range": "Oct-Nov", "category": "all", "historical_discount_pct": 25},
    {"country_code": "IN", "event_name": "Flipkart GOAT Sale", "date_range": "Nov", "category": "all", "historical_discount_pct": 20},

    {"country_code": "US", "event_name": "Presidents' Day Sale", "date_range": "Feb 17", "category": "all", "historical_discount_pct": 15},
    {"country_code": "US", "event_name": "Amazon Prime Day", "date_range": "Jul 15-16", "category": "electronics", "historical_discount_pct": 25},
    {"country_code": "US", "event_name": "Back to School Sale", "date_range": "Aug", "category": "electronics", "historical_discount_pct": 15},
    {"country_code": "US", "event_name": "Black Friday / Cyber Monday", "date_range": "Nov 28-Dec 1", "category": "all", "historical_discount_pct": 30},
    {"country_code": "US", "event_name": "Holiday Season", "date_range": "Dec", "category": "all", "historical_discount_pct": 20},

    {"country_code": "AE", "event_name": "Dubai Shopping Festival", "date_range": "Dec 15 - Jan 31", "category": "all", "historical_discount_pct": 25},
    {"country_code": "AE", "event_name": "White Friday", "date_range": "Nov 28-30", "category": "all", "historical_discount_pct": 30},
    {"country_code": "AE", "event_name": "3-Day Super Sale", "date_range": "Mar/Sep", "category": "all", "historical_discount_pct": 20},

    {"country_code": "UK", "event_name": "Black Friday", "date_range": "Nov 28-30", "category": "all", "historical_discount_pct": 25},
    {"country_code": "UK", "event_name": "Boxing Day Sale", "date_range": "Dec 26", "category": "all", "historical_discount_pct": 30},
    {"country_code": "UK", "event_name": "Amazon Prime Day", "date_range": "Jul 15-16", "category": "electronics", "historical_discount_pct": 20},

    {"country_code": "AU", "event_name": "EOFY Sale", "date_range": "Jun", "category": "all", "historical_discount_pct": 25},
    {"country_code": "AU", "event_name": "Black Friday", "date_range": "Nov 28-30", "category": "all", "historical_discount_pct": 25},
    {"country_code": "AU", "event_name": "Boxing Day Sale", "date_range": "Dec 26", "category": "all", "historical_discount_pct": 20},

    {"country_code": "DE", "event_name": "Black Friday", "date_range": "Nov 28-30", "category": "all", "historical_discount_pct": 25},
    {"country_code": "DE", "event_name": "Winter Sale", "date_range": "Jan", "category": "all", "historical_discount_pct": 20},
    {"country_code": "DE", "event_name": "Summer Sale", "date_range": "Jul", "category": "all", "historical_discount_pct": 15},

    {"country_code": "CA", "event_name": "Black Friday", "date_range": "Nov 28-30", "category": "all", "historical_discount_pct": 25},
    {"country_code": "CA", "event_name": "Boxing Day Sale", "date_range": "Dec 26", "category": "all", "historical_discount_pct": 25},
    {"country_code": "CA", "event_name": "Amazon Prime Day", "date_range": "Jul 15-16", "category": "electronics", "historical_discount_pct": 20},
]


def get_next_event_date(date_range: str) -> datetime | None:
    now = datetime.now()
    year = now.year

    month_map = {
        "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "May": 5, "Jun": 6,
        "Jul": 7, "Aug": 8, "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
    }

    for mname, mnum in month_map.items():
        if mname in date_range:
            day = 1
            parts = date_range.replace(mname, "").strip().split("-")
            for p in parts:
                p = p.strip()
                if p.isdigit():
                    day = int(p)
                    break
            try:
                event_date = datetime(year, mnum, day)
            except ValueError:
                event_date = datetime(year, mnum, 28)
            if event_date < now - timedelta(days=30):
                event_date = event_date.replace(year=year + 1)
            return event_date

    return None


def get_timing_context(product: str, countries: list[str]) -> dict:
    now = datetime.now()
    results = {}

    for country in countries:
        events = [
            e for e in SALE_CALENDAR
            if e["country_code"] == country and (e["category"] == "all" or e["category"] in product.lower())
        ]

        nearest = None
        nearest_delta = timedelta(days=999)

        for event in events:
            event_date = get_next_event_date(event["date_range"])
            if event_date:
                delta = event_date - now
                if timedelta(days=0) <= delta < nearest_delta:
                    nearest_delta = delta
                    nearest = event

        if nearest:
            results[country] = {
                "next_event": nearest["event_name"],
                "date_range": nearest["date_range"],
                "expected_discount": f"{nearest['historical_discount_pct']}%",
                "days_away": nearest_delta.days,
                "recommendation": "wait" if nearest_delta.days <= 30 else "buy now",
            }
        else:
            results[country] = {
                "next_event": None,
                "recommendation": "buy now",
                "note": "No major sale events coming up",
            }

    return results
