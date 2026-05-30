# cleanup/

The project-retention cleanup utility. Filled in **B1.g** (status workflow
+ cleanup utility).

Separate Python process, not part of the FastAPI app. Reads a YAML config
file describing retention policies (age + status criteria) and hard-deletes
matching projects.

See `docs/B0-architecture.md` Â§6.6 for the operational design.