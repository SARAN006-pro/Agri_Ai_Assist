import httpx
from app.config import OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_BASE_URL
from app.database import get_db
from app.utils import new_id, today_str


SYSTEM_PROMPT = (
    "You are SmartFarm AI, an expert agricultural assistant. "
    "Help farmers with crop selection, pest management, irrigation, soil health, "
    "market prices, and general farming advice. Be concise, practical, and friendly. "
    "When you don't know something specific to the farmer's local conditions, say so."
)


async def _increment_daily_stat(col: str):
    db = await get_db()
    try:
        today = today_str()
        await db.execute(
            f"INSERT INTO stats_daily (date, {col}) VALUES (?, 1) "
            f"ON CONFLICT(date) DO UPDATE SET {col} = {col} + 1",
            (today,),
        )
        await db.commit()
    finally:
        await db.close()


async def get_or_create_session(session_id: str | None, device_id: str) -> str:
    if not session_id:
        session_id = new_id()
    db = await get_db()
    try:
        await db.execute(
            "INSERT OR IGNORE INTO chat_sessions (session_id, name, device_id) VALUES (?, ?, ?)",
            (session_id, f"Chat {session_id[:8]}", device_id),
        )
        await db.commit()
    finally:
        await db.close()
    return session_id


async def save_message(session_id: str, role: str, content: str):
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)",
            (session_id, role, content),
        )
        await db.commit()
    finally:
        await db.close()


async def call_openrouter(messages: list[dict]) -> str:
    if not OPENROUTER_API_KEY:
        return (
            "AI responses are unavailable — OPENROUTER_API_KEY is not configured. "
            "Please set it in your .env file."
        )
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "HTTP-Referer": "https://smartfarm.ai",
                "X-Title": "SmartFarm AI",
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.7,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def chat(
    message: str,
    session_id: str | None,
    history: list[dict],
    language: str,
    device_id: str,
) -> dict:
    session_id = await get_or_create_session(session_id, device_id)

    lang_note = f" Respond in language code: {language}." if language and language != "en" else ""
    system = SYSTEM_PROMPT + lang_note

    messages = [{"role": "system", "content": system}]
    # Use provided history (last 10 turns max to stay within token limits)
    for h in history[-10:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    reply = await call_openrouter(messages)

    await save_message(session_id, "user", message)
    await save_message(session_id, "assistant", reply)
    await _increment_daily_stat("chats")

    return {"reply": reply, "session_id": session_id}


async def get_history(session_id: str) -> list[dict]:
    db = await get_db()
    try:
        async with db.execute(
            "SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY created_at",
            (session_id,),
        ) as cur:
            rows = await cur.fetchall()
        return [{"role": r["role"], "content": r["content"]} for r in rows]
    finally:
        await db.close()


async def list_sessions() -> list[dict]:
    db = await get_db()
    try:
        async with db.execute(
            "SELECT session_id, name FROM chat_sessions ORDER BY created_at DESC"
        ) as cur:
            rows = await cur.fetchall()
        return [{"session_id": r["session_id"], "name": r["name"]} for r in rows]
    finally:
        await db.close()


async def create_session(name: str) -> dict:
    sid = new_id()
    db = await get_db()
    try:
        await db.execute(
            "INSERT INTO chat_sessions (session_id, name) VALUES (?, ?)", (sid, name)
        )
        await db.commit()
    finally:
        await db.close()
    return {"session_id": sid, "name": name}


async def delete_session(session_id: str):
    db = await get_db()
    try:
        await db.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))
        await db.commit()
    finally:
        await db.close()


async def rename_session(session_id: str, name: str):
    db = await get_db()
    try:
        await db.execute(
            "UPDATE chat_sessions SET name = ? WHERE session_id = ?", (name, session_id)
        )
        await db.commit()
    finally:
        await db.close()


async def get_context(session_id: str, device_id: str) -> dict:
    history = await get_history(session_id)
    return {"session_id": session_id, "device_id": device_id, "message_count": len(history)}
