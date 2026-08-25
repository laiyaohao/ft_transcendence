# Build and Container Dependency Inventory

This file records the dependencies required to build, test, and run the repository. It is derived from the checked-in Dockerfiles, Compose file, npm lockfiles, Maven POMs, and Maven wrapper configuration.

Do not install Java or npm transitive libraries individually in an image. Maven resolves Java dependencies from the Spring Boot BOM and the POM files; `npm ci` resolves the exact JavaScript dependency graph from the lockfiles.

## 1. Host requirements

Only the following host software is required when the complete project is built through Docker:

| Dependency | Required version | Purpose |
| --- | --- | --- |
| Docker Engine or Docker Desktop | Current version with BuildKit | Builds and runs all images. |
| Docker Compose | Compose v2 (`docker compose`) | Starts the application stack. |
| Git | Any current version | Checks out the repository. Not required inside runtime images. |

The build host must be able to reach:

- Docker Hub for base images.
- Maven Central for Java dependencies.
- The npm registry for frontend dependencies.
- The configured AI provider at runtime for grading and OCR.

## 2. Local non-container development requirements

These are required only when commands such as `npm test` are run directly on the host:

| Dependency | Required version | Notes |
| --- | --- | --- |
| Node.js | 20.x | Matches `frontend/Dockerfile`. |
| npm | Version bundled with Node 20 | Must support lockfile version 3 and `npm ci`. |
| JDK | 17 | A full JDK containing `javac` is required; a JRE is insufficient. |
| POSIX shell | `/bin/sh` compatible | Required by both Maven wrapper scripts. |
| `curl` or `wget` | Any current version | Used by Maven Wrapper if Maven is not cached. |

Maven does not need to be installed globally. The repository wrappers download these versions:

- Auth service: Apache Maven 3.9.15.
- Grading service: Apache Maven 3.9.16.

Install JavaScript dependencies with:

```bash
npm ci
npm --prefix frontend ci
```

## 3. Container base images

### Frontend

| Stage | Required image | Included tooling |
| --- | --- | --- |
| Build | `node:20-alpine` | Node.js 20, npm, Alpine Linux/musl. |
| Runtime | `node:20-alpine` | Node.js 20 and the libraries required by Next.js standalone output. |

The frontend lockfile includes Linux musl binaries for Next.js SWC and Sharp, including x64 and ARM64 variants. No additional Alpine build packages are currently required by the locked dependency graph.

The build stage must run `npm ci`, not `npm ci --only=production`, because `next build` requires TypeScript and type packages stored under `devDependencies`. The standalone runtime stage does not need `node_modules` copied from the builder.

### Auth service

| Stage | Required image | Included tooling |
| --- | --- | --- |
| Build | `maven:3.9-eclipse-temurin-17` | Maven 3.9 and a complete Temurin JDK 17. |
| Runtime | `eclipse-temurin:17-jre` | Temurin Java 17 runtime only. |

### Grading service

The grading service requires the same image types as the auth service:

- Build: Maven 3.9 with Temurin JDK 17.
- Runtime: Temurin Java 17 JRE.

There is currently no `backend/grading-service/Dockerfile`; one must be added before this service can be built by Compose.

### Infrastructure

| Service | Current image | Requirement |
| --- | --- | --- |
| PostgreSQL | `postgres:latest` | Runtime database and `pg_isready` health check. Pin a tested PostgreSQL major version before deployment. |
| Adminer | `adminer` | Optional database administration UI. Pin a tested image version before deployment. |

No standalone OCR executable is currently required. OCR and grading are HTTP calls to the configured external AI provider.

## 4. Frontend direct dependencies

Exact versions below come from `frontend/package-lock.json`.

### Production and build runtime

| Package | Locked version | Purpose |
| --- | ---: | --- |
| `next` | 16.2.6 | Web framework and standalone server build. |
| `react` | 19.2.4 | UI runtime. |
| `react-dom` | 19.2.4 | DOM renderer. |
| `@mui/material` | 9.1.1 | Component and styling framework. |
| `@mui/icons-material` | 9.1.1 | UI icon set. |
| `@mui/material-nextjs` | 9.1.1 | MUI/Next.js integration. |
| `@emotion/cache` | 11.14.0 | CSS-in-JS cache. |
| `@emotion/react` | 11.14.0 | Emotion React runtime. |
| `@emotion/styled` | 11.14.1 | Styled component API. |

### Build, type-check, lint, and test

