"""
SmartFarm AI — Unified Database Interface
Supports SQLite (local dev) and PostgreSQL (Supabase) transparently.

Set DATABASE_URL env var to switch to Supabase Postgres.
Otherwise uses aiosqlite with a SQLite file.
"""

import os
import re
import uuid
from datetime import datetime

import aiosqlite
import asyncpg
from aiosqlite import Connection as SqliteConn, Row as SqliteRow
from asyncpg import Connection as PgConn

from app.config import DB_PATH

USING_POSTGRES = bool(os.getenv("DATABASE_URL"))


def new_id() -> str:
    return uuid.uuid4().hex[:16]


def today_str() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d")


# ── Row proxy ────────────────────────────────────────────────────────────────

class _Row:
    """Dict-like access over both aiosqlite.Row and asyncpg.Record."""
    __slots__ = ("_row",)
    def __init__(self, row): self._row = row
    def __getitem__(self, key): return self._row[key]
    def keys(self): return self._row.keys()
    def __iter__(self): return iter(self._row)
    def __len__(self): return len(self._row)
    def get(self, key, default=None):
        try: return self._row[key]
        except (KeyError, IndexError): return default


# ── SQLite ────────────────────────────────────────────────────────────────────

class _SqliteDB:
    __slots__ = ("_conn",)
    def __init__(self, conn: SqliteConn): self._conn = conn
    async def execute(self, sql: str, params=()):
        return await self._conn.execute(sql, params)
    async def commit(self): await self._conn.commit()
    async def close(self): await self._conn.close()


# ── PostgreSQL (Supabase) ────────────────────────────────────────────────────

class _PgDB:
    """
    Wraps asyncpg.Connection to aiosqlite-compatible API.
    Handles ? → $n conversion AND SQLite → Postgres SQL rewriting.
    """
    __slots__ = ("_conn", "_pool")

    def __init__(self, conn: PgConn, pool=None):
        self._conn = conn
        self._pool = pool

    @staticmethod
    def _rewrite(sql: str) -> str:
        """
        Rewrite common SQLite patterns to PostgreSQL equivalents.
        Converts:
          ?  → $1, $2 ... (positional placeholders)
          INSERT OR IGNORE INTO → INSERT ... ON CONFLICT DO NOTHING
          ON CONFLICT(date) DO UPDATE SET col = col + 1 → ON CONFLICT(date) DO UPDATE SET col = EXCLUDED.col + 1
          (last_insert_rowid()) → (lastval())
          IFNULL(col, 0) → COALESCE(col, 0)
        """
        idx = [0]
        def convert_param(m):
            idx[0] += 1
            return f"${idx[0]}"

        # Remove INTO prefix conflicts for insert or ignore
        sql = re.sub(r'INSERT\s+OR\s+IGNORE\s+INTO', 'INSERT INTO', sql, flags=re.IGNORECASE)

        # Handle ON CONFLICT ... DO UPDATE SET col = col + 1 pattern
        # Rewrite to use EXCLUDED.col for PostgreSQL upsert
        def upsert_replacer(m):
            col = m.group(1)
            return f'ON CONFLICT(date) DO UPDATE SET {col} = EXCLUDED.{col} + 1'

        sql = re.sub(
            r'ON CONFLICT\(date\)\s+DO\s+UPDATE\s+SET\s+(\w+)\s*=\s*\1\s*\+?\s*1',
            upsert_replacer,
            sql,
            flags=re.IGNORECASE
        )

        # Convert ? placeholders to $n (only standalone ?)
        sql = re.sub(r'(?<![a-zA-Z_`])\?(?![a-zA-Z_`])', convert_param, sql)

        return sql

    async def execute(self, sql: str, params=()):
        sql_c = _PgDB._rewrite(sql)
        rows = await self._conn.fetch(sql_c, *params)

        class FakeCursor:
            __slots__ = ("_rows", "_pos")
            def __init__(self, rows): self._rows = rows; self._pos = 0
            async def fetchall(self): return self._rows
            async def fetchone(self): return self._rows[0] if self._rows else None
            def __aiter__(self): self._pos = 0; return self
            async def __anext__(self):
                if self._pos >= len(self._rows): raise StopAsyncIteration
                row = self._rows[self._pos]; self._pos += 1; return row
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
        return FakeCursor(rows)

    async def commit(self): pass
    async def close(self):
        if self._pool:
            await self._pool.release(self._conn)


# ── Public API ───────────────────────────────────────────────────────────────

