#!/usr/bin/env python3
"""
setup-backend-tree.py — Create the B0-defined directory tree for the SOW
Calculator backend.

Idempotent. Creates the `backend/` and `nginx/` directory trees under the
target project root, populates each directory with a short README stub
naming the milestone that will fill it, and drops a `.gitkeep` in any
directory that needs git visibility before code arrives.

Does NOT create stub source files (no empty Dockerfile, no empty
pyproject.toml, no empty docker-compose.yml). Those land in the appropriate
B1.x milestone with real content.

Mirrors setup-backend-tree.ps1 in behavior. Use whichever fits your shell.

Usage:
    python setup-backend-tree.py
    python setup-backend-tree.py --target ./sow-calc
    python setup-backend-tree.py --verify
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Final

# ---------------------------------------------------------------------------
# Tree definition - keep in sync with B0 §12 (docs/B0-architecture.md)
# ---------------------------------------------------------------------------

DIRECTORIES: Final[list[str]] = [
    "backend",
    "backend/alembic",
    "backend/alembic/versions",
    "backend/app",
    "backend/app/auth",
    "backend/app/api",
    "backend/app/models",
    "backend/app/schemas",
    "backend/app/services",
    "backend/tests",
    "backend/cleanup",
    "nginx",
]

README_FILES: Final[dict[str, str]] = {
    "backend/README.md": """# backend/

FastAPI service for the SOW Cost Calculator. Stands up next to the existing
SPA in the monorepo. See `docs/B0-architecture.md` §12 for the full layout.

## Status

This directory is the skeleton created by `setup-backend-tree.py`. The
service itself lands in **B1.a** (Hello FastAPI from Docker on EC2).

## What goes where

- `app/` - FastAPI source (routers, models, schemas, auth, services)
- `alembic/` - database migrations (B1.b onward)
- `cleanup/` - the project-retention cleanup utility (B1.g)
- `tests/` - pytest suite for the API

## Running

Not runnable yet. See `docs/B0-architecture.md` and the B1.a quickstart when
it ships.
""",

    "backend/alembic/README.md": """# alembic/

Database migrations. Filled in **B1.b** (database + users table + bootstrap
admin).

Will contain `env.py`, `script.py.mako`, and one initial migration creating
the `users` table. Subsequent B1 sub-milestones add migrations for
`projects`, `project_shares`, and `audit_entries`.

## Running migrations

After B1.b lands:

    docker compose exec backend alembic upgrade head
""",

    "backend/app/README.md": """# app/

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
""",

    "backend/app/auth/README.md": """# auth/

Authentication backends. Filled in **B1.c** (standalone) and **B3** (OIDC).

Both implementations satisfy the `AuthBackend` protocol. The active backend
is selected at startup via the `AUTH_MODE` environment variable
(`standalone` or `oidc`).

See `docs/B0-architecture.md` §3 for the architecture.
""",

    "backend/app/api/README.md": """# api/

HTTP endpoint routers. Filled in **B1.c+** as each capability lands:

- `auth.py` - login, logout, me, change-password (B1.c)
- `users.py` - admin user management (B1.d)
- `projects.py` - project CRUD (B1.e)
- `shares.py` - project sharing (B1.f)
- `transitions.py` - status workflow (B1.g)
- `audit.py` - server-side audit log queries (B1.f)

Each router is a FastAPI `APIRouter` mounted in `main.py`.
""",

    "backend/app/models/README.md": """# models/

SQLAlchemy ORM models. Filled in **B1.b+** as each table is added:

- `user.py` - User (B1.b)
- `project.py` - Project including the `state_json` JSONB column (B1.e)
- `project_share.py` - ProjectShare (B1.f)
- `audit_entry.py` - AuditEntry (B1.f)

Schema is governed by the migrations in `../alembic/versions/`; the ORM
models mirror those migrations.
""",

    "backend/app/schemas/README.md": """# schemas/

Pydantic request/response models. Filled in **B1.c+** alongside the endpoint
routers in `../api/`.

Naming convention: `XCreate`, `XUpdate`, `XRead` for input/output variants
of resource X. Separate from the SQLAlchemy ORM models in `../models/`.
""",

    "backend/app/services/README.md": """# services/

Business logic helpers that compose multiple model operations. Filled in
**B1.e+** as the workflow gets complex enough to warrant extraction from
the API routers.

Examples of what lives here once B1 is complete:

- Permission checking (combine role, share, status)
- Status transition validation (state machine enforcement)
- Audit log writes (called from every server-mediated mutation)
""",

    "backend/tests/README.md": """# tests/

pytest suite for the backend API. First tests land in **B1.a** (just the
healthcheck endpoint). Each subsequent B1.x adds tests for the capability
it ships.

## Running

