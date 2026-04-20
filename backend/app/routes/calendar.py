from fastapi import APIRouter, Query
from app.services import calendar_service

router = APIRouter(tags=["calendar"])


@router.get("/calendar")
async def get_calendar(location: str | None = Query(None)):
    crops = calendar_service.get_calendar(location)
    return {"crops": crops}


@router.get("/calendar/crops/list")
async def list_crops():
    return {"crops": calendar_service.get_crops_list()}
