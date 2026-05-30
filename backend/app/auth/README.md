# auth/

Authentication backends. Filled in **B1.c** (standalone) and **B3** (OIDC).

Both implementations satisfy the `AuthBackend` protocol. The active
backend is selected at startup via the `AUTH_MODE` environment variable
(`standalone` or `oidc`).

See `docs/B0-architecture.md` Â§3 for the architecture.