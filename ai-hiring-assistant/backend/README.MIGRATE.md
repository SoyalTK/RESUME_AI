Migration instructions
----------------------

Two options to create the required tables in Supabase Postgres:

1) Run locally (requires network access to Supabase Postgres)

  - Ensure `.env` in the backend has `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT` set. Example:

    PGHOST=db.gcgvawrzyrkzmchnsdrm.supabase.co
    PGPORT=5432
    PGDATABASE=postgres
    PGUSER=postgres
    PGPASSWORD=<your-db-password-or-service-role-key>

  - Run:

    cd backend
    node migrate.js

2) Use Supabase SQL editor (recommended if you can't connect directly)

  - Open your Supabase project → SQL → New query
  - Paste the SQL from `migrations/001_create_tables.sql` and run it

Notes
 - If `node migrate.js` fails with DNS errors, run the SQL in the Supabase SQL editor.
 - Prefer using the Supabase UI for schema changes to avoid exposing service-role keys locally.
