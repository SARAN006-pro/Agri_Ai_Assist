from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import get_db

router = APIRouter(prefix="/farm", tags=["farm"])


class FarmProfileCreate(BaseModel):
    name: str
    location: str = ""
    soil_type: str = ""
    acreage: str = ""
    crops_grown: str = ""


@router.get("/profile")
async def get_profiles():
    db = await get_db()
    try:
        async with db.execute(
            "SELECT id, name, location, soil_type, acreage, crops_grown, created_at FROM farm_profiles"
        ) as cur:
            rows = await cur.fetchall()
        return {"profiles": [dict(r) for r in rows]}
    finally:
        await db.close()


@router.post("/profile")
async def create_profile(req: FarmProfileCreate):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO farm_profiles (name, location, soil_type, acreage, crops_grown) VALUES (?, ?, ?, ?, ?)",
            (req.name, req.location, req.soil_type, req.acreage, req.crops_grown),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


@router.put("/profile/{profile_id}")
async def update_profile(profile_id: int, req: FarmProfileCreate):
    db = await get_db()
    try:
        cur = await db.execute(
            "SELECT id FROM farm_profiles WHERE id = ?", (profile_id,)
        )
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Profile not found")
        await db.execute(
            "UPDATE farm_profiles SET name=?, location=?, soil_type=?, acreage=?, crops_grown=? WHERE id=?",
            (req.name, req.location, req.soil_type, req.acreage, req.crops_grown, profile_id),
        )
        await db.commit()
    finally:
        await db.close()
    return {}


@router.delete("/profile/{profile_id}")
async def delete_profile(profile_id: int):
    db = await get_db()
    try:
        cur = await db.execute("SELECT id FROM farm_profiles WHERE id = ?", (profile_id,))
        if not await cur.fetchone():
            raise HTTPException(status_code=404, detail="Profile not found")
        await db.execute("DELETE FROM farm_profiles WHERE id = ?", (profile_id,))
        await db.commit()
    finally:
        await db.close()
    return {}
