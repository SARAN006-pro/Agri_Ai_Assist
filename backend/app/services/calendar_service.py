"""Crop calendar — planting/harvest months by crop. Status computed at runtime."""
from datetime import date

# crop -> (planting_month, harvest_month)
CALENDAR = {
    "rice":        (6, 11),
    "wheat":       (11, 4),
    "maize":       (3, 7),
    "chickpea":    (10, 3),
    "kidneybeans": (6, 10),
    "pigeonpeas":  (6, 11),
    "mothbeans":   (6, 9),
    "mungbean":    (3, 6),
    "blackgram":   (6, 9),
    "lentil":      (10, 3),
    "pomegranate": (2, 5),
    "banana":      (1, 12),
    "mango":       (3, 6),
    "grapes":      (1, 5),
    "watermelon":  (3, 7),
    "muskmelon":   (3, 7),
    "apple":       (3, 9),
    "orange":      (3, 6),
    "papaya":      (1, 12),
    "coconut":     (1, 12),
    "cotton":      (5, 11),
    "jute":        (4, 8),
    "coffee":      (10, 3),
}


def _status(planting: int, harvest: int, current: int) -> str:
    if planting <= harvest:
        growing = range(planting, harvest + 1)
    else:
        growing = list(range(planting, 13)) + list(range(1, harvest + 1))
    if current == planting:
        return "planting"
    if current == harvest:
        return "harvesting"
    if current in growing:
        return "growing"
    return "off-season"


def get_calendar(location: str | None = None) -> list[dict]:
    current_month = date.today().month
    result = []
    for crop, (p, h) in CALENDAR.items():
        result.append({
            "name": crop,
            "planting_month": p,
            "harvest_month": h,
            "status": _status(p, h, current_month),
        })
    return result


def get_crops_list() -> list[str]:
    return list(CALENDAR.keys())