After B1.a lands:

    docker compose exec backend pytest
    docker compose exec backend pytest -v tests/test_auth.py
""",

    "backend/cleanup/README.md": """# cleanup/

The project-retention cleanup utility. Filled in **B1.g** (status workflow
+ cleanup utility).

Separate Python process, not part of the FastAPI app. Reads a YAML config
file describing retention policies (age + status criteria) and hard-deletes
matching projects.

See `docs/B0-architecture.md` §6.6 for the operational design.
""",

    "nginx/README.md": """# nginx/

Reverse proxy configuration. Filled in **B1.a** (Hello FastAPI from Docker
on EC2).

nginx terminates HTTPS using a pre-existing PEM certificate mounted from
the host, serves the SPA's built `dist/` files for non-API routes, and
proxies `/api/*` to the backend container.

The cert path on the host is configured via `docker-compose.yml` and loaded
into nginx via volume mount.

See `docs/B0-architecture.md` §9 for the deployment topology.
""",
}

GITKEEP_DIRS: Final[list[str]] = [
    "backend/alembic/versions",
]


# ---------------------------------------------------------------------------
# Logging helpers
# ---------------------------------------------------------------------------

LEVELS = {
    "info": ("     ", "\033[0;37m"),
    "ok":   ("[OK] ", "\033[0;32m"),
    "warn": ("[!]  ", "\033[0;33m"),
    "err":  ("[X]  ", "\033[0;31m"),
    "new":  ("[+]  ", "\033[0;36m"),
    "skip": ("[=]  ", "\033[0;90m"),
}
RESET = "\033[0m"


def log(message: str, level: str = "info") -> None:
    icon, color = LEVELS.get(level, LEVELS["info"])
    # ANSI colors are pleasant on Unix, harmless on modern Windows terminals.
    print(f"{color}{icon}{message}{RESET}")


def write_utf8_no_bom(path: Path, content: str) -> None:
    """Mirror the PowerShell `Write-Utf8NoBom` helper. Standard UTF-8, no BOM."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def make_dir_if_missing(path: Path) -> bool:
    if path.is_dir():
        return False
    path.mkdir(parents=True, exist_ok=True)
    return True


def write_file_if_absent(path: Path, content: str) -> bool:
    if path.is_file():
        return False
    write_utf8_no_bom(path, content)
    return True


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def run_setup(target: Path) -> int:
    if not target.exists():
        log(f"target does not exist: {target}", "err")
        log("create the SPA project first via the main bootstrap.py", "info")
        return 1

    abs_target = target.resolve()
    log(f"Setting up backend tree under: {abs_target}", "info")

    created_dirs = skipped_dirs = 0
    for d in DIRECTORIES:
        full = target / d
        if make_dir_if_missing(full):
            created_dirs += 1
            log(f"created dir: {d}", "new")
        else:
            skipped_dirs += 1
            log(f"exists:      {d}", "skip")

    created_files = skipped_files = 0
    for rel, content in README_FILES.items():
        full = target / rel
        if write_file_if_absent(full, content):
            created_files += 1
            log(f"created README: {rel}", "new")
        else:
            skipped_files += 1
            log(f"exists:         {rel}", "skip")

    for d in GITKEEP_DIRS:
        gk = target / d / ".gitkeep"
        if write_file_if_absent(gk, ""):
            created_files += 1
            log(f"created .gitkeep: {d}/.gitkeep", "new")

    log(
        f"done. {created_dirs} dirs created, {skipped_dirs} already existed; "
        f"{created_files} files created, {skipped_files} already existed.",
        "ok",
    )
    log("next: ratify B0, then start B1.a.", "info")
    return 0


def run_verify(target: Path) -> int:
    if not target.exists():
        log(f"target does not exist: {target}", "err")
        return 1

    log(f"verifying backend tree at: {target.resolve()}", "info")

    missing_dirs = [d for d in DIRECTORIES if not (target / d).is_dir()]
    missing_files = [f for f in README_FILES if not (target / f).is_file()]

    if not missing_dirs and not missing_files:
        log("structure intact.", "ok")
        return 0

    for d in missing_dirs:
        log(f"missing dir:    {d}", "warn")
    for f in missing_files:
        log(f"missing README: {f}", "warn")
    log("run without --verify to repair.", "info")
    return 1


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Create the B0-defined backend directory tree for the SOW Calculator.",
    )
    parser.add_argument(
        "--target",
        default="./sow-calc",
        help="Target directory (the SPA project root). Default: ./sow-calc",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Check structure without modifying anything.",
    )
    args = parser.parse_args(argv)

    target = Path(args.target)
    if args.verify:
        return run_verify(target)
    return run_setup(target)


if __name__ == "__main__":
    sys.exit(main())
