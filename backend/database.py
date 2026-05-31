"""
database.py – MongoDB connection & initialisation for the SPA Employee Portal.

FIX: Shared MongoDB database 'spa_admin_db' with Admin Portal.
FIX: Added staffId index on employee_portal_users for Staff ID login.
FIX: Added messages and announcements collections init.
FIX: Removed hardcoded seed employees (Admin Portal manages the collection).
"""

from pymongo import MongoClient, ASCENDING, ReturnDocument
from pymongo.errors import OperationFailure
from config import Config

_client: MongoClient | None = None
_db = None


def get_db():
    """Return the MongoDB database; create the connection on first call."""
    global _client, _db
    if _db is None:
        if not Config.MONGO_URI:
            raise RuntimeError(
                "MONGO_URI is not set. Add it to your .env file or Vercel Environment Variables."
            )
        _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=8000)
        _client.admin.command("ping")
        _db = _client[Config.MONGO_DB_NAME]
    return _db


def get_next_id(collection_name: str) -> int:
    db = get_db()
    result = db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return result["seq"]


def _ensure_index(collection, keys, **options):
    """Create index, safely skipping if a conflicting index already exists."""
    try:
        collection.create_index(keys, **options)
    except OperationFailure as exc:
        if exc.code == 86 or "IndexKeySpecsConflict" in str(exc):
            print(f"[DB] Index conflict skipped safely: {collection.name}")
        else:
            raise


def init_db() -> None:
    """Create indexes and bootstrap counters. Does NOT seed employees."""
    db = get_db()

    # employees
    _ensure_index(db.employees, [("id", ASCENDING)], unique=True, background=True)
    _ensure_index(db.employees, [("email", ASCENDING)], unique=True, sparse=True, background=True)

    # staff_ids
    _ensure_index(db.staff_ids, [("employeeId", ASCENDING)], unique=True, background=True)
    _ensure_index(db.staff_ids, [("staffId", ASCENDING)], unique=True, sparse=True, background=True)

    # employee_portal_users — three lookup paths: staffId, email, employeeId
    _ensure_index(db.employee_portal_users, [("staffId", ASCENDING)], unique=True, sparse=True, background=True)
    _ensure_index(db.employee_portal_users, [("email", ASCENDING)], unique=True, sparse=True, background=True)
    _ensure_index(db.employee_portal_users, [("employeeId", ASCENDING)], unique=True, background=True)

    # certifications
    _ensure_index(db.certifications, [("id", ASCENDING)], unique=True, background=True)
    _ensure_index(db.certifications, [("employeeId", ASCENDING)], background=True)

    # notifications
    _ensure_index(db.notifications, [("employeeId", ASCENDING)], background=True)

    # Bootstrap counters (do not reset if already set)
    for name, start in [("employees", 0), ("certifications", 0), ("staff_ids", 0)]:
        if db.counters.find_one({"_id": name}) is None:
            db.counters.insert_one({"_id": name, "seq": start})

    print(f"[DB] MongoDB initialised. Database: {Config.MONGO_DB_NAME}")
