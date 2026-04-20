import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

from app.config import UPLOAD_DIR
from app.services import rag_service

router = APIRouter(tags=["rag"])

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _read_file_content(path: str, extension: str) -> str:
    if extension == ".pdf":
        # Basic text extraction without heavy deps
        try:
            with open(path, "rb") as f:
                raw = f.read()
            # Crude PDF text strip — replace with pypdf if richer extraction needed
            text = raw.decode("latin-1", errors="ignore")
            # Extract readable ASCII runs
            import re
            return " ".join(re.findall(r"[^\x00-\x08\x0b\x0c\x0e-\x1f\x80-\xff ]{4,}", text))
        except Exception:
            return ""
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


@router.post("/rag/upload")
async def upload_document(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not supported. Use PDF, TXT, or MD.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 10 MB limit.")

    save_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(save_path, "wb") as f:
        f.write(contents)

    content_text = _read_file_content(save_path, ext)
    if not content_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from the uploaded file.")

    chunks_indexed = await rag_service.upload_document(file.filename, content_text)
    return {"filename": file.filename, "chunks_indexed": chunks_indexed}


@router.post("/rag/query")
async def query_documents(body: dict):
    question = (body.get("question") or "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="'question' is required.")
    result = await rag_service.query_documents(question)
    return result


@router.get("/rag/stats")
async def rag_stats():
    return await rag_service.get_stats()
