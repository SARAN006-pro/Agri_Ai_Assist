import json
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(tags=["profile"])


class FeedbackRequest(BaseModel):
    device_id: str
    message_id: str = ""
    rating: int
    comment: str | None = None


class CorrectionRequest(BaseModel):
    device_id: str
    original: str
    corrected: str
    context: str


class PreferencesRequest(BaseModel):
    device_id: str
    preferences: dict | None = None


class CropOutcomeRequest(BaseModel):
    device_id: str
    crop: str
    outcome: str
    yield_kg_per_ha: float | None = None
    year: int | None = None
    notes: str | None = None


# ── Feedback ──────────────────────────────────────────────────────────────────

@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO user_feedback (device_id, message_id, rating, comment) VALUES (?, ?, ?, ?)",
            (req.device_id, req.message_id, req.rating, req.comment),
        )
        await db.execute(
            "INSERT INTO learning_stats (device_id, total_feedback) VALUES (?, 1) "
            "ON CONFLICT(device_id) DO UPDATE SET total_feedback = total_feedback + 1",
            (req.device_id,),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


@router.post("/correction")
async def submit_correction(req: CorrectionRequest):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO learning_stats (device_id, total_corrections) VALUES (?, 1) "
            "ON CONFLICT(device_id) DO UPDATE SET total_corrections = total_corrections + 1",
            (req.device_id,),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


@router.post("/crop-outcome")
async def record_crop_outcome(req: CropOutcomeRequest):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO crop_outcomes (device_id, crop, outcome, yield_kg_per_ha, year, notes) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (req.device_id, req.crop, req.outcome, req.yield_kg_per_ha, req.year, req.notes),
        )
        await db.execute(
            "INSERT INTO learning_stats (device_id, total_crop_outcomes) VALUES (?, 1) "
            "ON CONFLICT(device_id) DO UPDATE SET total_crop_outcomes = total_crop_outcomes + 1",
            (req.device_id,),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


# ── Profile ──────────────────────────────────────────────────────────────────

@router.get("/profile/{device_id}")
async def get_profile(device_id: str):
    db = await get_db()
    try:
        async with db.execute("SELECT * FROM user_profiles WHERE device_id = ?", (device_id,)) as cur:
            row = await cur.fetchone()
        if not row:
            return {"device_id": device_id, "preferences": {}}
        prefs = json.loads(row["preferences_json"] or "{}")
        return {"device_id": device_id, "preferences": prefs}
    finally:
        await db.close()


@router.post("/profile/preferences")
async def update_preferences(req: PreferencesRequest):
    db = await get_db()
    try:
        prefs_json = json.dumps(req.preferences or {})
        await db.execute(
            "INSERT INTO user_profiles (device_id, preferences_json) VALUES (?, ?) "
            "ON CONFLICT(device_id) DO UPDATE SET preferences_json = ?, updated_at = CURRENT_TIMESTAMP",
            (req.device_id, prefs_json, prefs_json),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


@router.get("/profile/{device_id}/stats")
async def get_learning_stats(device_id: str):
    db = await get_db()
    try:
        async with db.execute(
            "SELECT total_feedback, total_corrections, total_crop_outcomes FROM learning_stats WHERE device_id = ?",
            (device_id,),
        ) as cur:
            row = await cur.fetchone()
        if not row:
            return {"device_id": device_id, "total_feedback": 0, "total_corrections": 0, "total_crop_outcomes": 0}
        return {"device_id": device_id, **dict(row)}
    finally:
        await db.close()


@router.get("/profile/{device_id}/context")
async def get_context(device_id: str):
    db = await get_db()
    try:
        async with db.execute(
            "SELECT key, value FROM personalized_context WHERE device_id = ?", (device_id,)
        ) as cur:
            rows = await cur.fetchall()
        return {"context": {r["key"]: r["value"] for r in rows}}
    finally:
        await db.close()


@router.post("/profile/{device_id}/context")
async def add_context(device_id: str, key: str = Query(...), value: str = Query(...)):
    db = await get_db()
    try:
        await db.execute(
            "INSERT OR REPLACE INTO personalized_context (device_id, key, value) VALUES (?, ?, ?)",
            (device_id, key, value),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


@router.get("/profile/{device_id}/crop-patterns")
async def get_crop_patterns(device_id: str):
    db = await get_db()
    try:
        async with db.execute(
            "SELECT crop, outcome, yield_kg_per_ha, year FROM crop_outcomes WHERE device_id = ? ORDER BY created_at DESC",
            (device_id,),
        ) as cur:
            rows = await cur.fetchall()
        return {"patterns": [dict(r) for r in rows]}
    finally:
        await db.close()
