<#
.SYNOPSIS
    Create the B0-defined directory tree for the SOW Calculator backend.

.DESCRIPTION
    Idempotent. Creates the `backend/` and `nginx/` directory trees under the
    target project root, populates each directory with a short README stub
    naming the milestone that will fill it, and drops a `.gitkeep` in any
    directory that needs git visibility before code arrives.

    Does NOT create stub source files (no empty Dockerfile, no empty
    pyproject.toml, no empty docker-compose.yml). Those land in the
    appropriate B1.x milestone with real content.

    Matches the existing bootstrap.ps1 pattern: absolute-path resolution,
    UTF-8 without BOM file writes, idempotent re-runs.

.PARAMETER Target
    Target directory (the SOW Calculator project root). Default: ./sow-calc

.PARAMETER Verify
    Check that all expected directories and READMEs exist, without modifying
    anything.

.EXAMPLE
    .\setup-backend-tree.ps1
    .\setup-backend-tree.ps1 -Target .\sow-calc
    .\setup-backend-tree.ps1 -Verify

.NOTES
    Companion to bootstrap.ps1. Run after B0 ratification, before B1.a starts.
    Requires PowerShell 5.1+ (Windows) or PowerShell 7+ (cross-platform).
#>

[CmdletBinding()]
param(
    [string]$Target = "./sow-calc",
    [switch]$Verify
)

$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Tree definition - keep in sync with B0 §12 (docs/B0-architecture.md)
# ---------------------------------------------------------------------------

$Directories = @(
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
    "nginx"
)

