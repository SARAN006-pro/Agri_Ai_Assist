from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services import ml_service

router = APIRouter(tags=["predict"])


class CropInput(BaseModel):
    nitrogen: float = Field(..., ge=0, le=200)
    phosphorus: float = Field(..., ge=0, le=200)
    potassium: float = Field(..., ge=0, le=200)
    temperature: float = Field(..., ge=-10, le=50)
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=0, le=14)
    rainfall: float = Field(..., ge=0, le=500)


class YieldInput(BaseModel):
    crop_name: str
    area_hectares: float = Field(..., gt=0)
    fertilizer_kg: float = Field(..., ge=0)
    pesticide_kg: float = Field(..., ge=0)
    annual_rainfall_mm: float = Field(..., ge=0)


@router.post("/predict/crop")
async def predict_crop(data: CropInput):
    try:
        result = ml_service.recommend_crop(
            data.nitrogen, data.phosphorus, data.potassium,
            data.temperature, data.humidity, data.ph, data.rainfall,
        )
        await ml_service.increment_prediction_stat()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/yield")
async def predict_yield(data: YieldInput):
    try:
        result = ml_service.estimate_yield(
            data.crop_name, data.area_hectares,
            data.fertilizer_kg, data.pesticide_kg, data.annual_rainfall_mm,
        )
        await ml_service.increment_prediction_stat()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict/crops/list")
async def crops_list():
    return {"crops": ml_service.CROPS}
