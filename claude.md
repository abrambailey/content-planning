# Project Guidelines

## Database Queries

**IMPORTANT: Always use the `mcp__postgres__query` tool for local database schema inspection and queries. Do NOT use `mcp__supabase__execute_sql` as that connects to production.**

- Use `mcp__postgres__query` to check table structures, run test queries, and debug locally
- The postgres MCP is connected to the local Supabase instance

## Supabase Migrations

**IMPORTANT: Always use the Supabase CLI for database migrations. Never apply migrations directly via MCP tools or raw SQL execution.**

### Creating Migrations

1. Use the Supabase CLI to create new migration files:
   ```bash
   npx supabase migration new <migration_name>
   ```

2. Edit the generated file in `supabase/migrations/` with your SQL

3. Apply migrations locally:
   ```bash
   npx supabase db reset
   ```
   or
   ```bash
   npx supabase migration up
   ```

### Rules

- **DO NOT** use `mcp__supabase__apply_migration` to run migrations directly
- **DO NOT** execute DDL statements directly against the database
- **ALWAYS** create a migration file first, then apply it through the CLI
- Migration files ensure version control, reproducibility, and proper tracking
- **NEVER** reset the local database (`supabase db reset`, `make db-reset`, `make db-pull-data`) without explicit user permission - this destroys local data
- **NEVER** use `--include-all` flag with `supabase migration up`. If you see "Found local migration files to be inserted before the last migration", this indicates a migration ordering problem. Fix it by:
  1. Checking if the migration timestamp is earlier than existing migrations
  2. Renaming the migration file with a newer timestamp if needed
  3. Investigating if there's a sync issue between local and remote migration history
