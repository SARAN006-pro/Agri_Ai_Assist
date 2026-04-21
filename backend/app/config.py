import os
from dotenv import load_dotenv

load_dotenv()


def normalize_origin(value: str) -> str:
	trimmed = value.strip().rstrip('/')
	if trimmed.startswith(('http://', 'https://')):
		return trimmed
	if trimmed.startswith('localhost') or trimmed.startswith('127.0.0.1'):
		return f'http://{trimmed}'
	return f'https://{trimmed}'

OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL: str = os.getenv("MODEL_NAME", "mistralai/mistral-7b-instruct")
OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

DB_PATH: str = os.getenv("DB_PATH", "data/smartfarm.db")
UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")

PORT: int = int(os.getenv("PORT", "8000"))
FRONTEND_URL: str = normalize_origin(os.getenv("FRONTEND_URL", "http://localhost:5173"))

# Ensure directories exist
os.makedirs(os.path.dirname(DB_PATH) if os.path.dirname(DB_PATH) else "data", exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
