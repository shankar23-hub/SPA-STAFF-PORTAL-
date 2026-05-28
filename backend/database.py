"""
database.py – MongoDB connection & initialisation for the SPA Employee Portal.

This file is intentionally kept compatible with the SPA Admin Portal:
    • The same MongoDB database is used   ( spa_db )
    • The same collection names are used  ( employees, staff_ids,
                                            employee_portal_users,
                                            certifications,
                                            notifications,
                                            counters )
    • Indexes match Admin Portal exactly so create_index() never errors.
    • Seed data is ONLY inserted when the employees collection is empty,
      so we never overwrite anything created from the Admin side.
"""

from datetime import datetime
from pymongo import MongoClient, ASCENDING, ReturnDocument, errors
from config import Config

_client: MongoClient | None = None
_db = None


# ── Connection ────────────────────────────────────────────────────────────────
def get_db():
    """Return the MongoDB database; create the connection on first call.

    Works with both URI styles:
      1. mongodb+srv://user:pass@host/spa_admin_db?...
      2. mongodb+srv://user:pass@host/?... plus MONGO_DB_NAME=spa_admin_db
    """
    global _client, _db
    if _db is None:
        _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
        # Force a quick connection check so deployment errors are clear.
        _client.admin.command("ping")
        _db = _client[Config.MONGO_DB_NAME]
    return _db


