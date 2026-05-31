"""
app.py – SPA Employee Portal Backend (Flask + MongoDB + JWT)

FIX: Added GET /api/dashboard  (returns announcements, notifications, tasks)
FIX: Added GET /api/inbox      (returns messages)
FIX: Added GET /api/profile    (returns staffId, name, email, department)
FIX: All protected routes use JWT Bearer token.
FIX: Login route is /api/auth/login (matches spec).
FIX: JWT_SECRET_KEY must match Admin Portal (set in Vercel env vars).

Vercel-ready: exposes a global `app` WSGI variable.
Local run: python app.py (port 5002)
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, jsonify, request
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS

from config import Config
from database import init_db, get_db
from routes.employee_auth_routes import employee_auth_bp
from routes.notification_routes import notification_bp


def mask_mongo_uri(uri: str) -> str:
    try:
        if "@" not in uri or "://" not in uri:
            return uri
        protocol, rest = uri.split("://", 1)
        credentials, host = rest.split("@", 1)
        username = credentials.split(":", 1)[0]
        return f"{protocol}://{username}:****@{host}"
    except Exception:
        return "mongodb-uri-configured"


def get_allowed_origins() -> list:
    origins = [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:4173", "http://127.0.0.1:4173",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ]
    if Config.FRONTEND_URL:
        origins.append(Config.FRONTEND_URL.rstrip("/"))
    return origins


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY
    app.config["JWT_SECRET_KEY"] = Config.JWT_SECRET_KEY
    app.config["UPLOAD_FOLDER"] = Config.UPLOAD_FOLDER
    app.config["MAX_CONTENT_LENGTH"] = Config.MAX_CONTENT_LENGTH
    app.config["DEBUG"] = Config.DEBUG

    CORS(
        app,
        resources={r"/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        supports_credentials=False,
    )

    JWTManager(app)

    # ── Blueprint registrations ────────────────────────────────────────────────
    app.register_blueprint(employee_auth_bp)
    app.register_blueprint(notification_bp)

    # ── Health / Root ──────────────────────────────────────────────────────────

    @app.route("/")
    def root():
        return jsonify({
            "status": "ok",
            "service": "SPA Employee Portal API",
            "health": "/health",
            "login": "/api/auth/login",
        }), 200

    @app.route("/api")
    def api_root():
        return jsonify({
            "status": "ok",
            "message": "SPA Employee Portal API is running",
            "endpoints": {
                "login": "POST /api/auth/login",
                "me": "GET /api/auth/me",
                "dashboard": "GET /api/dashboard",
                "inbox": "GET /api/inbox",
                "profile": "GET /api/profile",
            },
        }), 200

    @app.route("/health")
    def health():
        try:
            db = get_db()
            return jsonify({
                "status": "ok",
                "service": "SPA Employee Portal API",
                "version": "3.0",
                "databaseName": Config.MONGO_DB_NAME,
                "employees": db.employees.count_documents({}),
                "portalUsers": db.employee_portal_users.count_documents({}),
            }), 200
        except Exception as exc:
            return jsonify({"status": "error", "message": str(exc)}), 500

    # ── Dashboard API ──────────────────────────────────────────────────────────
    @app.route("/api/dashboard", methods=["GET"])
    @jwt_required()
    def dashboard():
        """
        Returns dashboard data for the logged-in employee.
        GET /api/dashboard
        Headers: Authorization: Bearer <token>

        Response:
          { "announcements": [...], "notifications": [...], "tasks": [] }
        """
        staff_id = get_jwt_identity()
        db = get_db()

        # Find employee's numeric ID for DB queries
        portal_user = db.employee_portal_users.find_one({"staffId": staff_id})
        emp_id = portal_user.get("employeeId") if portal_user else None

        # Fetch notifications (project allocations etc.)
        notifications = []
        if emp_id is not None:
            notif_docs = list(
                db.notifications
                .find({"employeeId": int(emp_id)}, {"_id": 0})
                .sort("createdAt", -1)
                .limit(10)
            )
            notifications = notif_docs

        # Fetch announcements (from announcements collection, shared)
        announcements = list(
            db.announcements
            .find({}, {"_id": 0})
            .sort("createdAt", -1)
            .limit(5)
        )

        # Tasks (placeholder — extend when tasks collection is added)
        tasks = []

        return jsonify({
            "announcements": announcements,
            "notifications": notifications,
            "tasks": tasks,
        }), 200

    # ── Inbox API ──────────────────────────────────────────────────────────────
    @app.route("/api/inbox", methods=["GET"])
    @jwt_required()
    def inbox():
        """
        Returns inbox messages for the logged-in employee.
        GET /api/inbox
        Headers: Authorization: Bearer <token>

        Response: { "messages": [...] }
        """
        staff_id = get_jwt_identity()
        db = get_db()

        portal_user = db.employee_portal_users.find_one({"staffId": staff_id})
        emp_id = portal_user.get("employeeId") if portal_user else None

        messages = []
        if emp_id is not None:
            # Messages sent to this employee
            msg_docs = list(
                db.messages
                .find({"employeeId": int(emp_id)}, {"_id": 0})
                .sort("createdAt", -1)
                .limit(50)
            )
            messages = msg_docs

            # Also include notification-style messages
            notif_docs = list(
                db.notifications
                .find({"employeeId": int(emp_id)}, {"_id": 0})
                .sort("createdAt", -1)
                .limit(50)
            )
            for n in notif_docs:
                messages.append({
                    "id": n.get("id"),
                    "sender": "Admin — Project Allocation",
                    "subject": f"Project Allocated: {n.get('projectName', '')}",
                    "body": n.get("message", ""),
                    "read": n.get("read", False),
                    "category": "Allocation",
                    "createdAt": n.get("createdAt") or n.get("sentAt", ""),
                })

        return jsonify({"messages": messages}), 200

    # ── Profile API ────────────────────────────────────────────────────────────
    @app.route("/api/profile", methods=["GET"])
    @jwt_required()
    def profile():
        """
        Returns profile for the logged-in employee.
        GET /api/profile
        Headers: Authorization: Bearer <token>

        Response: { "staffId": "", "name": "", "email": "", "department": "" }
        """
        staff_id = get_jwt_identity()
        db = get_db()

        portal_user = db.employee_portal_users.find_one({"staffId": staff_id})
        if not portal_user:
            # Try staff_ids fallback
            portal_user = db.staff_ids.find_one({"staffId": staff_id})

        if not portal_user:
            return jsonify({
                "staffId": staff_id,
                "name": "",
                "email": "",
                "department": "",
            }), 200

        emp_id = portal_user.get("employeeId")
        emp = db.employees.find_one({"id": int(emp_id)}) if emp_id else None

        profile_data = {
            "staffId": staff_id,
            "name": portal_user.get("name") or (emp.get("name") if emp else "") or "",
            "email": portal_user.get("email") or (emp.get("email") if emp else "") or "",
            "department": portal_user.get("department") or (emp.get("department") if emp else "") or "",
        }

        # Include extended fields from employee record if available
        if emp:
            profile_data.update({
                "role": emp.get("role", ""),
                "phone": emp.get("phone", ""),
                "experience": emp.get("experience", 0),
                "availability": emp.get("availability", "Available"),
                "skills": emp.get("skills", []),
                "certifications": emp.get("certifications", []),
                "joinDate": emp.get("joinDate", ""),
                "imagePreview": emp.get("imagePreview", ""),
                "avatar": emp.get("avatar", ""),
                "employeeId": emp.get("id"),
            })

        return jsonify(profile_data), 200

    # ── Error handlers ─────────────────────────────────────────────────────────

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
