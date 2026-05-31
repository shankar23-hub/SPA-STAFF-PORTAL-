"""
employee_auth_routes.py – Login & profile endpoints for the SPA Employee Portal.

FIX: Login now uses staffId + password (NOT email).
     POST /api/auth/login accepts { "staffId": "SPA10001", "password": "SPA@10001" }

FIX: Response format matches the spec:
     { "success": true, "token": "...", "user": { "staffId", "name", "department" } }

FIX: JWT identity is staffId string (not numeric employeeId).

FIX: /api/profile returns { staffId, name, email, department }

Login resolution order:
  1. employee_portal_users.staffId  ← primary (set by Admin "Generate Staff Profile")
  2. staff_ids.staffId              ← fallback mirror record
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity,
)
from werkzeug.security import check_password_hash

from database import get_db

employee_auth_bp = Blueprint(
    "employee_auth", __name__, url_prefix="/api/auth",
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _serialize(doc: dict) -> dict:
    """Strip Mongo internals and password fields."""
    if not doc:
        return {}
    d = dict(doc)
    d.pop("_id", None)
    d.pop("passwordHash", None)
    d.pop("password", None)
    return d


def _verify_password(record: dict, password: str) -> bool:
    """Accept werkzeug hash or (legacy) plain-text password."""
    if not record:
        return False
    pw_hash = record.get("passwordHash") or ""
    plain = record.get("password") or ""
    if pw_hash:
        try:
            return check_password_hash(pw_hash, password)
        except Exception:
            pass
    if plain:
        return plain == password
    return False


def _find_portal_user_by_staff_id(db, staff_id: str):
    """
    Look up login record by Staff ID.
    Checks employee_portal_users first, then staff_ids as fallback.
    Returns the record or None.
    """
    # 1) Primary store — created by Admin "Generate Staff Profile"
    rec = db.employee_portal_users.find_one({"staffId": staff_id})
    if rec:
        return rec

    # 2) Mirror record in staff_ids (also created by Admin)
    rec = db.staff_ids.find_one({"staffId": staff_id})
    if rec:
        return rec

    return None


def _get_employee_profile(db, portal_user: dict) -> dict | None:
    """Fetch full employee profile from employees collection."""
    emp_id = portal_user.get("employeeId")
    if emp_id is not None:
        emp = db.employees.find_one({"id": int(emp_id)})
        if emp:
            return emp
    # Fallback: lookup by email
    email = portal_user.get("email")
    if email:
        emp = db.employees.find_one({"email": email})
        if emp:
            return emp
    return None


# ── Routes ────────────────────────────────────────────────────────────────────

@employee_auth_bp.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}
    staff_id = (data.get("staffId") or "").strip()
    password = data.get("password", "")

    if not staff_id or not password:
        return jsonify({"message": "Staff ID and password are required"}), 400

    db = get_db()
    portal_user = _find_portal_user_by_staff_id(db, staff_id)

    if not portal_user:
        return jsonify({
            "message": (
                f"No account found for Staff ID '{staff_id}'. "
                "Ask your admin to generate credentials in the SPA Admin Portal."
            )
        }), 401

    if not _verify_password(portal_user, password):
        return jsonify({"message": "Incorrect password. Please try again."}), 401

    # Check account status if present
    if portal_user.get("status") == "inactive":
        return jsonify({"message": "Your account is inactive. Contact your admin."}), 403

    # Fetch full employee profile for enriched response
    emp = _get_employee_profile(db, portal_user)

    # Build user payload
    user_data = {
        "staffId": staff_id,
        "name": portal_user.get("name") or (emp.get("name") if emp else "") or "",
        "email": portal_user.get("email") or (emp.get("email") if emp else "") or "",
        "department": portal_user.get("department") or (emp.get("department") if emp else "") or "",
        "role": portal_user.get("role") or (emp.get("role") if emp else "") or "employee",
        "employeeId": portal_user.get("employeeId"),
    }

    # Merge full employee profile fields (skills, certs, etc.)
    if emp:
        emp_clean = _serialize(emp)
        # Only add extra fields; don't override the portal_user-sourced ones above
        for k, v in emp_clean.items():
            if k not in user_data:
                user_data[k] = v
        # Always keep staffId from portal_user
        user_data["staffId"] = staff_id
        user_data["empId"] = staff_id

    token = create_access_token(
        identity=staff_id,
        additional_claims={
            "role": "employee",
            "employeeId": portal_user.get("employeeId"),
        },
    )

    return jsonify({
        "success": True,
        "token": token,
        "user": user_data,
        "message": "Login successful",
    }), 200


@employee_auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    staff_id = get_jwt_identity()
    db = get_db()

    portal_user = _find_portal_user_by_staff_id(db, staff_id)
    if not portal_user:
        return jsonify({"message": "Employee not found"}), 404

    emp = _get_employee_profile(db, portal_user)
    if not emp:
        # Return portal user data alone if employee profile is missing
        data = _serialize(portal_user)
        data["staffId"] = staff_id
        return jsonify(data), 200

    emp_data = _serialize(emp)
    emp_data["staffId"] = staff_id
    emp_data["empId"] = staff_id
    emp_data["email"] = portal_user.get("email") or emp_data.get("email", "")
    return jsonify(emp_data), 200


@employee_auth_bp.route("/refresh", methods=["POST"])
@jwt_required()
def refresh():
    staff_id = get_jwt_identity()
    new_token = create_access_token(identity=staff_id)
    return jsonify({"token": new_token}), 200
