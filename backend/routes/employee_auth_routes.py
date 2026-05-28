"""
employee_auth_routes.py – Login & profile endpoints for the SPA Employee Portal.

Login resolution order (defensive – any one of these is enough):
  1. employee_portal_users.email                ← created by Admin "Generate Credentials"
  2. staff_ids.email                            ← parallel record kept by Admin
  3. employees.email                            ← raw employee profile (rarely used)

Password verification:
  • If a Werkzeug passwordHash is present → check_password_hash
  • Else if a plain `password` is present → equality compare
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity,
)
from werkzeug.security import check_password_hash

from database import get_db

employee_auth_bp = Blueprint(
    "employee_auth", __name__, url_prefix="/api/employee/auth",
)


# ── Helpers ───────────────────────────────────────────────────────────────────
def _serialize(doc: dict) -> dict:
    """Strip Mongo internals and any password material."""
    if not doc:
        return {}
    d = dict(doc)
    d.pop("_id", None)
    d.pop("passwordHash", None)
    d.pop("password", None)
    return d


def _verify_password(record: dict, password: str) -> bool:
    """Accept either a hashed password or a seeded plaintext password."""
    if not record:
        return False
    pw_hash = record.get("passwordHash") or ""
    plain   = record.get("password") or ""
    if pw_hash:
        try:
            return check_password_hash(pw_hash, password)
        except Exception:
            pass
    if plain:
        return plain == password
    return False


def _find_login_record(db, email: str):
    """
    Try every place admin-side credentials might live, in priority order.
    Returns (record, employeeId) or (None, None).
    """
    # 1) Primary store created by Admin "Generate Credentials"
    rec = db.employee_portal_users.find_one({"email": email})
    if rec:
        return rec, rec.get("employeeId")

    # 2) Mirror record in staff_ids (also created by Admin)
    rec = db.staff_ids.find_one({"email": email})
    if rec:
        return rec, rec.get("employeeId")

    # 3) Raw employee profile (rare, but useful for legacy data)
    rec = db.employees.find_one({"email": email})
    if rec:
        return rec, rec.get("id")

    return None, None


# ── Routes ────────────────────────────────────────────────────────────────────
@employee_auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    db = get_db()
    record, emp_id = _find_login_record(db, email)

    if not record or emp_id is None:
        return jsonify({
            "message": "No account exists for this email. "
                       "Ask your admin to generate credentials in the SPA Admin Portal."
        }), 401

    if not _verify_password(record, password):
        return jsonify({"message": "Incorrect password. Please try again."}), 401

    # Fetch full employee profile
    emp = db.employees.find_one({"id": int(emp_id)})
    if not emp:
        return jsonify({
            "message": "Login OK but employee profile is missing. Contact admin."
        }), 404

    emp_data = _serialize(emp)

    # Attach the empId / generated email from staff_ids when present
    staff_id_rec = db.staff_ids.find_one({"employeeId": int(emp_id)})
    if staff_id_rec:
        emp_data["empId"] = staff_id_rec.get("empId", emp_data.get("empId", ""))
        emp_data["email"] = staff_id_rec.get("email", emp_data.get("email", ""))

    token = create_access_token(identity=str(emp_id))

    return jsonify({
        "token":    token,
        "employee": emp_data,
        "message":  "Login successful",
    }), 200


@employee_auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    try:
        emp_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid token"}), 401

    db  = get_db()
    emp = db.employees.find_one({"id": emp_id})
    if not emp:
        return jsonify({"message": "Employee not found"}), 404

    emp_data = _serialize(emp)
    staff_id_rec = db.staff_ids.find_one({"employeeId": emp_id})
    if staff_id_rec:
        emp_data["empId"] = staff_id_rec.get("empId", emp_data.get("empId", ""))
        emp_data["email"] = staff_id_rec.get("email", emp_data.get("email", ""))

    return jsonify(emp_data), 200


@employee_auth_bp.route("/refresh", methods=["POST"])
@jwt_required()
def refresh():
    emp_id    = get_jwt_identity()
    new_token = create_access_token(identity=str(emp_id))
    return jsonify({"token": new_token}), 200
