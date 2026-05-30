"""
app.py – SPA Employee Portal Backend (Flask + MongoDB + JWT)

Vercel-ready: exposes a global `app` WSGI variable.
Local run: python app.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config import Config
from database import init_db
from routes.employee_auth_routes import employee_auth_bp
from routes.certification_routes import cert_bp
from routes.staffid_routes import staffid_bp
from routes.notification_routes import notification_bp


def mask_mongo_uri(uri: str) -> str:
    """Hide the MongoDB password in logs and health response."""
    try:
        if "@" not in uri or "://" not in uri:
            return uri
        protocol, rest = uri.split("://", 1)
        credentials, host = rest.split("@", 1)
        username = credentials.split(":", 1)[0]
        return f"{protocol}://{username}:****@{host}"
    except Exception:
        return "mongodb-uri-configured"


def get_allowed_origins() -> list[str]:
    origins = [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:4173", "http://127.0.0.1:4173",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ]
    if Config.FRONTEND_URL:
        origins.append(Config.FRONTEND_URL.rstrip("/"))

    # Allow deployed Vercel frontends
    origins.extend([
        "https://spa-admin-portal.vercel.app",
        "https://spa-employee-portal.vercel.app",
    ])

    return list(set(origins))


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["UPLOAD_FOLDER"] = Config.UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH
    app.config["DEBUG"] = Config.DEBUG

    CORS(
        app,
        origins=get_allowed_origins(),
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    )

    JWTManager(app)

    app.register_blueprint(employee_auth_bp)
    app.register_blueprint(cert_bp)
    app.register_blueprint(staffid_bp)
    app.register_blueprint(notification_bp)

    @app.route("/")
    def root():
        return jsonify({
            "status": "ok",
            "service": "SPA Employee Portal API",
            "health": "/health",
        }), 200

    @app.route("/api")
    def api_root():
        return jsonify({
            "status": "ok",
            "message": "SPA Employee Portal API is running",
            "health": "/health",
        }), 200

    @app.route("/health")
    def health():
        try:
            from database import get_db
            db = get_db()
            return jsonify({
                "status": "ok",
                "service": "SPA Employee Portal API",
                "version": "2.2",
                "databaseName": Config.MONGO_DB_NAME,
                "databaseUri": mask_mongo_uri(Config.MONGO_URI),
                "employees": db.employees.count_documents({}),
                "portalUsers": db.employee_portal_users.count_documents({}),
            }), 200
        except Exception as exc:
            return jsonify({"status": "error", "message": str(exc)}), 500

    @app.errorhandler(404)
    def not_found(_e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def server_error(_e):
        return jsonify({"error": "Internal server error"}), 500

    return app


# Required for Vercel / WSGI hosting
try:
    init_db()
except Exception as exc:
    print(f"[DB] Warning: MongoDB init failed: {exc}")

os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    print("\n────────────────────────────────────────────────────────────")
    print(f"🚀 SPA Employee Portal API running on http://localhost:{port}")
    print(f"   MongoDB : {mask_mongo_uri(Config.MONGO_URI)}")
    print(f"   DB Name : {Config.MONGO_DB_NAME}")
    print("────────────────────────────────────────────────────────────\n")
    app.run(host="0.0.0.0", port=port, debug=Config.DEBUG)
