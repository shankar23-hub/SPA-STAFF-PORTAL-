"""
config.py – Configuration for the SPA Employee Portal backend.

MongoDB Atlas is configured by default for this project.
Important: the password contains @, so it must be URL encoded as %40 in MONGO_URI.
Database used: spa_admin_db
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "spa-employee-secret-key-2026")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "spa-jwt-secret-2026")

    # MongoDB Atlas connection
    # Password SpaAdmin@2007 is encoded as SpaAdmin%402007 for MongoDB URI safety.
    MONGO_URI = os.environ.get(
        "MONGO_URI",
        "mongodb+srv://spa_admin:SpaAdmin%402007@cluster0.swvlcma.mongodb.net/spa_admin_db?retryWrites=true&w=majority&appName=Cluster0",
    )
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "spa_admin_db")

    DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
    UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "uploads")
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024

    # CORS frontend URL. In Vercel, set FRONTEND_URL to your frontend domain.
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "").strip()

    ADMIN_EMAIL = "admin@spa.com"
    ADMIN_PASSWORD = "admin123"
