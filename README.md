# Running Performance Coach

A personal running performance platform powered by Garmin activity data. The backend is designed to ingest, validate, normalize, and persist activity data as the foundation for future performance analysis and personalized running coaching.

> **Development status:** Backend foundation and Garmin activity ingestion are implemented. The project is currently in the backend integration stage.

## Overview

Running Performance Coach aims to help track running progress and support data-driven training decisions using personal Garmin activity history.

The planned platform consists of:

- **Backend:** Activity ingestion, data persistence, performance analysis, and coaching logic.
- **Web Dashboard:** Activity history, performance trends, and race goal analysis.
- **Telegram Bot:** Quick access to training information and progress.
- **AI Coaching:** Explanations and recommendations grounded in activity history, goals, and user feedback.

The current implementation focuses on the backend foundation and Garmin activity ingestion. Future capabilities are not considered implemented until their respective development stages are completed.

## Technology Stack

| Component | Technology |
|---|---|
| Backend Framework | NestJS |
| Language | TypeScript |
| Runtime | Node.js |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Database Adapter | `@prisma/adapter-pg` |
| Activity Source | Garmin Connect Personal API |
| Testing | Jest |
| Containerization | Docker Compose |

## Current Implementation

### Backend Foundation

- NestJS application structure.
- PostgreSQL database running through Docker Compose.
- Prisma 7 database integration.
- Environment-based configuration.
- Database connectivity health check.

### Garmin Integration

- Garmin Personal API authentication.
- Garmin activity API client.
- Activity pagination.
- Runtime payload validation.
- Activity normalization.
- Activity persistence to PostgreSQL.
- Duplicate prevention using database uniqueness constraints.
- Synchronization run tracking.
- Synchronization status and activity count recording.

### Data Integrity

- Invalid activity payloads are rejected and skipped.
- Missing optional metrics are stored as `null`, not artificially converted to zero.
- Duplicate external activities are skipped.
- User and external connection ownership are enforced through database relations.
- Only selected activity fields are persisted; raw GPS and unnecessary personal payload fields are not stored.

### Current Limitations

- Activity persistence is currently insert-only. Existing activities are not updated.
- Synchronization is implemented as a backend service, but no production HTTP endpoint or scheduled trigger is available yet.
- Garmin ingestion currently retrieves activity history through pagination; it is not yet an incremental API fetch based on the last synchronization timestamp.
- Activity types are stored using their Garmin sport type. Running-specific filtering and performance calculations belong to subsequent development stages.
- Web dashboard, Telegram integration, and AI coaching are not implemented yet.

## Prerequisites

Ensure the following tools are installed:

- Node.js (tested with v24.14.1)
- npm
- Docker Desktop
- Git
- Garmin Personal API access and a valid API key

## Project Setup

Clone the repository:

```bash
git clone https://github.com/gungdeari/AI-running-performance-coach.git
cd AI-running-performance-coach
```

Install dependencies:

```bash
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Configure the required environment variables in `.env`:

```dotenv
# PostgreSQL / Docker
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=running_performance_coach
POSTGRES_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE

# Prisma
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/DATABASE

# Garmin Personal API
GARMIN_PERSONAL_API_KEY=your_garmin_personal_api_key
```

Use matching PostgreSQL credentials in `POSTGRES_URL` and `DATABASE_URL`.

**Security:** Never commit `.env` or expose Garmin API credentials. The `.env.example` file contains placeholders only.

## Database Setup

Start PostgreSQL using Docker Compose:

```bash
docker compose up -d
```

Check the container status:

```bash
docker compose ps
```

Generate the Prisma Client:

```bash
npx prisma generate
```

Apply the existing database migrations:

```bash
npx prisma migrate deploy
```

Check migration status:

```bash
npx prisma migrate status
```

The application uses PostgreSQL as its persistent data store.

## Running the Application

Start in development mode:

```bash
npm run start:dev
```

Build the application:

```bash
npm run build
```

Start the compiled application:

```bash
npm run start:prod
```

### Database Health Check

The backend provides a database connectivity endpoint:

```http
GET /health/database
```

A successful response:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Garmin Synchronization

Garmin synchronization is currently orchestrated through `GarminSyncService`.

The implemented flow is:

```text
Garmin Personal API
        |
        v
Garmin Authentication
        |
        v
Activity API & Pagination
        |
        v
Payload Validation
        |
        v
Activity Normalization
        |
        v
Activity Persistence
        |
        v
PostgreSQL
        |
        v
Sync Run Result
```

Each synchronization run records its status and activity counts.

Supported synchronization statuses:

- `RUNNING`
- `SUCCEEDED`
- `PARTIAL`
- `FAILED`

The service verifies the user's active Garmin connection before synchronization.

**Note:** The synchronization service has been verified against the real Garmin Personal API. A production endpoint or scheduler to trigger synchronization has not yet been implemented.

## Testing

Run unit and module tests:

```bash
npm test -- --runInBand
```

Run database integration tests:

```bash
npm run test:integration
```

Build the application:

```bash
npm run build
```

Check production dependency vulnerabilities:

```bash
npm audit --omit=dev
```

Integration tests require a reachable PostgreSQL database configured through `DATABASE_URL`.

## Development Progress

| Stage | Description | Status |
|---|---|---|
| 00 | Project Baseline & Governance | Approved |
| 01 | Architecture & Technology Stack | Approved |
| 02 | Database Design & API Contract | Approved |
| 03 | Garmin Integration & Activity Ingestion | In progress |
| 04 | Performance Metrics Engine | Planned |
| 05 | Coaching Specification & Training Engine | Planned |
| 06 | Feedback, Strength Training & Goals | Planned |
| 07 | Web Application & Dashboard | Planned |
| 08 | Telegram Bot Integration | Planned |
| 09 | Testing, Deployment & Final Integration | Planned |

## Project Structure

```text
src/
├── garmin/
│   ├── garmin-auth.service.ts
│   ├── garmin-api.client.ts
│   ├── garmin-pagination.service.ts
│   ├── garmin-activity.validator.ts
│   ├── garmin-activity.normalizer.ts
│   ├── garmin-activity.parser.ts
│   ├── garmin-sync.service.ts
│   ├── activity-persistence.service.ts
│   ├── garmin.types.ts
│   ├── garmin.module.ts
│   └── *.spec.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── app.controller.ts
├── app.controller.spec.ts
├── app.service.ts
├── app.module.ts
└── main.ts

prisma/
├── schema.prisma
└── migrations/

test/
└── jest-integration.json
```

## Development Principles

- Keep the implementation aligned with the approved project scope.
- Prefer deterministic and testable business logic.
- Preserve data integrity and explicit user ownership.
- Avoid unsupported performance or health-related claims.
- Keep sensitive credentials and personal activity data secure.
- Introduce new features only when required by the approved development roadmap.

## License

This project is developed as a personal running performance and coaching platform.