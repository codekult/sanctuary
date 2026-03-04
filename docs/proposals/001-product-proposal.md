# Sanctuary — Biodiversity Tracking Platform

## Project Summary

A platform to catalogue and track living species within a single property. Combines long-term individual monitoring, phenology tracking (flowering, nesting, lifecycle events), and species cataloguing following established biodiversity standards (Darwin Core-aligned).

**Goals**: Personal use, portfolio piece, open for adoption by others.

---

## Discovery Summary

| Decision            | Choice                                                             |
| ------------------- | ------------------------------------------------------------------ |
| Species scope       | All kingdoms (plants, animals, fungi, insects)                     |
| Area scope          | Single property with pin-based locations                           |
| Individual tracking | Long-term monitoring + notable specimens + phenology               |
| Public access       | Fully public — anyone can browse                                   |
| Mobile usage        | Dual-mode: quick capture + full field entry                        |
| Standards           | Darwin Core-aligned internally; GBIF export as future nice-to-have |
| Taxonomy source     | Hybrid: API lookup (GBIF/iNaturalist) + manual entry               |
| Users               | Multi-admin (small team of contributors)                           |
| Phenology           | Custom/flexible event type system                                  |
| Maps                | Pin markers on property                                            |
| Adoption model      | Build for self first, architect for extensibility                  |
| Images              | Cloud storage (S3-compatible)                                      |
| Deployment          | Vercel + managed Postgres                                          |
| Timeline            | Ongoing project, no deadline pressure                              |
| Tech stack          | TypeScript full-stack                                              |

---

## Modules

### 1. Backoffice (Web — Admin)

Manage all data. Restricted to authenticated admins/contributors.

- **Taxa management**: Search external APIs (GBIF backbone) to import species data, or create manually. Edit taxonomy, common names, descriptions.
- **Individuals registry**: Create and manage individual organisms. Assign a taxon, nickname, location pin, status (alive/dead/unknown), notes.
- **Observations log**: Record sightings tied to a taxon and optionally to an individual. Date, time, location, observer, photos, notes.
- **Phenology events**: Log lifecycle events on individuals or species (custom event types per species group — e.g., "flowering" for plants, "nesting" for birds).
- **Media management**: Upload, tag, and organize photos. Linked to observations or individuals.
- **Property map**: Interactive map with pins for individuals. Click a pin to see history.
- **Dashboard**: Recent activity, species count, observation stats, upcoming phenology (e.g., "expected flowering this month based on last year").
- **Data import**: Bulk import from CSV/spreadsheet (for migrating existing notes).
- **User management**: Invite contributors, assign roles.

### 2. Public Library (Web — Read-only)

A public-facing catalogue for browsing the property's biodiversity.

- **Species catalogue**: Browse by kingdom, family, or search. Each species page shows taxonomy, description, photos, and linked individuals.
- **Individual profiles**: Timeline/history of an individual organism — observations over time, photo gallery, phenology timeline.
- **Observation feed**: Chronological or filtered feed of all observations.
- **Phenology calendar**: Visual calendar showing when species flower, fruit, nest, etc. across the year.
- **Search & filter**: By species, date range, location zone, phenology event, observer.
- **Photo gallery**: Browse all media, filterable.
- **Property overview**: Map view, biodiversity stats, species count by group.

### 3. Mobile App (Field Recording)

For use in the field when observing species.

- **Quick capture mode**: Tap to photograph, GPS auto-tags, minimal input. Details can be completed later from the backoffice.
- **Full entry mode**: Select/search taxon, pick or create individual, log phenology event, add notes — all from the phone.
- **Offline support**: Queue observations locally when there's no signal; sync when connectivity returns.
- **Recent taxa shortcut**: Quick access to recently observed species.
- **Camera integration**: Multi-photo capture per observation.

### 4. Blog (Deferred — Third-party)

Automated or semi-automated journal entries. Lowest priority, to be integrated later.

- Trigger-based posts: "New species recorded", "First flowering of the season", "Annual summary".
- Could integrate with a headless CMS or use a simple built-in post system.

---

## Data Model (Core Entities)

### Taxon

The species (or higher-rank) reference record. Sourced from external APIs or created manually.

