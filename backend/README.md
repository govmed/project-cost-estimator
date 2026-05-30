# backend/

FastAPI service for the SOW Cost Calculator. Stands up next to the existing
SPA in the monorepo. See `docs/B0-architecture.md` Â§12 for the full layout.

## Status

This directory is the skeleton created by `setup-backend-tree.ps1`. The
service itself lands in **B1.a** (Hello FastAPI from Docker on EC2).

## What goes where

- `app/` - FastAPI source (routers, models, schemas, auth, services)
- `alembic/` - database migrations (B1.b onward)
- `cleanup/` - the project-retention cleanup utility (B1.g)
- `tests/` - pytest suite for the API

## Running

Not runnable yet. See `docs/B0-architecture.md` and the B1.a quickstart when
it ships.