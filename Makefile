.PHONY: help dev db-pull-data db-reset db-push db-status

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start local development server
	pnpm dev

# Database commands
db-pull-data: ## Pull data from remote Supabase to local database
	@echo "Dumping data from remote database..."
	supabase db dump --data-only -f /tmp/remote_data.sql
	@echo "Resetting local database and applying migrations..."
	supabase db reset
	@echo "Restoring data to local database..."
	psql postgresql://postgres:postgres@127.0.0.1:54354/postgres -f /tmp/remote_data.sql
	@rm /tmp/remote_data.sql
	@echo "Done! Local database synced with remote data."

db-reset: ## Reset local database (applies migrations, no data)
	supabase db reset

db-push: ## Push local migrations to remote database
	supabase db push

db-status: ## Show local Supabase status
	supabase status
