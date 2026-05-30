# models/

SQLAlchemy ORM models. Filled in **B1.b+** as each table is added:

- `user.py` - User (B1.b)
- `project.py` - Project including the `state_json` JSONB column (B1.e)
- `project_share.py` - ProjectShare (B1.f)
- `audit_entry.py` - AuditEntry (B1.f)

Schema is governed by the migrations in `../alembic/versions/`; the ORM
models mirror those migrations.