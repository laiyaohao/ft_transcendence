*This project was created as part of the 42 curriculum by lkoh, lwin, pzaw, tyingchu, and ylai.*

# ft_transcendence, Lumina

## Overview

Lumina is a role-based learning platform for Tutors and Students. Tutors create
classes, manage existing Student accounts, build syllabus-backed questions and
worksheets, import questions from source material, review submissions, and use
mastery data to plan follow-up work. Students receive assigned worksheets,
upload completed work, correct OCR extraction where needed, and view progress.

The application consists of a Next.js frontend, three Spring Boot services,
PostgreSQL, and Docker Compose. AI marking and vision/OCR use an
operator-provided OpenAI-compatible provider; no provider secret is committed.

## Team roles and project management

The complete ownership and defence plan is in [ROLES.md](ROLES.md). It maps
each team member to a primary role, evidence-backed contribution, feature area,
and required demonstration. It also records an identity-reconciliation gate:
the README alias `tyingchu` must be confirmed against the `tyingchun` and
`yingchun` Git identities before the evaluation.

| Member | Primary role | Primary contribution and feature ownership |
| --- | --- | --- |
| `ylai` | Project Manager and Technical Lead | Repository architecture, frontend/Spring Boot foundation, authentication, security, CI, and technical decisions. |
| `tyingchu` | Lead Integration Developer | Learning and grading integration, classes, worksheets, submission/OCR/marking workflow, deployment, tests, and final documentation. |
| `lkoh` | Product Owner and AI/OCR Developer | Learning workflow scope, AI/OCR integration, provider limitations, and legal/product requirements. |
| `lwin` | Tutor Experience Developer | Tutor dashboard, classes, Student management, worksheets, and marking experience. |
| `pzaw` | Student Experience Developer | Student dashboard, worksheets, upload, profile, progress, navigation, and responsive behaviour. |

Work is organised as issue-sized increments, feature branches and pull-request
merges, followed by integration, security, documentation, and test hardening.
The team should assign a primary owner and reviewer to each slice, run the
relevant checks before merging, and have every member explain both their own
feature and a cross-team technical decision. Git history, [ISSUES.md](ISSUES.md),
and [.github/workflows/ci.yml](.github/workflows/ci.yml) are the repository
evidence for this process; attendance and verbal participation must be checked
live during the evaluation.

### Technology choices

| Technology | Reason |
| --- | --- |
| Next.js, React, and TypeScript | Component-based role-aware browser routes and typed frontend contracts. |
| Material UI and Emotion | Responsive, accessible, themed UI components, rather than plain CSS alone. |
| Spring Boot and Java 17 | Validated, secured, independently testable APIs. |
| PostgreSQL and Flyway | Relational records with versioned, service-owned schema migrations. |
| Docker Compose and Nginx | Repeatable local/E2E stack and a private production-shaped HTTPS edge. |
| OpenAI-compatible provider | Optional OCR and marking assistance, always subject to Tutor approval. |

## Features and evidence

| Area | Delivered capability | Implementation and automated evidence |
| --- | --- | --- |
| Identity | Student registration, Tutor bootstrap, login, BCrypt passwords, JWT roles, and protected routes | [auth-service](backend/auth-service) and [auth integration tests](backend/auth-service/src/test/java/com/fttranscendence/authservice/controller/AuthControllerIntegrationTest.java) |
| Class management | Tutor classes, schedules, Student enrolment, profiles, and Tutor notes | [classroom and student packages](backend/learning-service/src/main/java/com/fttranscendence/learning/classroom) and [membership tests](backend/learning-service/src/test/java/com/fttranscendence/learning/classroom/ClassStudentMembershipIntegrationTest.java) |
| Curriculum and questions | P5/P6 syllabus taxonomy, question bank, image attachments, rule checks, and source-question import with review | [question package](backend/learning-service/src/main/java/com/fttranscendence/learning/question) and [question tests](backend/learning-service/src/test/java/com/fttranscendence/learning/question) |
| Worksheets | Tutor worksheet creation, recommendations, assignments, images, PDF output, and Student worksheet library | [worksheet package](backend/learning-service/src/main/java/com/fttranscendence/learning/worksheet) and [worksheet tests](backend/learning-service/src/test/java/com/fttranscendence/learning/worksheet) |
| Marking | Document upload, durable page storage, OCR correction, AI proposals, manual answers, Tutor approval/flag/reset, and mistake history | [grading controllers](backend/grading-service/src/main/java/com/fttranscendence/grading/controller) and [OCR finalization test](backend/grading-service/src/test/java/com/fttranscendence/grading/controller/OcrSubmissionFinalizationIntegrationTest.java) |
| Learning insight | Tutor and Student dashboards, mastery maps, learning profiles, class insights, alerts, reports, and PDF reports | [insight package](backend/learning-service/src/main/java/com/fttranscendence/learning/insight) and [subject-profile test](backend/learning-service/src/test/java/com/fttranscendence/learning/insight/SubjectProfileIntegrationTest.java) |
| Browser experience | Role-aware Tutor and Student pages, responsive layout, keyboard-accessible controls, and route guards | [frontend routes](frontend/src/app) and [accessibility E2E tests](frontend/e2e/responsive-accessibility.spec.ts) |
| Verification | Unit, integration, offline Compose, and Playwright browser test paths | [Makefile](Makefile) and [CI workflow](.github/workflows/ci.yml) |