async def get_db():
    """
    Returns a unified db handle.
    - SQLite (aiosqlite) when DATABASE_URL is not set.
    - PostgreSQL (asyncpg/Supabase) when DATABASE_URL is set.

    Both return an object with:
      .execute(sql, params=()) → async ctx mgr cursor
      cursor.fetchall() → [row, ...]
      cursor.fetchone() → row | None
      .commit()
      .close()
    """
    if USING_POSTGRES:
        pool = await asyncpg.create_pool(
            os.getenv("DATABASE_URL"),
            min_size=1,
            max_size=10,
            command_timeout=60,
        )
        conn = await pool.acquire()
        return _PgDB(conn, pool)
    else:
        conn = await aiosqlite.connect(DB_PATH)
        conn.row_factory = aiosqlite.Row
        await conn.execute("PRAGMA foreign_keys = ON")
        return _SqliteDB(conn)


# ── Init ─────────────────────────────────────────────────────────────────────

CREATE_TABLES_SQLITE = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    device_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS farm_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    soil_type TEXT,
    acreage TEXT,
    crops_grown TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS yield_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop TEXT NOT NULL,
    year INTEGER NOT NULL,
    yield_kg_per_ha REAL NOT NULL,
    area_ha REAL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    farm_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS irrigation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    crop TEXT NOT NULL,
    moisture_level REAL NOT NULL,
    urgency TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
    device_id TEXT PRIMARY KEY,
    preferences_json TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_stats (
    device_id TEXT PRIMARY KEY,
    total_feedback INTEGER DEFAULT 0,
    total_corrections INTEGER DEFAULT 0,
    total_crop_outcomes INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    crop TEXT NOT NULL,
    outcome TEXT NOT NULL,
    yield_kg_per_ha REAL,
    year INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS personalized_context (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, key)
);

CREATE TABLE IF NOT EXISTS stats_daily (
    date TEXT PRIMARY KEY,
    chats INTEGER DEFAULT 0,
    predictions INTEGER DEFAULT 0,
    uploads INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    message_id TEXT,
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rag_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

POSTGRES_MIGRATIONS = [
    """
    CREATE TABLE IF NOT EXISTS chat_sessions (
        id SERIAL PRIMARY KEY,
        session_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        device_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS farm_profiles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT,
        soil_type TEXT,
        acreage TEXT,
        crops_grown TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS yield_records (
        id SERIAL PRIMARY KEY,
        crop TEXT NOT NULL,
        year INTEGER NOT NULL,
        yield_kg_per_ha REAL NOT NULL,
        area_ha REAL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        sensor_type TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        farm_id INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS irrigation_logs (
        id SERIAL PRIMARY KEY,
        crop TEXT NOT NULL,
        moisture_level REAL NOT NULL,
        urgency TEXT NOT NULL,
        recommended_action TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS user_profiles (
        device_id TEXT PRIMARY KEY,
        preferences_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS learning_stats (
        device_id TEXT PRIMARY KEY REFERENCES user_profiles(device_id) ON DELETE CASCADE,
        total_feedback INTEGER DEFAULT 0,
        total_corrections INTEGER DEFAULT 0,
        total_crop_outcomes INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS crop_outcomes (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        crop TEXT NOT NULL,
        outcome TEXT NOT NULL,
        yield_kg_per_ha REAL,
        year INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS personalized_context (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(device_id, key)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS stats_daily (
        date TEXT PRIMARY KEY,
        chats INTEGER DEFAULT 0,
        predictions INTEGER DEFAULT 0,
        uploads INTEGER DEFAULT 0
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS user_feedback (
        id SERIAL PRIMARY KEY,
        device_id TEXT NOT NULL,
        message_id TEXT,
        rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS rag_documents (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL,
        content TEXT NOT NULL,
        chunk_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """,
]


async def init_db():
    """Initialise the database. Picks SQLite or Postgres based on DATABASE_URL."""
    if USING_POSTGRES:
        pool = await asyncpg.create_pool(
            os.getenv("DATABASE_URL"),
            min_size=1,
            max_size=10,
            command_timeout=60,
        )
        async with pool.acquire() as conn:
            for m in POSTGRES_MIGRATIONS:
                await conn.execute(m)
        await pool.close()
    else:
        conn = await aiosqlite.connect(DB_PATH)
        conn.row_factory = aiosqlite.Row
        try:
            await conn.executescript(CREATE_TABLES_SQLITE)
            await conn.commit()
        finally:
            await conn.close()
