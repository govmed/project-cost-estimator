# alembic/

Database migrations. Filled in **B1.b** (database + users table + bootstrap
admin).

Will contain `env.py`, `script.py.mako`, and one initial migration
creating the `users` table. Subsequent B1 sub-milestones add migrations
for `projects`, `project_shares`, and `audit_entries`.

## Running migrations

After B1.b lands:

    docker compose exec backend alembic upgrade head