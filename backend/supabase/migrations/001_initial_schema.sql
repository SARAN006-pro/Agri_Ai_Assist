-- SmartFarm AI - Supabase Postgres Migration
-- Run this to set up the database schema on Supabase Postgres

BEGIN;

-- Enable UUID extension for device_id columns
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    device_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farm Profiles
CREATE TABLE IF NOT EXISTS farm_profiles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    soil_type TEXT,
    acreage TEXT,
    crops_grown TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Yield Records
CREATE TABLE IF NOT EXISTS yield_records (
    id SERIAL PRIMARY KEY,
    crop TEXT NOT NULL,
    year INTEGER NOT NULL,
    yield_kg_per_ha REAL NOT NULL,
    area_ha REAL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor Readings
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    sensor_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT NOT NULL,
    farm_id INTEGER,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Irrigation Logs
CREATE TABLE IF NOT EXISTS irrigation_logs (
    id SERIAL PRIMARY KEY,
    crop TEXT NOT NULL,
    moisture_level REAL NOT NULL,
    urgency TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    device_id TEXT PRIMARY KEY,
    preferences_json TEXT DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learning Stats
CREATE TABLE IF NOT EXISTS learning_stats (
    device_id TEXT PRIMARY KEY REFERENCES user_profiles(device_id) ON DELETE CASCADE,
    total_feedback INTEGER DEFAULT 0,
    total_corrections INTEGER DEFAULT 0,
    total_crop_outcomes INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crop Outcomes
CREATE TABLE IF NOT EXISTS crop_outcomes (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    crop TEXT NOT NULL,
    outcome TEXT NOT NULL,
    yield_kg_per_ha REAL,
    year INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Personalized Context
CREATE TABLE IF NOT EXISTS personalized_context (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, key)
);

-- Daily Stats
CREATE TABLE IF NOT EXISTS stats_daily (
    date TEXT PRIMARY KEY,
    chats INTEGER DEFAULT 0,
    predictions INTEGER DEFAULT 0,
    uploads INTEGER DEFAULT 0
);

-- User Feedback
CREATE TABLE IF NOT EXISTS user_feedback (
    id SERIAL PRIMARY KEY,
    device_id TEXT NOT NULL,
    message_id TEXT,
    rating INTEGER,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RAG Documents
CREATE TABLE IF NOT EXISTS rag_documents (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_farm ON sensor_readings(farm_id);
CREATE INDEX IF NOT EXISTS idx_irrigation_logs_crop ON irrigation_logs(crop);
CREATE INDEX IF NOT EXISTS idx_yield_records_crop ON yield_records(crop);

COMMIT;
