"""
config.py – SPA Employee Portal backend configuration.

FIX: JWT_SECRET_KEY default is 'spa_portal_secret' — must match Admin Portal.
FIX: MONGO_DB_NAME defaults to 'spa_admin_db' — same DB as Admin Portal.
     Both portals read from the SAME MongoDB database.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY = os.environ.get("SECRET_KEY", "spa-employee-secret-key-2026")

    # IMPORTANT: Must be identical to Admin Portal JWT_SECRET_KEY.
    # Set JWT_SECRET_KEY=spa_portal_secret in Vercel for BOTH backend deployments.
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "spa_portal_secret")

    # MongoDB Atlas — same database as Admin Portal
    MONGO_URI = os.environ.get("MONGO_URI", "").strip()
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "spa_admin_db")

    DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    # CORS
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "").strip()
