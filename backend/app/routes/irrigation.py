from fastapi import APIRouter, Query
from pydantic import BaseModel, Field
from app.services import irrigation_service

router = APIRouter(tags=["irrigation"])


class IrrigationAdviceRequest(BaseModel):
    soil_moisture: float = Field(..., ge=0, le=100)
    crop: str
    temperature: float | None = None
    humidity: float | None = None


@router.post("/irrigation/advice")
async def get_advice(req: IrrigationAdviceRequest):
    result = irrigation_service.get_irrigation_advice(
        req.soil_moisture, req.crop, req.temperature, req.humidity
    )
    await irrigation_service.save_irrigation_log(
        req.crop, req.soil_moisture, result["urgency"], result["action"]
    )
    return result


@router.get("/irrigation/logs")
async def get_logs(limit: int = Query(50, ge=1, le=200)):
    logs = await irrigation_service.get_logs(limit)
    return {"logs": logs}
