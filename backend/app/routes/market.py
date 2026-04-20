from fastapi import APIRouter, HTTPException
from app.database import get_db

router = APIRouter(prefix="/market", tags=["market"])

MOCK_PRICES = [
    {"crop": "rice", "market": "Wholesale", "price_per_kg": 22.5, "date": "2026-04-15"},
    {"crop": "rice", "market": "Retail", "price_per_kg": 32.0, "date": "2026-04-15"},
    {"crop": "rice", "market": "Farm Gate", "price_per_kg": 18.0, "date": "2026-04-15"},
    {"crop": "wheat", "market": "Wholesale", "price_per_kg": 21.0, "date": "2026-04-15"},
    {"crop": "wheat", "market": "Retail", "price_per_kg": 28.5, "date": "2026-04-15"},
    {"crop": "wheat", "market": "Farm Gate", "price_per_kg": 17.5, "date": "2026-04-15"},
    {"crop": "maize", "market": "Wholesale", "price_per_kg": 19.5, "date": "2026-04-15"},
    {"crop": "maize", "market": "Retail", "price_per_kg": 26.0, "date": "2026-04-15"},
    {"crop": "maize", "market": "Farm Gate", "price_per_kg": 15.0, "date": "2026-04-15"},
    {"crop": "cotton", "market": "Wholesale", "price_per_kg": 65.0, "date": "2026-04-15"},
    {"crop": "cotton", "market": "Retail", "price_per_kg": 85.0, "date": "2026-04-15"},
    {"crop": "cotton", "market": "Farm Gate", "price_per_kg": 55.0, "date": "2026-04-15"},
    {"crop": "sugarcane", "market": "Wholesale", "price_per_kg": 3.5, "date": "2026-04-15"},
    {"crop": "sugarcane", "market": "Farm Gate", "price_per_kg": 2.8, "date": "2026-04-15"},
    {"crop": "potato", "market": "Wholesale", "price_per_kg": 15.0, "date": "2026-04-15"},
    {"crop": "potato", "market": "Retail", "price_per_kg": 22.0, "date": "2026-04-15"},
    {"crop": "onion", "market": "Wholesale", "price_per_kg": 25.0, "date": "2026-04-15"},
    {"crop": "onion", "market": "Retail", "price_per_kg": 35.0, "date": "2026-04-15"},
    {"crop": "tomato", "market": "Wholesale", "price_per_kg": 30.0, "date": "2026-04-15"},
    {"crop": "tomato", "market": "Retail", "price_per_kg": 45.0, "date": "2026-04-15"},
    {"crop": "chickpea", "market": "Wholesale", "price_per_kg": 80.0, "date": "2026-04-15"},
    {"crop": "chickpea", "market": "Retail", "price_per_kg": 105.0, "date": "2026-04-15"},
    {"crop": "mango", "market": "Wholesale", "price_per_kg": 60.0, "date": "2026-04-15"},
    {"crop": "mango", "market": "Retail", "price_per_kg": 90.0, "date": "2026-04-15"},
    {"crop": "banana", "market": "Wholesale", "price_per_kg": 18.0, "date": "2026-04-15"},
    {"crop": "banana", "market": "Retail", "price_per_kg": 28.0, "date": "2026-04-15"},
]


@router.get("/prices")
async def get_prices():
    return {"prices": MOCK_PRICES}


@router.get("/prices/{crop}")
async def get_prices_by_crop(crop: str):
    filtered = [p for p in MOCK_PRICES if p["crop"].lower() == crop.lower()]
    if not filtered:
        raise HTTPException(status_code=404, detail=f"No price data for crop '{crop}'")
    return {"prices": filtered}