def get_next_id(collection_name: str) -> int:
    """Atomically increment and return the next integer ID for a collection."""
    db = get_db()
    result = db.counters.find_one_and_update(
        {"_id": collection_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return result["seq"]


# ── Optional seed data (only used if employees collection is empty) ───────────
_SEED_EMPLOYEES = [
    {
        "id": 1, "name": "Shankar Rajan", "role": "AI/ML Engineer",
        "email": "shankar.rajan@spa.com", "phone": "+91 98400 11111",
        "department": "Engineering",
        "skills": ["Python", "AI", "React", "TensorFlow"],
        "certifications": ["AWS ML", "Google AI"],
        "experience": 6, "availability": "Available",
        "pastPerformance": 94, "currentProjects": 1, "score": 95,
        "avatar": "SR", "color": "#8B5CF6", "joinDate": "2019-03-15",
        "imagePreview": "", "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": 2, "name": "Arun Kumar", "role": "Full Stack Developer",
        "email": "arun.kumar@spa.com", "phone": "+91 98400 22222",
        "department": "Engineering",
        "skills": ["React", "Node.js", "SQL", "JavaScript"],
        "certifications": ["MongoDB Dev"],
        "experience": 4, "availability": "Busy",
        "pastPerformance": 80, "currentProjects": 3, "score": 82,
        "avatar": "AK", "color": "#F87171", "joinDate": "2021-06-01",
        "imagePreview": "", "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": 3, "name": "Priya Nair", "role": "Data Scientist",
        "email": "priya.nair@spa.com", "phone": "+91 98400 33333",
        "department": "Data",
        "skills": ["Python", "ML", "SQL", "Pandas", "Scikit-learn"],
        "certifications": ["IBM Data Science", "Kaggle Expert"],
        "experience": 5, "availability": "Available",
        "pastPerformance": 92, "currentProjects": 1, "score": 91,
        "avatar": "PN", "color": "#00C896", "joinDate": "2020-01-20",
        "imagePreview": "", "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": 4, "name": "Vikram Singh", "role": "Backend Developer",
        "email": "vikram.singh@spa.com", "phone": "+91 98400 44444",
        "department": "Engineering",
        "skills": ["Java", "SQL", "Python", "Spring Boot"],
        "certifications": ["Oracle Java", "AWS Dev"],
        "experience": 7, "availability": "Available",
        "pastPerformance": 87, "currentProjects": 2, "score": 88,
        "avatar": "VS", "color": "#FF9F43", "joinDate": "2018-08-10",
        "imagePreview": "", "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": 5, "name": "Divya Menon", "role": "Frontend Developer",
        "email": "divya.menon@spa.com", "phone": "+91 98400 55555",
        "department": "Design",
        "skills": ["React", "HTML5", "CSS3", "JavaScript", "Figma"],
        "certifications": ["React Certified"],
        "experience": 3, "availability": "Available",
        "pastPerformance": 78, "currentProjects": 1, "score": 79,
        "avatar": "DM", "color": "#38BDF8", "joinDate": "2022-03-01",
        "imagePreview": "", "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": 6, "name": "Rahul Sharma", "role": "DevOps Engineer",
        "email": "rahul.sharma@spa.com", "phone": "+91 98400 66666",
        "department": "Infrastructure",
        "skills": ["Python", "Docker", "Kubernetes", "SQL"],
        "certifications": ["CKA", "AWS SysOps"],
        "experience": 5, "availability": "Busy",
        "pastPerformance": 83, "currentProjects": 2, "score": 84,
        "avatar": "RS", "color": "#A78BFA", "joinDate": "2020-09-15",
        "imagePreview": "", "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": 7, "name": "Meena Krishnan", "role": "Project Manager",
        "email": "meena.krishnan@spa.com", "phone": "+91 98400 77777",
        "department": "Management",
        "skills": ["Agile", "Scrum", "JIRA", "SQL"],
        "certifications": ["PMP", "Scrum Master"],
        "experience": 9, "availability": "Available",
        "pastPerformance": 91, "currentProjects": 1, "score": 90,
        "avatar": "MK", "color": "#34D399", "joinDate": "2016-05-20",
        "imagePreview": "", "createdAt": datetime.utcnow().isoformat(),
    },
    {
        "id": 8, "name": "Arjun Pillai", "role": "Security Engineer",
        "email": "arjun.pillai@spa.com", "phone": "+91 98400 88888",
        "department": "Security",
        "skills": ["Python", "JavaScript", "SQL", "Cybersecurity"],
        "certifications": ["CEH", "CISSP"],
        "experience": 6, "availability": "Available",
        "pastPerformance": 85, "currentProjects": 1, "score": 86,
        "avatar": "AP", "color": "#FCD34D", "joinDate": "2019-11-01",
        "imagePreview": "", "createdAt": datetime.utcnow().isoformat(),
    },
]


# ── Init ──────────────────────────────────────────────────────────────────────
def init_db() -> None:
    """Create indexes, bootstrap counters and (only if empty) seed employees."""
    db = get_db()

    # Unique / supporting indexes.
    # IMPORTANT FIX:
    # Some Atlas databases already contain email_1 as { unique: true, sparse: true }.
    # Re-creating the same auto index name without sparse=True causes:
    # IndexKeySpecsConflict: existing index has the same name as requested index.
    # So email indexes are created with sparse=True and conflicts are skipped safely.
    def ensure_index(collection, keys, **options):
        try:
            collection.create_index(keys, **options)
        except errors.OperationFailure as exc:
            if exc.code == 86 or "IndexKeySpecsConflict" in str(exc):
                index_name = options.get("name") or "_".join([f"{field}_{direction}" for field, direction in keys])
                print(f"[DB] Existing index conflict skipped safely: {collection.name}.{index_name}")
            else:
                raise

    ensure_index(db.employees, [("id", ASCENDING)], unique=True, background=True)
    ensure_index(db.employees, [("email", ASCENDING)], unique=True, sparse=True, background=True)

    ensure_index(db.staff_ids, [("employeeId", ASCENDING)], unique=True, background=True)
    ensure_index(db.employee_portal_users, [("email", ASCENDING)], unique=True, sparse=True, background=True)
    ensure_index(db.employee_portal_users, [("employeeId", ASCENDING)], unique=True, background=True)

    ensure_index(db.certifications, [("id", ASCENDING)], unique=True, background=True)
    ensure_index(db.certifications, [("employeeId", ASCENDING)], background=True)

    # Bootstrap counters
    for name, start in [("employees", 8), ("certifications", 0)]:
        if db.counters.find_one({"_id": name}) is None:
            db.counters.insert_one({"_id": name, "seq": start})

    # ONLY seed when the employees collection is completely empty.
    # If the Admin Portal has already created employees, we DO NOT touch them.
    if db.employees.count_documents({}) == 0:
        try:
            db.employees.insert_many(_SEED_EMPLOYEES)
            print("[DB] Seeded 8 sample employees (collection was empty).")
        except Exception as exc:
            print(f"[DB] Seed skipped: {exc}")
    else:
        print("[DB] Employees collection already populated – skipping seed.")

    print(f"[DB] MongoDB initialised. Database: {Config.MONGO_DB_NAME}")