# Map of relative file path -> content. Each README is a short stub naming
# the milestone that fills the directory with real code.
$ReadmeFiles = [ordered]@{
    "backend/README.md" = @"
# backend/

FastAPI service for the SOW Cost Calculator. Stands up next to the existing
SPA in the monorepo. See ``docs/B0-architecture.md`` §12 for the full layout.

## Status

This directory is the skeleton created by ``setup-backend-tree.ps1``. The
service itself lands in **B1.a** (Hello FastAPI from Docker on EC2).

## What goes where

- ``app/`` - FastAPI source (routers, models, schemas, auth, services)
- ``alembic/`` - database migrations (B1.b onward)
- ``cleanup/`` - the project-retention cleanup utility (B1.g)
- ``tests/`` - pytest suite for the API

## Running

Not runnable yet. See ``docs/B0-architecture.md`` and the B1.a quickstart when
it ships.
"@

    "backend/alembic/README.md" = @"
# alembic/

Database migrations. Filled in **B1.b** (database + users table + bootstrap
admin).

Will contain ``env.py``, ``script.py.mako``, and one initial migration
creating the ``users`` table. Subsequent B1 sub-milestones add migrations
for ``projects``, ``project_shares``, and ``audit_entries``.

## Running migrations

After B1.b lands:

    docker compose exec backend alembic upgrade head
"@

    "backend/app/README.md" = @"
# app/

FastAPI application package. Entry point is ``main.py``, filled in **B1.a**.

## Subpackages

- ``auth/`` - authentication backends (B1.c+)
- ``api/`` - HTTP endpoint routers (B1.c+)
- ``models/`` - SQLAlchemy ORM models (B1.b+)
- ``schemas/`` - Pydantic request/response shapes (B1.c+)
- ``services/`` - business logic helpers (B1.e+)

Plus top-level modules:

- ``db.py`` - database connection + session management (B1.b)
- ``config.py`` - environment variable loading (B1.a)
- ``main.py`` - FastAPI app entry point (B1.a)
"@

    "backend/app/auth/README.md" = @"
# auth/

Authentication backends. Filled in **B1.c** (standalone) and **B3** (OIDC).

Both implementations satisfy the ``AuthBackend`` protocol. The active
backend is selected at startup via the ``AUTH_MODE`` environment variable
(``standalone`` or ``oidc``).

See ``docs/B0-architecture.md`` §3 for the architecture.
"@

    "backend/app/api/README.md" = @"
# api/

HTTP endpoint routers. Filled in **B1.c+** as each capability lands:

- ``auth.py`` - login, logout, me, change-password (B1.c)
- ``users.py`` - admin user management (B1.d)
- ``projects.py`` - project CRUD (B1.e)
- ``shares.py`` - project sharing (B1.f)
- ``transitions.py`` - status workflow (B1.g)
- ``audit.py`` - server-side audit log queries (B1.f)

Each router is a FastAPI ``APIRouter`` mounted in ``main.py``.
"@

    "backend/app/models/README.md" = @"
# models/

SQLAlchemy ORM models. Filled in **B1.b+** as each table is added:

- ``user.py`` - User (B1.b)
- ``project.py`` - Project including the ``state_json`` JSONB column (B1.e)
- ``project_share.py`` - ProjectShare (B1.f)
- ``audit_entry.py`` - AuditEntry (B1.f)

Schema is governed by the migrations in ``../alembic/versions/``; the ORM
models mirror those migrations.
"@

    "backend/app/schemas/README.md" = @"
# schemas/

Pydantic request/response models. Filled in **B1.c+** alongside the
endpoint routers in ``../api/``.

Naming convention: ``XCreate``, ``XUpdate``, ``XRead`` for input/output
variants of resource X. Separate from the SQLAlchemy ORM models in
``../models/``.
"@

    "backend/app/services/README.md" = @"
# services/

Business logic helpers that compose multiple model operations. Filled in
**B1.e+** as the workflow gets complex enough to warrant extraction from
the API routers.

Examples of what lives here once B1 is complete:

- Permission checking (combine role, share, status)
- Status transition validation (state machine enforcement)
- Audit log writes (called from every server-mediated mutation)
"@

    "backend/tests/README.md" = @"
# tests/

pytest suite for the backend API. First tests land in **B1.a** (just the
healthcheck endpoint). Each subsequent B1.x adds tests for the capability
it ships.

## Running

After B1.a lands:

    docker compose exec backend pytest
    docker compose exec backend pytest -v tests/test_auth.py
"@

    "backend/cleanup/README.md" = @"
# cleanup/

The project-retention cleanup utility. Filled in **B1.g** (status workflow
+ cleanup utility).

Separate Python process, not part of the FastAPI app. Reads a YAML config
file describing retention policies (age + status criteria) and hard-deletes
matching projects.

See ``docs/B0-architecture.md`` §6.6 for the operational design.
"@

    "nginx/README.md" = @"
# nginx/

Reverse proxy configuration. Filled in **B1.a** (Hello FastAPI from Docker
on EC2).

nginx terminates HTTPS using a pre-existing PEM certificate mounted from
the host, serves the SPA's built ``dist/`` files for non-API routes, and
proxies ``/api/*`` to the backend container.

The cert path on the host is configured via ``docker-compose.yml`` and
loaded into nginx via volume mount.

See ``docs/B0-architecture.md`` §9 for the deployment topology.
"@
}

# Directories that need a .gitkeep so git tracks them before any real
# content lands. Used for genuinely-empty directories like alembic/versions.
$GitkeepDirs = @(
    "backend/alembic/versions"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("info", "ok", "warn", "err", "new", "skip")]
        [string]$Level = "info"
    )
    $icon = switch ($Level) {
        "ok"   { "[OK] " }
        "warn" { "[!]  " }
        "err"  { "[X]  " }
        "new"  { "[+]  " }
        "skip" { "[=]  " }
        default { "     " }
    }
    $color = switch ($Level) {
        "ok"   { "Green" }
        "warn" { "Yellow" }
        "err"  { "Red" }
        "new"  { "Cyan" }
        "skip" { "DarkGray" }
        default { "Gray" }
    }
    Write-Host "$icon$Message" -ForegroundColor $color
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function New-DirIfMissing {
    param([string]$Path)
    if (Test-Path -Path $Path -PathType Container) {
        return $false
    }
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
    return $true
}

function Write-FileIfAbsent {
    param([string]$Path, [string]$Content)
    if (Test-Path -Path $Path -PathType Leaf) {
        return $false
    }
    Write-Utf8NoBom -Path $Path -Content $Content
    return $true
}

# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

function Invoke-Setup {
    param([string]$TargetPath)

    if (-not (Test-Path $TargetPath)) {
        Write-Log "target does not exist: $TargetPath" "err"
        Write-Log "create the SPA project first via the main bootstrap.ps1" "info"
        return 1
    }

    $absTarget = (Resolve-Path $TargetPath).Path
    Write-Log "Setting up backend tree under: $absTarget" "info"

    $createdDirs = 0
    $skippedDirs = 0
    foreach ($d in $Directories) {
        $full = Join-Path $TargetPath $d
        if (New-DirIfMissing -Path $full) {
            $createdDirs++
            Write-Log "created dir: $d" "new"
        } else {
            $skippedDirs++
            Write-Log "exists:      $d" "skip"
        }
    }

    $createdFiles = 0
    $skippedFiles = 0
    foreach ($key in $ReadmeFiles.Keys) {
        $full = Join-Path $TargetPath $key
        if (Write-FileIfAbsent -Path $full -Content $ReadmeFiles[$key]) {
            $createdFiles++
            Write-Log "created README: $key" "new"
        } else {
            $skippedFiles++
            Write-Log "exists:         $key" "skip"
        }
    }

    foreach ($d in $GitkeepDirs) {
        $gk = Join-Path $TargetPath "$d/.gitkeep"
        if (Write-FileIfAbsent -Path $gk -Content "") {
            $createdFiles++
            Write-Log "created .gitkeep: $d/.gitkeep" "new"
        }
    }

    Write-Log "done. $createdDirs dirs created, $skippedDirs already existed; $createdFiles files created, $skippedFiles already existed." "ok"
    Write-Log "next: ratify B0, then start B1.a." "info"
    return 0
}

function Invoke-Verify {
    param([string]$TargetPath)

    if (-not (Test-Path $TargetPath)) {
        Write-Log "target does not exist: $TargetPath" "err"
        return 1
    }
    $abs = (Resolve-Path $TargetPath).Path
    Write-Log "verifying backend tree at: $abs" "info"

    $missingDirs = @()
    foreach ($d in $Directories) {
        if (-not (Test-Path -Path (Join-Path $TargetPath $d) -PathType Container)) {
            $missingDirs += $d
        }
    }
    $missingFiles = @()
    foreach ($f in $ReadmeFiles.Keys) {
        if (-not (Test-Path -Path (Join-Path $TargetPath $f) -PathType Leaf)) {
            $missingFiles += $f
        }
    }

    if ($missingDirs.Count -eq 0 -and $missingFiles.Count -eq 0) {
        Write-Log "structure intact." "ok"
        return 0
    }

    foreach ($d in $missingDirs)  { Write-Log "missing dir:    $d" "warn" }
    foreach ($f in $missingFiles) { Write-Log "missing README: $f" "warn" }
    Write-Log "run without -Verify to repair." "info"
    return 1
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if ($Verify) {
    exit (Invoke-Verify -TargetPath $Target)
}

exit (Invoke-Setup -TargetPath $Target)
