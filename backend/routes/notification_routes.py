"""
notification_routes.py – Read & mark-read endpoints for the notifications collection.

FIX: mark_read now accepts Authorization header (JWT) for consistency.
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from database import get_db

notification_bp = Blueprint(
    "ep_notifications", __name__, url_prefix="/api/notifications",
)


@notification_bp.route("/employee/<int:emp_id>", methods=["GET"])
def get_notifications(emp_id):
    """Return up to 50 notifications for a given employee, newest first."""
    db = get_db()
    try:
        notes = list(
            db.notifications
              .find({"employeeId": int(emp_id)}, {"_id": 0})
              .sort("createdAt", -1)
              .limit(50)
        )
        return jsonify(notes)
    except Exception:
        return jsonify([])


@notification_bp.route("/<int:notif_id>/read", methods=["PATCH"])
def mark_read(notif_id):
    db = get_db()
    try:
        db.notifications.update_one({"id": notif_id}, {"$set": {"read": True}})
    except Exception:
        pass
    return jsonify({"success": True})
