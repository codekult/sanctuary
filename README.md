# Sanctuary

Biodiversity tracking platform for cataloguing and monitoring living species within a property. Darwin Core-aligned data standards.

## Prerequisites

- [Bun](https://bun.sh) >= 1.3
- [Supabase](https://supabase.com) project (Postgres, Auth, Storage)

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Install dependencies:

```bash
bun install
```

4. Push the database schema:

```bash
bun run db:push
```

5. Seed the database with sample data:

```bash
bun run seed
```

6. Start the development server:

```bash
bun run dev
```

## Project Structure

```
sanctuary/
  apps/
    web/              # Next.js 15 (App Router) — backoffice + public library
    mobile/           # React Native + Expo — field recording app (shell)
  packages/
    db/               # Drizzle ORM schema, migrations, seed
    api/              # tRPC router definitions
    types/            # Shared Zod schemas & TypeScript types
    i18n/             # Internationalization (EN/ES)
  tooling/
    eslint/           # Shared ESLint config
    typescript/       # Shared TypeScript config
```

## Commands

| Command | Description |
|---|---|
| `bun run dev` | Start all apps in development mode |
| `bun run build` | Build all packages and apps |
| `bun run typecheck` | Type-check all packages |
| `bun run lint` | Lint all packages |
| `bun run db:generate` | Generate Drizzle migration |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |
| `bun run seed` | Seed database with sample data |

## Tech Stack

- **Runtime**: Bun
- **Monorepo**: Turborepo
- **Web**: Next.js 15 (App Router)
- **Mobile**: React Native + Expo
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM
- **API**: tRPC
- **Auth**: Supabase Auth
- **Validation**: Zod
- **Languages**: English + Spanish (bilingual)
