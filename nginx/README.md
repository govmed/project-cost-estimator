# nginx/

Reverse proxy configuration. Filled in **B1.a** (Hello FastAPI from Docker
on EC2).

nginx terminates HTTPS using a pre-existing PEM certificate mounted from
the host, serves the SPA's built `dist/` files for non-API routes, and
proxies `/api/*` to the backend container.

The cert path on the host is configured via `docker-compose.yml` and
loaded into nginx via volume mount.

See `docs/B0-architecture.md` Â§9 for the deployment topology.