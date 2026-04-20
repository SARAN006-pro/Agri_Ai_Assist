from fastapi import APIRouter, Query
from app.database import get_db
from app.utils import last_n_days, day_label

router = APIRouter(tags=["stats"])


@router.get("/stats")
async def get_stats():
    db = await get_db()
    try:
        async with db.execute("SELECT COUNT(*) as cnt FROM chat_messages WHERE role='user'") as cur:
            total_chats = (await cur.fetchone())[0]
        async with db.execute(
            "SELECT SUM(predictions) FROM stats_daily"
        ) as cur:
            row = await cur.fetchone()
            total_predictions = row[0] or 0 if row else 0
        async with db.execute(
            "SELECT SUM(uploads) FROM stats_daily"
        ) as cur:
            row = await cur.fetchone()
            total_uploads = row[0] or 0 if row else 0
    finally:
        await db.close()
    return {"total_chats": total_chats, "total_predictions": total_predictions, "total_uploads": total_uploads}


@router.get("/stats/history")
async def get_history():
    db = await get_db()
    try:
        days = last_n_days(7)
        result = []
        for day in days:
            async with db.execute(
                "SELECT chats, predictions, uploads FROM stats_daily WHERE date = ?", (day,)
            ) as cur:
                row = await cur.fetchone()
            result.append({
                "label": day_label(day),
                "chats": row["chats"] if row else 0,
                "predictions": row["predictions"] if row else 0,
                "uploads": row["uploads"] if row else 0,
            })
        return result
    finally:
        await db.close()


@router.get("/stats/breakdown")
async def get_breakdown():
    db = await get_db()
    try:
        async with db.execute("SELECT SUM(chats) as v FROM stats_daily") as cur:
            chats = (await cur.fetchone())[0] or 0
        async with db.execute("SELECT SUM(predictions) as v FROM stats_daily") as cur:
            predictions = (await cur.fetchone())[0] or 0
        async with db.execute("SELECT SUM(uploads) as v FROM stats_daily") as cur:
            uploads = (await cur.fetchone())[0] or 0
    finally:
        await db.close()
    return [
        {"name": "Chats", "value": chats},
        {"name": "Predictions", "value": predictions},
        {"name": "Document Uploads", "value": uploads},
    ]
