from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_URL
from app.database import init_db
from app.routes import (
    chat, rag, predict, stats, settings,
    farm, market, irrigation, economics,
    calendar, records, sensors, translation, profile,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="SmartFarm AI API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /api prefix
for router in [
    chat.router,
    rag.router,
    predict.router,
    stats.router,
    settings.router,
    farm.router,
    market.router,
    irrigation.router,
    economics.router,
    calendar.router,
    records.router,
    sensors.router,
    translation.router,
    profile.router,
]:
    app.include_router(router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
