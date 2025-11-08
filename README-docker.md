# Docker Development Environment

This project ships with a Docker-based PostgreSQL stack for local development.

## Prerequisites

- Docker Desktop or compatible runtime
- pnpm (for application commands)

## Configuration

1. Copy `.env.example` to `.env` and update the values as needed:
   ```bash
   cp .env.example .env
   ```
2. Optional: copy `app/.env.example` to `app/.env.local` for Prisma scripts.

## Services

| Service   | Description                     | Port |
|-----------|---------------------------------|------|
| postgres  | PostgreSQL 16 primary database  | 5432 |
| pgadmin   | pgAdmin web UI (optional)       | 5050 |

## Usage

Start the stack:
```bash
pnpm docker:up
```

Stop the stack:
```bash
pnpm docker:down
```

Follow logs for Postgres:
```bash
pnpm docker:logs
```

## Migrations & Seeding

After containers are healthy:
```bash
cd app
pnpm db:push
pnpm db:seed
```

## Cleanup

To remove containers and volumes:
```bash
pnpm docker:destroy
```
