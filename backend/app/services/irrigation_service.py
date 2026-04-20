from app.database import get_db


URGENCY_RULES = {
    # (urgency, action template)
    "critical": (lambda m: m < 20, "high", "Irrigate immediately", "Soil moisture is critically low."),
    "low_water": (lambda m: m < 40, "medium", "Schedule irrigation within 24 hours", "Soil moisture is below optimal."),
    "optimal": (lambda m: 40 <= m <= 70, "low", "No immediate action needed", "Soil moisture is in the optimal range."),
    "overwatered": (lambda m: m > 70, "low", "Hold irrigation", "Soil moisture is high — avoid overwatering."),
}

CROP_THRESHOLDS = {
    "rice": (50, 80),
    "wheat": (35, 65),
    "maize": (40, 70),
    "cotton": (40, 70),
    "sugarcane": (55, 80),
    "default": (40, 70),
}


def get_irrigation_advice(soil_moisture: float, crop: str,
                          temperature: float | None, humidity: float | None) -> dict:
    low, high = CROP_THRESHOLDS.get(crop.lower(), CROP_THRESHOLDS["default"])

    if soil_moisture < low * 0.5:
        urgency, action = "high", "Irrigate immediately — critically low moisture"
        rec = f"{crop.title()} requires urgent irrigation. Soil moisture ({soil_moisture}%) is critically below the {low}% minimum."
    elif soil_moisture < low:
        urgency, action = "medium", "Irrigate within 24 hours"
        rec = f"Soil moisture ({soil_moisture}%) is below the optimal range ({low}%–{high}%) for {crop.title()}."
    elif soil_moisture <= high:
        urgency, action = "low", "No irrigation needed"
        rec = f"Soil moisture ({soil_moisture}%) is within the optimal range ({low}%–{high}%) for {crop.title()}."
    else:
        urgency, action = "low", "Hold irrigation — soil is well-watered"
        rec = f"Soil moisture ({soil_moisture}%) is above the optimal range for {crop.title()}. Avoid overwatering."

    if temperature and temperature > 38:
        rec += " High temperature detected — consider increasing irrigation frequency."

    return {
        "urgency": urgency,
        "recommendation": rec,
        "action": action,
        "soil_moisture": soil_moisture,
        "crop": crop,
    }


async def save_irrigation_log(crop: str, moisture: float, urgency: str, action: str):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO irrigation_logs (crop, moisture_level, urgency, recommended_action) VALUES (?, ?, ?, ?)",
            (crop, moisture, urgency, action),
        )
        await db.commit()
    finally:
        await db.close()


async def get_logs(limit: int = 50) -> list[dict]:
    db = await get_db()
    try:
        async with db.execute(
            "SELECT id, crop, moisture_level, urgency, recommended_action, created_at "
            "FROM irrigation_logs ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ) as cur:
            rows = await cur.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()