## Architecture

The complete topology, data boundaries, and end-to-end workflow are in
[docs/architecture.md](docs/architecture.md).

~~~mermaid
flowchart LR
  Browser --> Frontend[Next.js frontend]
  Frontend --> Auth[auth-service]
  Frontend --> Learning[learning-service]
  Frontend --> Grading[grading-service]
  Auth --> AuthDb[(PostgreSQL / auth)]
  Learning --> LearningDb[(PostgreSQL / learning)]
  Grading --> GradingDb[(PostgreSQL / grading)]
  Grading --> Documents[(Submission volume)]
  Grading -->|approved evidence| Learning
~~~

`auth-service` owns accounts and roles. `learning-service` owns learning data,
while `grading-service` owns submitted documents and marking state. Each service
owns its Flyway migrations in a separate PostgreSQL schema; services refer to
accounts by stable user ID rather than sharing application tables.

## Database schema

[docs/database-schema.md](docs/database-schema.md) maps the principal entities
to executable Flyway migrations and explains the boundaries among the `auth`,
`learning`, and `grading` schemas. Migration integration tests are the database
source of truth.

## Repository map

| Path | Purpose |
| --- | --- |
| [frontend](frontend) | Next.js application, UI components, API clients, unit tests, and Playwright scenarios. |
| [backend/auth-service](backend/auth-service) | Identity, JWT, roles, bootstrap Tutor, and auth migrations. |
| [backend/learning-service](backend/learning-service) | Classes, Students, syllabus, questions, worksheets, mastery, insights, alerts, and reports. |
| [backend/grading-service](backend/grading-service) | Uploads, OCR, marking, review workflow, document storage, and marking-to-learning outbox. |
| [docker](docker) | Nginx production edge plus deterministic E2E AI mock and seed services. |
| [docs](docs) | Architecture, schema, deployment transport, OCR observability, and validation runbooks. |
| [scripts](scripts) | Documentation verification and development/production secret and TLS helpers. |
| [compose.yaml](compose.yaml) | Development topology. [compose.e2e.yaml](compose.e2e.yaml) and [compose.production.yaml](compose.production.yaml) add disposable E2E and production-shaped overlays. |

## Prerequisites

Install Docker Desktop/Engine with Compose v2 and Git for the container
workflow. Direct local checks also need Node.js 20, npm, and a complete JDK 17
with `javac`. See [DEPENDENCIES.md](DEPENDENCIES.md) for the dependency
inventory and evaluator-facing rationale.

Commands that need a Docker daemon, hosted CI, a real provider key, or a VM are
recorded with expected output in
[docs/SANDBOX-VALIDATION-RUNBOOK.md](docs/SANDBOX-VALIDATION-RUNBOOK.md).

## Clean-checkout quick start

~~~bash
git clone https://github.com/laiyaohao/ft_transcendence.git
cd ft_transcendence
cp .env.example .env
~~~

Replace every `change-me` value in `.env` before starting. Use the same database
password for the PostgreSQL variables, a JWT secret with at least 32 random
bytes, and a separate high-entropy `LEARNING_MARKING_SYNC_KEY`.

~~~bash
make deps
make compose-config
make compose-up
make compose-ps
~~~

The default stack starts PostgreSQL, the three APIs, and the frontend. Open
<http://localhost:3000>. `adminer` is optional and excluded from the default
profile; start it at <http://localhost:8080> only when needed:

~~~bash
docker compose --env-file .env --profile admin-tools up --wait
~~~

Use `make compose-logs` to investigate, `make compose-down` to stop services
while preserving data, and `make compose-reset` only for disposable data.

