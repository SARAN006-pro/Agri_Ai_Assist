import uuid
from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from app.database import get_db

router = APIRouter(tags=["sensors"])


class SensorDataRequest(BaseModel):
    sensor_type: str = Field(
        ..., pattern="^(soil_moisture|temperature|humidity|rainfall|soil_ph)$"
    )
    value: float
    unit: str
    farm_id: int | None = None


@router.get("/sensors/readings")
async def get_readings(
    sensor_type: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
):
    db = await get_db()
    try:
        if sensor_type:
            async with db.execute(
                "SELECT id, sensor_type, value, unit, farm_id, timestamp "
                "FROM sensor_readings WHERE sensor_type = ? ORDER BY timestamp DESC LIMIT ?",
                (sensor_type, limit),
            ) as cur:
                rows = await cur.fetchall()
        else:
            async with db.execute(
                "SELECT id, sensor_type, value, unit, farm_id, timestamp "
                "FROM sensor_readings ORDER BY timestamp DESC LIMIT ?",
                (limit,),
            ) as cur:
                rows = await cur.fetchall()
        return {"readings": [dict(r) for r in rows]}
    finally:
        await db.close()


@router.get("/sensors/webhook-url")
async def get_webhook_url():
    return {"webhook_url": "/api/sensors/data"}


@router.post("/sensors/data")
async def post_data(req: SensorDataRequest):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO sensor_readings (sensor_type, value, unit, farm_id) VALUES (?, ?, ?, ?)",
            (req.sensor_type, req.value, req.unit, req.farm_id),
        )
        await db.commit()
    finally:
        await db.close()
    return {}
