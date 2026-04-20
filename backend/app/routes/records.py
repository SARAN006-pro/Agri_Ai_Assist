from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from app.database import get_db

router = APIRouter(tags=["records"])


class RecordCreate(BaseModel):
    crop: str
    year: int = Field(..., ge=2000, le=2100)
    yield_kg_per_ha: float = Field(..., ge=0)
    area_ha: float | None = None
    notes: str | None = None


@router.get("/records")
async def get_records(farm_id: int | None = Query(None)):
    db = await get_db()
    try:
        async with db.execute(
            "SELECT id, crop, year, yield_kg_per_ha, area_ha, notes, created_at FROM yield_records ORDER BY year DESC"
        ) as cur:
            rows = await cur.fetchall()
        return {"records": [dict(r) for r in rows]}
    finally:
        await db.close()


@router.post("/records")
async def create_record(req: RecordCreate):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO yield_records (crop, year, yield_kg_per_ha, area_ha, notes) VALUES (?, ?, ?, ?, ?)",
            (req.crop, req.year, req.yield_kg_per_ha, req.area_ha, req.notes),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


@router.put("/records/{record_id}")
async def update_record(record_id: int, req: RecordCreate):
    db = await get_db()
    try:
        cur = await db.execute("SELECT id FROM yield_records WHERE id = ?", (record_id,))
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Record not found")
        await db.execute(
            "UPDATE yield_records SET crop=?, year=?, yield_kg_per_ha=?, area_ha=?, notes=? WHERE id=?",
            (req.crop, req.year, req.yield_kg_per_ha, req.area_ha, req.notes, record_id),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


@router.delete("/records/{record_id}")
async def delete_record(record_id: int):
    db = await get_db()
    try:
        cur = await db.execute("SELECT id FROM yield_records WHERE id = ?", (record_id,))
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Record not found")
        await db.execute("DELETE FROM yield_records WHERE id = ?", (record_id,))
        await db.commit()
    finally:
        await db.close()
    return {}