### Local HTTPS on port 3000

With the same `.env`, run `make compose-https-up` and open
<https://localhost:3000/login>. This adds a local Nginx proxy and routes the
frontend and APIs through HTTPS on port 3000, so login has no mixed-content or
CORS mismatch. Plain HTTP on that port redirects to HTTPS, preserving the URL.
Only the loopback port 3000 is published; the database and APIs stay inside
Docker. No public domain or production configuration is needed.

The command requires OpenSSL and creates a one-year self-signed certificate in
`../tls-local`, outside the checkout. Your browser will warn until you trust
that local certificate (`fullchain.pem`) in your system certificate store.
On macOS, open it in Keychain Access, add it to the login keychain, and set
its Trust setting to **Always Trust**, then restart the browser.
Alternatively, supply a trusted local-CA certificate for `localhost` as
`fullchain.pem` and `privkey.pem` there. Existing certificates are preserved;
replace them when expired. Override the location with `LOCAL_TLS_DIRECTORY`.

Stop with `make compose-https-down`. To return to HTTP, run that command first,
then `make compose-up`. Application data is preserved when switching.

## Configuration

[.env.example](.env.example) is the complete development template. Never commit
the copied `.env` file or any secret file.

| Setting | Purpose |
| --- | --- |
| `POSTGRES_*` and `*_DB_SCHEMA` | Local PostgreSQL account, database, and service schema names. |
| `JWT_SECRET`, `JWT_EXPIRATION_MS` | Shared JWT signing key and access-token lifetime. |
| `BOOTSTRAP_TUTOR_*` | Optional Tutor creation at startup; existing accounts are preserved. |
| `LEARNING_MARKING_SYNC_KEY` | Private grading-to-learning service credential. |
| `AI_ENGINE_*` | OpenAI-compatible AI marking endpoint, model, and key. |
| `AI_VISION_*` | Learning-service vision/OCR provider, limits, retries, and worker timing. |
| `NEXT_PUBLIC_*_API_URL` | Browser-visible local API origins. Never put provider credentials here. |
| `FRONTEND_ALLOWED_ORIGINS`, `ENFORCE_HTTPS`, `SECURITY_HEADERS_HSTS_ENABLED` | CORS and HTTPS/header behaviour for the deployment environment. |

Normal Compose publishes diagnostic service ports for development. The
production-shaped overlay exposes only Nginx and reads secrets from
`../secrets.txt`.

## Test accounts

Normal development ships with no committed credentials. Create a Student at
`/signup`. To create a Tutor, set all three `BOOTSTRAP_TUTOR_*` values and
recreate `auth-service`. No database reset is needed; existing Tutor credentials
are never reset.

The disposable offline E2E stack seeds only these accounts:

`make compose-up` and `make compose-https-up` do not create these accounts
automatically. They must already exist in your local database to sign in there.

| Role | Email | Password |
| --- | --- | --- |
| Tutor | `e2e.tutor@example.test` | `E2eTutor!Pass123` |
| Student | `e2e.student@example.test` | `E2eStudent!Pass123` |

## Development commands

| Command | Outcome |
| --- | --- |
| `make deps` | Installs locked root and frontend JavaScript dependencies. |
| `make compose-config` | Validates `.env` and the development Compose configuration. |
| `make compose-up`, `make compose-down` | Starts / stops the development stack. |
| `make compose-ps`, `make compose-logs` | Shows health status / follows logs. |
| `make frontend-lint`, `make frontend-typecheck`, `make frontend-test`, `make frontend-build` | Runs frontend checks or production build. |
| `make backend-auth-test`, `make backend-grading-test`, `make backend-learning-test` | Runs one backend Maven verification suite. |
| `make test`, `make test-integration`, `make ci` | Runs all tests, integration tests, or local PR-equivalent validation. |
| `make security-audit` | Fails on high or critical production dependency advisories. |

Run `make help` for every target. `make fclean` performs a broad Docker prune
and must be used deliberately.

## Testing and validation

~~~bash
npm run test:readme
npm run verify:readme
make frontend-lint
make frontend-typecheck
make test
make ci
~~~

`npm run test:readme` tests the README verifier. `npm run verify:readme`
validates required sections, local evidence links, placeholder-free prose,
module-scorecard arithmetic, and quick-start command parity. It does not award
module points. `make ci` also needs Docker and registry access for its Compose
stage. Run `git diff --check` before committing.

## Offline Compose browser tests

