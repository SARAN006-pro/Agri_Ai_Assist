from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services import economics_service

router = APIRouter(tags=["economics"])


class MarginRequest(BaseModel):
    crop: str
    area_ha: float = Field(..., gt=0)
    fertilizer_cost: float = Field(..., ge=0)
    pesticide_cost: float = Field(..., ge=0)
    labor_cost: float = Field(..., ge=0)
    expected_yield_kg: float = Field(..., ge=0)
    price_per_kg: float = Field(..., ge=0)


@router.post("/economics/margin")
async def calculate_margin(req: MarginRequest):
    return economics_service.calculate_margin(
        req.crop, req.area_ha, req.fertilizer_cost,
        req.pesticide_cost, req.labor_cost,
        req.expected_yield_kg, req.price_per_kg,
    )