| Package | Locked version | Purpose |
| --- | ---: | --- |
| `typescript` | 5.9.3 | Type checking and Next.js TypeScript build support. |
| `@types/node` | 20.19.41 | Node.js types. |
| `@types/react` | 19.2.14 | React types. |
| `@types/react-dom` | 19.2.3 | React DOM types. |
| `eslint` | 9.39.4 | Lint runner. |
| `eslint-config-next` | 16.2.6 | Next.js lint rules. |
| `vitest` | 4.1.11 | Unit and integration test runner. |
| `@vitest/coverage-v8` | 4.1.11 | Test coverage provider. |
| `@vitejs/plugin-react` | 5.2.0 | React transform for Vitest/Vite. |
| `jsdom` | 29.1.1 | Browser-like test environment. |
| `@testing-library/react` | 16.3.2 | React component testing. |
| `@testing-library/jest-dom` | 6.9.1 | DOM assertions. |
| `@testing-library/user-event` | 14.6.6 | User interaction simulation. |

The repository root also installs `husky` 9.1.7 for local Git hooks. Husky is not required in production images.

## 5. Auth-service Java dependencies

The service uses Java 17 and Spring Boot parent 4.0.6.

### Application dependencies

- `spring-boot-starter-actuator`
- `spring-boot-starter-webmvc`
- `spring-boot-starter-security`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`
- `spring-boot-starter-flyway`
- `flyway-database-postgresql`
- PostgreSQL JDBC driver
- `jjwt-api` 0.11.5
- `jjwt-impl` 0.11.5 at runtime
- `jjwt-jackson` 0.11.5 at runtime
- Lombok at compile time

### Test dependencies

- Spring Boot actuator test support
- Spring Boot Data JPA test support
- Spring Boot validation test support
- Spring Boot Web MVC test support
- H2 in-memory database

## 6. Grading-service Java dependencies

The service uses Java 17 and Spring Boot parent 4.1.0.

### Application dependencies

- `spring-boot-starter-webmvc`
- `spring-boot-starter-security`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-flyway`
- `flyway-database-postgresql`
- PostgreSQL JDBC driver
- Jackson Databind
- `jjwt-api` 0.11.5
- `jjwt-impl` 0.11.5 at runtime
- `jjwt-jackson` 0.11.5 at runtime

### Test dependencies

- Spring Boot Data JPA test support
- Spring Boot Web MVC test support
- Spring Security test support
- H2 in-memory database

## 7. Required configuration

The following values must be supplied through Compose or another secrets/configuration provider. Use `.env.example` as the template; do not bake real secrets into images.

### PostgreSQL

- `POSTGRES_USER`
- `POSTGRES_PW`
- `POSTGRES_DB`

### Auth service

- `AUTH_DB_URL`
- `AUTH_DB_USERNAME`
- `AUTH_DB_PASSWORD`
- `JWT_SECRET` containing at least 32 random bytes
- `JWT_EXPIRATION_MS`

### Grading service

- `GRADING_DB_URL`
- `GRADING_DB_USERNAME`
- `GRADING_DB_PASSWORD`
- `JWT_SECRET`, identical to the auth-service value
- `AI_ENGINE_URL`
- `AI_ENGINE_MODEL`
- `AI_ENGINE_API_KEY`
- `AI_VISION_MODEL`

### Frontend

- `NEXT_PUBLIC_API_URL`

`NEXT_PUBLIC_API_URL` is compiled into the browser bundle and must be available in the frontend build stage. It must be a URL reachable by the user's browser; `http://auth-service:8081` is only resolvable inside the Compose network and is not a valid browser-facing production value.

## 8. Network, ports, and persistent storage

| Component | Default port | Dependencies |
| --- | ---: | --- |
| Frontend | 3000 | Browser-accessible auth/API URL. |
| Adminer | 8080 | PostgreSQL. |
| Auth service | 8081 | PostgreSQL and shared JWT secret. |
| Grading service | 8082 | PostgreSQL, shared JWT secret, and external AI provider. |
| PostgreSQL | 5432 | Persistent `postgres_data` volume. |

Services must share a private Compose network. Only browser-facing services should need published host ports in production.

## 9. Current container setup gaps

The dependency inventory exposes the following work still required for a complete container build:

1. Change the frontend builder from `npm ci --only=production` to `npm ci`.
2. Add a multi-stage Dockerfile for grading-service using JDK 17 for compilation and JRE 17 for runtime.
3. Add grading-service to Compose with database, JWT, and AI environment variables.
4. Enable the frontend Compose service and pass `NEXT_PUBLIC_API_URL` as a build argument.
5. Use a browser-reachable API URL or add a frontend reverse proxy; do not expose a Docker-only hostname to browser code.
6. Pin PostgreSQL, Adminer, Maven, Node, and Java image versions or digests for reproducible builds.
7. Add container build/test stages that run unit and integration tests instead of always using `-DskipTests`.
8. Add service health checks and startup dependencies for auth-service and grading-service.

## 10. Verification commands

```bash
docker compose --env-file .env.example config
npm ci
npm --prefix frontend ci
npm test
npm --prefix frontend run build
docker build backend/auth-service
docker build frontend
```

The grading-service Docker build command can be added after its Dockerfile exists.