The browser suite uses deterministic local AI/OCR mock and seed services, so it
does not use an OpenAI or DeepSeek key.

~~~bash
make e2e-chrome
make e2e-config
make e2e
~~~

On Linux use `make e2e-chrome-linux`. `make e2e` creates a clean fixture stack,
waits for service health, runs Playwright, then removes its E2E containers and
volume, including after failure. Use `make e2e-up`, `make e2e-test`, and
`make e2e-down` to inspect the stages separately.

## Deployment

Production HTTPS terminates at the existing Nginx reverse proxy. Only ports
**80 and 443** are published; the frontend, APIs, and database stay private.
HTTP redirects permanently to HTTPS, preserving paths and query strings.

~~~bash
cp .env.production.example .env.production
make production-secrets
# Set PUBLIC_APP_DOMAIN, ACME_EMAIL, and the external provider/bootstrap secrets.
# Point public DNS at this host and allow TCP 80/443; port 80 must be free initially.
make production-cert
make production-up
make production-ps
~~~

Certificates use Let's Encrypt. **Install the included twice-daily renewal timer**
and run the renewal dry-run as described in the
[production transport runbook](docs/production-transport.md). It also covers
firewalls, external certificate paths, smoke tests, and optional private VM TLS.
Local development continues to use HTTP without certificates.

## Security and privacy

- APIs enforce JWT validation, role and resource ownership checks, input
  validation, CORS, and security headers. See [learning hardening tests](backend/learning-service/src/test/java/com/fttranscendence/learning/security/SecurityHardeningIntegrationTest.java).
- Grading validates the class, Student, and worksheet relationship with
  `learning-service` before accepting a submission. Approved marking evidence
  moves through a private authenticated service call, not the browser.
- Keep `.env`, `../secrets.txt`, provider keys, JWT secrets, and TLS private
  keys outside version control.
- Browser token storage remains a future hardening target. Use an HttpOnly,
  Secure, SameSite-cookie session design before a public Internet launch.
- The user-facing disclosures are [Privacy Policy](frontend/src/app/privacy/page.tsx)
  and [Terms](frontend/src/app/terms/page.tsx). Review them against the deployed
  provider and retention policy before public release.

## Continuous integration

[.github/workflows/ci.yml](.github/workflows/ci.yml) has two tiers:

- Pull requests run `Frontend checks`, three `Backend checks` matrix entries,
  and `Compose configuration and images`.
- `main`, nightly, and manual runs execute `Offline E2E`, retaining failure
  artefacts and Compose logs for 14 days.

Make the first four check names branch-protection requirements only after they
have run successfully. Keep `Offline E2E` post-merge until hosted-runner timing
and reliability are measured.

## Module evidence

**Module catalogue status:** BLOCKED

The exact official 42 subject/module catalogue for this evaluation is not in
the repository, so Lumina makes no module-point claim. This is a ready-to-map
feature inventory, not an assertion that it earns a module in another subject
version. See the [module catalogue blocker log](docs/module-catalogue-blocker.md).

<!-- MODULE_SCORECARD_START -->
| Catalogue ID | Claim | Points | Implementation | Test | Status |
| --- | --- | ---: | --- | --- | --- |
| N/A | Exact evaluation catalogue is unavailable | 0 | [blocker log](docs/module-catalogue-blocker.md) | N/A | BLOCKED |
<!-- MODULE_SCORECARD_END -->

**Verified module total:** 0 / 14

Once the official catalogue is available, replace the blocked row with one row
per claim, cite the official ID and point value, link implementation and
passing automated evidence, then run:

~~~bash
npm run verify:modules
~~~

The command fails until the documented verified total is at least 14. It cannot
turn a feature inventory into evaluation points by itself.

## Known limitations

- The official versioned module catalogue is absent, so the requested 14-point
  assessment cannot yet be verified.
- VM TLS uses a self-signed certificate and temporary hosts-file entry.
- Provider-dependent OCR and marking require a real key and deployment smoke
  test; offline E2E uses deterministic fixtures instead.
- Development Compose exposes diagnostic ports. Use the production overlay for
  private service networking.

## Contributors

The repository header records the project contributors: lkoh, lwin, pzaw,
tyingchu, and ylai. Use normal pull requests, run relevant checks, and keep
feature documentation linked to implementation and tests.

## Licence

No licence file is currently included. Do not assume permission to reuse,
redistribute, or deploy the project beyond the applicable 42 curriculum terms
until the contributors add an explicit licence.
