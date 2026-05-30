# tests/

pytest suite for the backend API. First tests land in **B1.a** (just the
healthcheck endpoint). Each subsequent B1.x adds tests for the capability
it ships.

## Running

After B1.a lands:

    docker compose exec backend pytest
    docker compose exec backend pytest -v tests/test_auth.py