| Field              | Type     | Required | Notes                                           |
| ------------------ | -------- | -------- | ----------------------------------------------- |
| id                 | UUID     | yes      | Internal ID                                     |
| scientificName     | string   | yes      | Full scientific name (e.g., "Quercus robur L.") |
| commonName         | string   | no       | Vernacular name                                 |
| taxonRank          | enum     | yes      | species, genus, family, etc.                    |
| kingdom            | string   | yes      | Animalia, Plantae, Fungi, etc.                  |
| phylum             | string   | no       |                                                 |
| class              | string   | no       |                                                 |
| order              | string   | no       |                                                 |
| family             | string   | no       |                                                 |
| genus              | string   | no       |                                                 |
| specificEpithet    | string   | no       | Species part of binomial                        |
| externalId         | string   | no       | GBIF taxonKey or iNaturalist taxon ID           |
| externalSource     | string   | no       | "gbif", "inaturalist", "manual"                 |
| description        | text     | no       | Rich text description                           |
| conservationStatus | string   | no       | IUCN status if applicable                       |
| thumbnailUrl       | string   | no       | Representative image                            |
| createdAt          | datetime | yes      |                                                 |
| updatedAt          | datetime | yes      |                                                 |

### Individual

A specific organism being tracked over time.

| Field             | Type     | Required | Notes                                                   |
| ----------------- | -------- | -------- | ------------------------------------------------------- |
| id                | UUID     | yes      |                                                         |
| taxonId           | UUID     | yes      | FK to Taxon                                             |
| nickname          | string   | no       | Human-friendly label ("The Old Oak")                    |
| description       | text     | no       | Notes about this individual                             |
| latitude          | decimal  | no       | Pin location                                            |
| longitude         | decimal  | no       | Pin location                                            |
| firstObservedDate | date     | no       | When first recorded                                     |
| status            | enum     | yes      | alive, dead, unknown, removed                           |
| sex               | enum     | no       | male, female, unknown                                   |
| markers           | text     | no       | How to identify this individual (tags, marks, features) |
| createdAt         | datetime | yes      |                                                         |
| updatedAt         | datetime | yes      |                                                         |

### Observation

A specific sighting event.

| Field              | Type     | Required | Notes                                |
| ------------------ | -------- | -------- | ------------------------------------ |
| id                 | UUID     | yes      |                                      |
| taxonId            | UUID     | yes      | FK to Taxon                          |
| individualId       | UUID     | no       | FK to Individual (optional)          |
| observerId         | UUID     | yes      | FK to User                           |
| observedAt         | datetime | yes      | When the observation happened        |
| latitude           | decimal  | no       | GPS coordinates                      |
| longitude          | decimal  | no       |                                      |
| coordinateAccuracy | integer  | no       | Meters — from GPS precision          |
| description        | text     | no       | Field notes                          |
| individualCount    | integer  | no       | Number observed (null = not counted) |
| lifeStage          | enum     | no       | egg, larva, juvenile, adult, etc.    |
| status             | enum     | yes      | draft, published                     |
| createdAt          | datetime | yes      |                                      |
| updatedAt          | datetime | yes      |                                      |

### PhenologyEvent

Lifecycle events tied to an individual or an observation.

| Field         | Type     | Required | Notes                       |
| ------------- | -------- | -------- | --------------------------- |
| id            | UUID     | yes      |                             |
| individualId  | UUID     | no       | FK to Individual            |
| observationId | UUID     | no       | FK to Observation           |
| eventTypeId   | UUID     | yes      | FK to PhenologyEventType    |
| observedAt    | date     | yes      | When the event was observed |
| notes         | text     | no       |                             |
| createdAt     | datetime | yes      |                             |

### PhenologyEventType

User-defined lifecycle event types.

| Field     | Type   | Required | Notes                                    |
| --------- | ------ | -------- | ---------------------------------------- |
| id        | UUID   | yes      |                                          |
| name      | string | yes      | "Flowering", "Fruiting", "Nesting", etc. |
| appliesTo | enum   | no       | Kingdom or taxon group this applies to   |
| color     | string | no       | For calendar visualization               |
| icon      | string | no       | Icon identifier                          |

### Media

Photos (and potentially audio/video) linked to observations or individuals.

| Field         | Type     | Required | Notes               |
| ------------- | -------- | -------- | ------------------- |
| id            | UUID     | yes      |                     |
| observationId | UUID     | no       | FK to Observation   |
| individualId  | UUID     | no       | FK to Individual    |
| url           | string   | yes      | Cloud storage URL   |
| thumbnailUrl  | string   | no       | Resized version     |
| type          | enum     | yes      | image, audio, video |
| caption       | string   | no       |                     |
| takenAt       | datetime | no       | EXIF date or manual |
| sortOrder     | integer  | no       | Display ordering    |
| createdAt     | datetime | yes      |                     |

### User

Platform administrators and contributors.

| Field     | Type     | Required | Notes              |
| --------- | -------- | -------- | ------------------ |
| id        | UUID     | yes      |                    |
| email     | string   | yes      |                    |
| name      | string   | yes      |                    |
| role      | enum     | yes      | admin, contributor |
| avatarUrl | string   | no       |                    |
| createdAt | datetime | yes      |                    |

