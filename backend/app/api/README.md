# api/

HTTP endpoint routers. Filled in **B1.c+** as each capability lands:

- `auth.py` - login, logout, me, change-password (B1.c)
- `users.py` - admin user management (B1.d)
- `projects.py` - project CRUD (B1.e)
- `shares.py` - project sharing (B1.f)
- `transitions.py` - status workflow (B1.g)
- `audit.py` - server-side audit log queries (B1.f)

Each router is a FastAPI `APIRouter` mounted in `main.py`.