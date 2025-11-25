# Production Readiness Checklist

## Environment Configuration
- Ensure all necessary environment variables are set as outlined in `app/src/lib/env.ts`. Refer to the list below:
  - `DB_URI`
  - `API_KEY`
  - `NODE_ENV`
  - Add others as applicable.

## Database Migrations
- Run all necessary database migrations using the migration tool.

## Climate Data Seeding
- Seed climate data as needed for application functionality.

## Running Tests
- Execute all tests to ensure system reliability:
  ```
  npm test
  ```

## Running Lighthouse CI
- Run Lighthouse CI to assess performance and accessibility:
  ```
  lighthouse-ci
  ```

---