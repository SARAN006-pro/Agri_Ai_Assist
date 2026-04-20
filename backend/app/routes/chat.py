import csv
import io
import json
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services import chat_service

router = APIRouter(tags=["chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    history: list[dict] = []
    language: str = "en"
    device_id: str = ""


class CreateSessionRequest(BaseModel):
    name: str


class RenameSessionRequest(BaseModel):
    name: str


@router.post("/chat")
async def post_chat(req: ChatRequest):
    try:
        result = await chat_service.chat(
            req.message, req.session_id, req.history, req.language, req.device_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/history/{session_id}")
async def get_history(session_id: str):
    messages = await chat_service.get_history(session_id)
    return {"messages": messages}


@router.get("/chat/sessions")
async def get_sessions():
    sessions = await chat_service.list_sessions()
    return {"sessions": sessions}


@router.post("/chat/sessions")
async def create_session(req: CreateSessionRequest):
    session = await chat_service.create_session(req.name)
    return {"session": session}


@router.delete("/chat/sessions/{session_id}")
async def delete_session(session_id: str):
    await chat_service.delete_session(session_id)
    return {}


@router.patch("/chat/sessions/{session_id}")
async def rename_session(session_id: str, req: RenameSessionRequest):
    await chat_service.rename_session(session_id, req.name)
    return {}


@router.get("/chat/export/{session_id}")
async def export_chat(session_id: str, format: str = Query("json", pattern="^(json|csv)$")):
    messages = await chat_service.get_history(session_id)

    if format == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["role", "content"])
        writer.writeheader()
        writer.writerows(messages)
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=chat_{session_id}.csv"},
        )

    # default json
    content = json.dumps({"session_id": session_id, "messages": messages}, indent=2)
    return StreamingResponse(
        iter([content]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=chat_{session_id}.json"},
    )


@router.get("/chat/context/{session_id}")
async def get_context(session_id: str, device_id: str = Query("")):
    ctx = await chat_service.get_context(session_id, device_id)
    return {"context": ctx}
