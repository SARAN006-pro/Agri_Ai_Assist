from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

from app.config import OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_MODEL

router = APIRouter(tags=["translation"])

LANGUAGES = [
    {"code": "en", "name": "English"},
    {"code": "hi", "name": "Hindi"},
    {"code": "bn", "name": "Bengali"},
    {"code": "ta", "name": "Tamil"},
    {"code": "te", "name": "Telugu"},
    {"code": "mr", "name": "Marathi"},
    {"code": "gu", "name": "Gujarati"},
    {"code": "kn", "name": "Kannada"},
    {"code": "ml", "name": "Malayalam"},
    {"code": "pa", "name": "Punjabi"},
    {"code": "or", "name": "Odia"},
    {"code": "as", "name": "Assamese"},
]


class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: str | None = None


class DetectRequest(BaseModel):
    text: str


@router.post("/translate")
async def translate(req: TranslateRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="'text' is required.")

    messages = [
        {
            "role": "system",
            "content": f"Translate the following text to {req.target_language}. "
                       "Output ONLY the translation, no explanation.",
        },
        {"role": "user", "content": req.text},
    ]

    if not OPENROUTER_API_KEY:
        return {"translated_text": req.text + f" [to {req.target_language}]"}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "https://smartfarm.ai",
                    "X-Title": "SmartFarm AI",
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": messages,
                    "max_tokens": 1024,
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            translated = data["choices"][0]["message"]["content"].strip()
        return {"translated_text": translated}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {e}")


@router.post("/detect-language")
async def detect_language(req: DetectRequest):
    # Simple heuristic detection based on Unicode ranges
    text = req.text[:200]  # Sample first 200 chars
    lang_scores = {
        "hi": sum(1 for c in text if "ऀ" <= c <= "ॿ"),   # Devanagari
        "bn": sum(1 for c in text if "ঀ" <= c <= "৿"),   # Bengali
        "ta": sum(1 for c in text if "஀" <= c <= "௿"),   # Tamil
        "te": sum(1 for c in text if "ఀ" <= c <= "౿"),   # Telugu
        "mr": sum(1 for c in text if "ऀ" <= c <= "ॿ"),   # Marathi (Devanagari)
        "gu": sum(1 for c in text if "઀" <= c <= "૿"),   # Gujarati
        "kn": sum(1 for c in text if "ಀ" <= c <= "೿"),   # Kannada
        "ml": sum(1 for c in text if "ഀ" <= c <= "ൿ"),   # Malayalam
    }
    best = max(lang_scores, key=lang_scores.get) if any(lang_scores.values()) else "en"
    confidence = min(lang_scores.get(best, 0) / max(len(text), 1) + 0.3, 1.0)
    return {"language": best, "confidence": round(confidence, 2)}


@router.get("/languages")
async def get_languages():
    return {"languages": LANGUAGES}
