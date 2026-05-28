# routes package
from .employee_auth_routes import employee_auth_bp
from .certification_routes import cert_bp
from .staffid_routes       import staffid_bp
from .notification_routes  import notification_bp

__all__ = [
    "employee_auth_bp",
    "cert_bp",
    "staffid_bp",
    "notification_bp",
]
