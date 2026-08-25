*This project was created as part of the 42 curriculum by lkoh, lwin, pzaw, tyingchu, and ylai.*

# ft_transcendence

An education platform foundation for shared Tutor and Student workflows. The current codebase contains a Next.js frontend, Spring Boot authentication, grading/OCR, and learning-data services, plus PostgreSQL migrations for users, classes, schedules, canonical student profiles, and class memberships.

## Current foundation (Issues 01–07)

- Email/password authentication with BCrypt, signed JWTs, and distinct `TUTOR`/`STUDENT` authorities.
- Public Student registration; clients cannot self-assign the Tutor role.
- Role-aware protected frontend shell with logout and responsive navigation.
- Flyway-managed, service-isolated PostgreSQL schemas; Hibernate validates and never mutates production tables.
- Tutor-owned class and canonical student-profile entities, constraints, repositories, and migration tests.
- Grading and learning services independently verify auth-service identity claims.
- Unit, integration, security, H2 migration, and optional real-PostgreSQL Testcontainers coverage.
- A complete Compose topology for frontend, three backend services, PostgreSQL, and Adminer.

Class/student HTTP APIs and screens, worksheet generation, grading approval orchestration, and later product workflows are intentionally outside Issues 01–07. See [service boundaries](docs/architecture/service-boundaries.md) before adding them.

## Prerequisites

For the container workflow, install Docker Desktop/Engine with Compose v2. For direct local builds, install Node.js 20, npm, and a complete JDK 17 containing `javac`; a Java runtime alone cannot compile the backend. The full inventory is in [DEPENDENCIES.md](DEPENDENCIES.md).

## Configure and run

```bash
cp .env.example .env
```

Replace every `change-me` value in `.env`. `JWT_SECRET` must contain at least 32 random bytes. Then validate and start the whole stack:

```bash
docker compose config --quiet
docker compose up --build
```

Open the frontend at `http://localhost:3000`, Adminer at `http://localhost:8080`, and health probes at ports 8081–8083 under `/actuator/health`.

There are no shared default login credentials. Student accounts are created through `/signup`. To provision the first Tutor, set all three `BOOTSTRAP_TUTOR_*` values for one startup; the password is validated and BCrypt-hashed, existing Tutor credentials are never reset, and public signup still rejects `TUTOR`. Clear the bootstrap values after the account has been created.

The Compose database volume is persistent. Because the service schemas were isolated during the Issue 03 foundation, reset only disposable pre-migration development data before first use if an older database volume contains tables in `public`.

## Build and test locally

Install locked JavaScript dependencies:

```bash
npm ci
npm --prefix frontend ci
```

Run all checks:

```bash
npm run verify
```

Individual commands are available as `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:integration`, and `npm run build`. PostgreSQL Testcontainers checks run when Docker is available and are skipped explicitly when it is not; deterministic H2 migration tests always run.

To validate Compose without copying a real environment file:

```bash
npm run compose:config
```

## Database ownership

The services share one PostgreSQL instance while owning separate schemas:

- `auth`: accounts and role identity.
- `grading`: submissions, OCR, and advisory marking data.
- `learning`: classes, schedules, student profiles, and memberships.

Flyway owns every schema change and stores independent history in each service schema. Cross-service relationships use stable auth `userId` values rather than unsafe database foreign keys between services.
