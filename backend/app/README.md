# app/

FastAPI application package. Entry point is `main.py`, filled in **B1.a**.

## Subpackages

- `auth/` - authentication backends (B1.c+)
- `api/` - HTTP endpoint routers (B1.c+)
- `models/` - SQLAlchemy ORM models (B1.b+)
- `schemas/` - Pydantic request/response shapes (B1.c+)
- `services/` - business logic helpers (B1.e+)

Plus top-level modules:

- `db.py` - database connection + session management (B1.b)
- `config.py` - environment variable loading (B1.a)
- `main.py` - FastAPI app entry point (B1.a)