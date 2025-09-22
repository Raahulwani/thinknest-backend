# ThinkNest Backend — Jury Starter (Node.js + TypeScript + TypeORM + PostgreSQL)

A minimal, modular backend ready to serve a **Jury** module and scale with future features.

## Quick Start

1. **Create database (PostgreSQL)**
   ```sql
   CREATE DATABASE thinknest;
   ```

2. **Copy env**
   ```bash
   cp .env.example .env
   # edit DATABASE_URL / PORT as needed
   ```

3. **Install deps**
   ```bash
   npm install
   ```

4. **Run (dev)**
   ```bash
   npm run dev
   ```

   Health check: open `http://localhost:4000/health`

5. **Seed sample data (optional)**
   ```bash
   npm run seed
   ```

## API

Base path: `/api/v1/jury`

- `GET /api/v1/jury` — list with filters/search/sort/pagination  
  Query params: `year`, `years=2023,2024`, `search`, `department`, `expertise`, `role`, `sort=name_asc|name_desc|role_asc|role_desc|department_asc|department_desc`, `page`, `limit`, `groupBy=year`

- `GET /api/v1/jury/grouped?years=2023,2024` — grouped by year

- `GET /api/v1/jury/years` — available years + counts

- `GET /api/v1/jury/expertises` — list of expertise tags

- `GET /api/v1/jury/:id` — member detail

## Structure

```
src/
  app.ts
  server.ts
  config/
    env.ts
    data-source.ts
    logger.ts (placeholder)
  routes/
    v1.ts
  common/
    middlewares/
      error.middleware.ts
      notFound.middleware.ts
    utils/
      pagination.ts
      sort.ts
    types/
      http.ts
  modules/
    jury/
      dto/
        query.schema.ts
      entities/
        expertise.entity.ts
        jury-member.entity.ts
        jury-assignment.entity.ts
      jury.service.ts
      jury.controller.ts
      jury.routes.ts
  db/
    seed/seed.ts
    migrations/ (empty; use TypeORM CLI in prod)
```

> In development, the data source uses `synchronize: true` to avoid migrations. For production, set `synchronize: false` and generate TypeORM migrations.