### Property

The tracked area (single for now, extensible to multiple).

| Field       | Type    | Required | Notes                      |
| ----------- | ------- | -------- | -------------------------- |
| id          | UUID    | yes      |                            |
| name        | string  | yes      |                            |
| description | text    | no       |                            |
| latitude    | decimal | yes      | Center point               |
| longitude   | decimal | yes      |                            |
| timezone    | string  | yes      | For phenology calculations |

---

## Technical Architecture

### Stack

| Layer             | Technology                       | Rationale                                                                |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------ |
| **Web app**       | Next.js 15 (App Router)          | Full-stack TS, SSR for public pages (SEO), server actions for backoffice |
| **Mobile app**    | React Native + Expo              | Shared TS codebase, EAS for builds, offline-first with local SQLite      |
| **Database**      | PostgreSQL via Supabase          | Managed, generous free tier, built-in auth, storage, realtime            |
| **ORM**           | Drizzle ORM                      | Type-safe, lightweight, good DX with Postgres                            |
| **Auth**          | Supabase Auth                    | Multi-admin with invite flow, JWT-based                                  |
| **Image storage** | Supabase Storage (S3-compatible) | Co-located with DB, automatic image transforms                           |
| **Maps**          | Leaflet + OpenStreetMap          | Free, no API key needed, good enough for pin markers                     |
| **API layer**     | Next.js API routes + tRPC        | Type-safe end-to-end, shared types between web and mobile                |
| **Validation**    | Zod                              | Shared schemas between client and server                                 |
| **Deployment**    | Vercel (web) + EAS (mobile)      | Zero-config for Next.js, managed builds for mobile                       |
| **Monorepo**      | Turborepo                        | Shared packages (types, validation, API client) between web and mobile   |

### Project Structure (Monorepo)

```
sanctuary/
  apps/
    web/              # Next.js — backoffice + public library
    mobile/           # React Native + Expo — field recording app
  packages/
    db/               # Drizzle schema, migrations, seed
    api/              # tRPC router definitions (shared between web + mobile)
    types/            # Shared TypeScript types & Zod schemas
    ui/               # Shared UI components (if applicable)
  tooling/
    eslint/           # Shared ESLint config
    typescript/       # Shared tsconfig
```

---

## Development Phases

### Phase 1 — Foundation

- Monorepo setup (Turborepo)
- Database schema (Drizzle + Supabase)
- Auth setup (Supabase Auth, invite-only admin)
- tRPC API scaffolding
- Seed data: import a few taxa from GBIF API

### Phase 2 — Backoffice MVP

- Taxa CRUD (search GBIF + manual entry)
- Individuals CRUD (assign taxon, pin on map, add photos)
- Observations CRUD (log sightings, attach to individuals)
- Media upload (Supabase Storage)
- Basic property map with pins (Leaflet)
- Dashboard with counts and recent activity

### Phase 3 — Public Library

- Species catalogue pages (SSR for SEO)
- Individual profile pages with observation timeline
- Observation feed with filters
- Photo gallery
- Search (full-text via Postgres)
- Property overview with map

### Phase 4 — Phenology System

- Custom event type management
- Log phenology events on individuals/observations
- Phenology calendar visualization (year view)
- "Expected this month" based on historical data

### Phase 5 — Mobile App

- Expo project setup
- Quick capture mode (camera + GPS + draft observation)
- Full entry mode (taxon search, individual selection, phenology)
- Offline queue with sync
- Auth flow

### Phase 6 — Polish & Portfolio

- Data import from CSV
- Darwin Core-aligned export
- Performance optimization
- Responsive design audit
- README, documentation, demo data
- Open source release prep

### Phase 7 — Blog (Deferred)

- Evaluate integration options (headless CMS, built-in, or third-party)
- Trigger-based automated post drafts
- Manual editorial control

---

## Resolved Questions

1. **Taxonomy authority**: iNaturalist as primary source — better common names, photos, and UX. Fall back to manual entry for gaps.
2. **Location privacy**: All coordinates obscured from public view. Admins see exact pins; public sees the property name and species data but no GPS positions. This is a privacy decision — the property is the owner's home.
3. **Multilingual**: Bilingual — English and Spanish. Common species names stored in both languages (iNaturalist provides multilingual names). UI in both languages.
4. **Notifications**: None for MVP. Contributors check the dashboard. Keep it simple.
5. **Data backup/export**: Rely on Supabase's built-in daily backups for now. No custom export pipeline in MVP.
