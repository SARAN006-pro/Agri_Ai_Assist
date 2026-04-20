from fastapi import APIRouter
from app.services import rag_service

router = APIRouter(tags=["settings"])

APP_SETTINGS = {
    "app_name": "SmartFarm AI",
    "version": "1.0.0",
    "ai_model": "mistralai/mistral-7b-instruct",
    "openrouter_configured": True,
}


@router.get("/settings")
async def get_settings():
    return APP_SETTINGS


@router.post("/settings/reset-index")
async def reset_index():
    await rag_service.reset_index()
    return {}


@router.post("/settings/clear-history")
async def clear_history():
    from app.database import get_db
    db = await get_db()
    try:
        await db.execute("DELETE FROM chat_messages")
        await db.execute("DELETE FROM chat_sessions")
        await db.commit()
    finally:
        await db.close()
    return {}
