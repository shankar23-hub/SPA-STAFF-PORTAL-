"""
certification_routes.py – Certificate upload, listing and approval flow
                          for the SPA Employee Portal.
"""

import os
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

from database import get_db, get_next_id

cert_bp = Blueprint("certifications", __name__, url_prefix="/api/certifications")

ALLOWED_EXTENSIONS = {"pdf"}


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ── List certs for an employee ───────────────────────────────────────────────
@cert_bp.route("/employee/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_employee_certs(employee_id):
    db   = get_db()
    docs = list(db.certifications.find({"employeeId": int(employee_id)}, {"_id": 0}))
    docs.sort(key=lambda x: x.get("submittedAt", ""), reverse=True)
    return jsonify(docs), 200


# ── Upload a new cert ────────────────────────────────────────────────────────
@cert_bp.route("/upload", methods=["POST"])
def upload_cert():
    employee_id   = request.form.get("employeeId")
    employee_name = request.form.get("employeeName", "")
    cert_name     = (request.form.get("certificateName") or "").strip()
    course_name   = (request.form.get("courseName")     or "").strip()
    code_skills   = (request.form.get("codeSkills")     or "").strip()

    if not cert_name:
        return jsonify({"error": "certificateName is required"}), 400
    if not employee_id:
        return jsonify({"error": "employeeId is required"}), 400

    file_name = None
    file = request.files.get("file")
    if file and file.filename:
        if not _allowed(file.filename):
            return jsonify({"error": "Only PDF files are allowed"}), 400
        filename   = secure_filename(file.filename)
        upload_dir = current_app.config.get("UPLOAD_FOLDER", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        file.save(os.path.join(upload_dir, filename))
        file_name = filename

    db     = get_db()
    new_id = get_next_id("certifications")
    now    = datetime.utcnow().isoformat()

    doc = {
        "id":              new_id,
        "employeeId":      int(employee_id),
        "employeeName":    employee_name,
        "certificateName": cert_name,
        "courseName":      course_name,
        "codeSkills":      code_skills,
        "fileName":        file_name,
        "status":          "Pending",
        "submittedAt":     now,
        "analysisResult":  None,
        "rejectionReason": None,
    }

    db.certifications.insert_one(doc)
    doc.pop("_id", None)
    return jsonify(doc), 201


# ── Get a single cert ────────────────────────────────────────────────────────
@cert_bp.route("/<int:cert_id>", methods=["GET"])
@jwt_required()
def get_cert(cert_id):
    db  = get_db()
    doc = db.certifications.find_one({"id": cert_id}, {"_id": 0})
    if not doc:
        return jsonify({"error": "Not found"}), 404
    return jsonify(doc), 200


# ── Admin approves / rejects a cert ──────────────────────────────────────────
@cert_bp.route("/<int:cert_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(cert_id):
    data             = request.get_json(silent=True) or {}
    status           = data.get("status")
    rejection_reason = data.get("rejectionReason", "")
    analysis_result  = data.get("analysisResult")

    if status not in ("Approved", "Rejected", "Pending", "Submitted"):
        return jsonify({"error": "Invalid status"}), 400

    db  = get_db()
    doc = db.certifications.find_one({"id": cert_id})
    if not doc:
        return jsonify({"error": "Not found"}), 404

    update = {"status": status, "rejectionReason": rejection_reason}
    if analysis_result:
        update["analysisResult"] = analysis_result

    db.certifications.update_one({"id": cert_id}, {"$set": update})

    # On approval, propagate the cert + skills onto the employee profile
    if status == "Approved":
        emp_id        = doc["employeeId"]
        cert_name     = doc["certificateName"]
        skills_to_add = [s.strip() for s in doc.get("codeSkills", "").split(",") if s.strip()]

        emp = db.employees.find_one({"id": emp_id})
        if emp:
            existing_certs  = list(emp.get("certifications", []))
            existing_skills = list(emp.get("skills", []))
            if cert_name not in existing_certs:
                existing_certs.append(cert_name)
            for s in skills_to_add:
                if s not in existing_skills:
                    existing_skills.append(s)
            db.employees.update_one(
                {"id": emp_id},
                {"$set": {"certifications": existing_certs,
                          "skills":         existing_skills}},
            )

    updated = db.certifications.find_one({"id": cert_id}, {"_id": 0})
    return jsonify(updated), 200
