"""
Lightweight RAG using TF-IDF keyword search stored in SQLite.
No FAISS, no heavy transformers — zero heavy dependencies.
"""
import os
import math
import re
from collections import Counter

from app.config import UPLOAD_DIR
from app.database import get_db
from app.services.chat_service import call_openrouter
from app.utils import today_str

CHUNK_SIZE = 500  # characters per chunk


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-zA-Z0-9]+", text.lower())


def _chunk_text(text: str, size: int = CHUNK_SIZE) -> list[str]:
    words = text.split()
    chunks, current = [], []
    length = 0
    for w in words:
        current.append(w)
        length += len(w) + 1
        if length >= size:
            chunks.append(" ".join(current))
            current, length = [], 0
    if current:
        chunks.append(" ".join(current))
    return chunks


def _tfidf_score(query_tokens: list[str], chunk: str) -> float:
    chunk_tokens = _tokenize(chunk)
    if not chunk_tokens:
        return 0.0
    counts = Counter(chunk_tokens)
    total = len(chunk_tokens)
    score = sum(counts.get(t, 0) / total for t in query_tokens)
    return score


async def upload_document(filename: str, content: str) -> int:
    chunks = _chunk_text(content)
    db = await get_db()
    try:
        await db.execute("DELETE FROM rag_documents WHERE filename = ?", (filename,))
        for i, chunk in enumerate(chunks):
            await db.execute(
                "INSERT INTO rag_documents (filename, content, chunk_index) VALUES (?, ?, ?)",
                (filename, chunk, i),
            )
        # Update stats
        today = today_str()
        await db.execute(
            "INSERT INTO stats_daily (date, uploads) VALUES (?, 1) "
            "ON CONFLICT(date) DO UPDATE SET uploads = uploads + 1",
            (today,),
        )
        await db.commit()
    finally:
        await db.close()
    return len(chunks)


async def query_documents(question: str) -> dict:
    db = await get_db()
    try:
        async with db.execute("SELECT filename, content FROM rag_documents") as cur:
            rows = await cur.fetchall()
    finally:
        await db.close()

    if not rows:
        return {
            "answer": "No documents have been uploaded yet. Please upload a document first.",
            "sources": [],
        }

    tokens = _tokenize(question)
    scored = sorted(
        rows,
        key=lambda r: _tfidf_score(tokens, r["content"]),
        reverse=True,
    )
    top_chunks = scored[:4]
    context = "\n\n".join(f"[{r['filename']}]\n{r['content']}" for r in top_chunks)
    sources = list({r["filename"] for r in top_chunks})

    messages = [
        {
            "role": "system",
            "content": (
                "You are SmartFarm AI. Answer the question using ONLY the context below. "
                "If the context doesn't contain the answer, say so.\n\nContext:\n" + context
            ),
        },
        {"role": "user", "content": question},
    ]
    answer = await call_openrouter(messages)
    return {"answer": answer, "sources": [{"source": s} for s in sources]}


async def get_stats() -> dict:
    db = await get_db()
    try:
        async with db.execute(
            "SELECT COUNT(DISTINCT filename) as docs, COUNT(*) as chunks FROM rag_documents"
        ) as cur:
            row = await cur.fetchone()
        async with db.execute("SELECT DISTINCT filename FROM rag_documents") as cur:
            filenames = [r["filename"] for r in await cur.fetchall()]
    finally:
        await db.close()
    return {
        "total_documents": row["docs"] if row else 0,
        "total_chunks": row["chunks"] if row else 0,
        "sources": filenames,
    }


async def reset_index():
    db = await get_db()
    try:
        await db.execute("DELETE FROM rag_documents")
        await db.commit()
    finally:
        await db.close()
    # Also wipe uploaded files
    for f in os.listdir(UPLOAD_DIR):
        try:
            os.remove(os.path.join(UPLOAD_DIR, f))
        except OSError:
            pass
