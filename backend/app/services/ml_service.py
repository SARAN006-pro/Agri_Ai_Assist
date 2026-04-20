"""
Crop recommendation and yield prediction.
Uses deterministic rule-based logic — no heavy ML runtime dependencies.
scikit-learn is listed in requirements but only used for the optional offline
training script; all runtime predictions are pure-Python rule tables.
"""
from app.database import get_db
from app.utils import today_str

# ---------------------------------------------------------------------------
# Crop suitability rules
# Each entry: (crop, N_min, N_max, P_min, P_max, K_min, K_max,
#               temp_min, temp_max, humidity_min, humidity_max,
#               ph_min, ph_max, rainfall_min, rainfall_max)
# ---------------------------------------------------------------------------
CROP_RULES = [
    ("rice",       60, 200,  30, 200,  30, 200, 20, 35, 60, 100, 5.5, 7.0,  150, 500),
    ("wheat",      60, 200,  30, 200,  30, 200, 10, 25, 40,  80, 6.0, 7.5,   50, 300),
    ("maize",      60, 200,  30, 200,  30, 200, 18, 35, 50,  90, 5.5, 7.5,   60, 300),
    ("chickpea",   20, 100,  30, 200,  20, 200, 10, 30, 40,  80, 6.0, 8.0,   30, 200),
    ("kidneybeans",20, 100,  30, 200,  20, 200, 15, 30, 40,  80, 5.5, 7.5,   30, 200),
    ("pigeonpeas", 20, 100,  30, 200,  20, 200, 20, 35, 50,  80, 5.5, 7.5,   40, 250),
    ("mothbeans",  20, 100,  20, 200,  20, 200, 25, 40, 30,  60, 6.0, 8.0,   20, 100),
    ("mungbean",   20, 100,  20, 200,  20, 200, 20, 35, 40,  80, 6.0, 7.5,   40, 150),
    ("blackgram",  20, 100,  20, 200,  20, 200, 20, 35, 40,  80, 5.5, 7.0,   40, 150),
    ("lentil",     20, 100,  20, 200,  20, 200, 10, 28, 40,  80, 6.0, 7.5,   20, 150),
    ("pomegranate", 0, 100,  10, 100,  10, 200, 18, 40, 30,  80, 5.5, 7.5,   30, 200),
    ("banana",     80, 200,  30, 200,  30, 200, 22, 35, 60, 100, 5.5, 7.0,  100, 400),
    ("mango",      30, 150,  10, 150,  10, 200, 22, 40, 40,  80, 5.5, 7.5,   40, 300),
    ("grapes",      0, 100,  10, 200,  10, 200, 15, 38, 30,  80, 5.5, 7.5,   20, 200),
    ("watermelon",  0, 100,  10, 200,  10, 200, 24, 40, 30,  80, 6.0, 7.5,   30, 200),
    ("muskmelon",   0, 100,  10, 200,  10, 200, 24, 40, 30,  80, 6.0, 7.5,   30, 200),
    ("apple",       0, 100,  10, 200,  10, 200,  3, 20, 40,  80, 5.5, 6.5,   60, 250),
    ("orange",     20, 120,  10, 200,  10, 200, 15, 35, 40,  80, 5.5, 7.0,   60, 200),
    ("papaya",     40, 150,  10, 200,  20, 200, 22, 38, 50,  90, 5.5, 7.5,   80, 400),
    ("coconut",    20, 120,  10, 200,  10, 200, 22, 37, 60, 100, 5.5, 8.0,  100, 500),
    ("cotton",     60, 200,  30, 200,  20, 200, 21, 35, 50,  80, 5.8, 8.0,   60, 250),
    ("jute",       60, 200,  30, 200,  30, 200, 22, 36, 70, 100, 6.0, 7.5,  150, 500),
    ("coffee",     20, 120,  20, 200,  20, 200, 15, 28, 60, 100, 6.0, 7.0,  150, 400),
]

CROPS = [r[0] for r in CROP_RULES]

# Yield base values (kg/ha) and coefficients for simple linear model
YIELD_BASE = {
    "rice": 3500, "wheat": 3000, "maize": 4000, "chickpea": 1200,
    "kidneybeans": 1500, "pigeonpeas": 1200, "mothbeans": 800,
    "mungbean": 900, "blackgram": 900, "lentil": 1000,
    "pomegranate": 8000, "banana": 15000, "mango": 10000, "grapes": 8000,
    "watermelon": 20000, "muskmelon": 12000, "apple": 10000,
    "orange": 9000, "papaya": 18000, "coconut": 9000,
    "cotton": 1500, "jute": 2500, "coffee": 1200,
}


def _score_crop(n, p, k, temp, humidity, ph, rainfall, rule) -> float:
    _, Nmin, Nmax, Pmin, Pmax, Kmin, Kmax, Tmin, Tmax, Hmin, Hmax, PHmin, PHmax, Rmin, Rmax = rule
    score = 0.0
    for val, lo, hi in [(n, Nmin, Nmax), (p, Pmin, Pmax), (k, Kmin, Kmax),
                        (temp, Tmin, Tmax), (humidity, Hmin, Hmax),
                        (ph, PHmin, PHmax), (rainfall, Rmin, Rmax)]:
        if lo <= val <= hi:
            score += 1.0
        elif val < lo:
            score += max(0, 1 - (lo - val) / max(lo, 1))
        else:
            score += max(0, 1 - (val - hi) / max(hi, 1))
    return score / 7.0


def recommend_crop(n, p, k, temp, humidity, ph, rainfall) -> dict:
    scored = sorted(
        [(rule[0], _score_crop(n, p, k, temp, humidity, ph, rainfall, rule)) for rule in CROP_RULES],
        key=lambda x: x[1],
        reverse=True,
    )
    best_crop, best_score = scored[0]
    confidence = f"{best_score * 100:.1f}%"
    reason = (
        f"{best_crop.title()} is best suited for the given combination of soil nutrients "
        f"(N={n}, P={p}, K={k}), temperature ({temp}°C), humidity ({humidity}%), "
        f"pH ({ph}), and rainfall ({rainfall} mm)."
    )
    alternatives = [
        {"crop": c, "confidence": f"{s * 100:.1f}%"} for c, s in scored[1:4]
    ]
    return {
        "recommended_crop": best_crop,
        "confidence": confidence,
        "reason": reason,
        "alternatives": alternatives,
    }


async def increment_prediction_stat():
    db = await get_db()
    try:
        today = today_str()
        await db.execute(
            "INSERT INTO stats_daily (date, predictions) VALUES (?, 1) "
            "ON CONFLICT(date) DO UPDATE SET predictions = predictions + 1",
            (today,),
        )
        await db.commit()
    finally:
        await db.close()


def estimate_yield(crop_name: str, area_hectares: float, fertilizer_kg: float,
                   pesticide_kg: float, annual_rainfall_mm: float) -> dict:
    crop = crop_name.lower().strip()
    base = YIELD_BASE.get(crop, 2000)

    # Simple multiplicative factors (capped to avoid wild extrapolation)
    fert_factor = min(1 + fertilizer_kg / 500, 1.4)
    pest_factor = min(1 + pesticide_kg / 200, 1.2)
    rain_factor = min(max(annual_rainfall_mm / 200, 0.6), 1.3)

    yield_per_ha = round(base * fert_factor * pest_factor * rain_factor, 1)
    total = round(yield_per_ha * area_hectares, 1)

    return {
        "predicted_yield_kg_per_ha": yield_per_ha,
        "total_production_kg": total,
        "crop": crop_name,
        "area_hectares": area_hectares,
        "note": "Estimate based on crop baseline and input factors.",
    }
