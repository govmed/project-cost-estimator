# services/

Business logic helpers that compose multiple model operations. Filled in
**B1.e+** as the workflow gets complex enough to warrant extraction from
the API routers.

Examples of what lives here once B1 is complete:

- Permission checking (combine role, share, status)
- Status transition validation (state machine enforcement)
- Audit log writes (called from every server-mediated mutation)