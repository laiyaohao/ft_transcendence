# Lumina Repository Refactor Plan

## Purpose and scope

This document is the implementation plan for making the entire repository
easier to read and maintain without changing how Lumina runs. It covers Docker
and deployment configuration, automation scripts, all three Spring services,
the Next.js frontend, tests, and project documentation.

The repository contains roughly 153 production Java files, 188 frontend source
files, and 76 backend test files. A safe refactor must therefore proceed by
small, independently verifiable areas rather than one repository-wide rewrite.

This plan applies to every changed code block. A code block may be a function,
component, service method, configuration section, shell-script function, or
test case. Do not batch unrelated blocks only because they are in the same
file.

## Non-negotiable compatibility rules

Every phase must preserve the following unless a separately approved change
explicitly says otherwise:

- HTTP routes, methods, request fields, response fields, status codes, and
  error messages consumed by clients.
- JWT handling, roles, resource ownership checks, CORS, security headers, and
  service-to-service keys.
- Flyway migration history, schema names, constraints, query ordering,
  idempotency, transaction boundaries, and outbox event formats.
- Frontend routes, visible behaviour, accessibility semantics, and responsive
  layout.
- Compose service names, networks, volumes, health checks, ports, environment
  variable names, and production-only secret handling.
- CI job names and the commands that CI executes.

If a proposed cleanup would alter one of these, stop the refactor. Record the
candidate behaviour change in the pull request and implement it separately
with an updated contract and dedicated tests.

## Universal change procedure

Use this procedure for each code block before moving to the next one.

1. Read the complete surrounding file and identify its callers, dependencies,
   external behaviour, and existing tests.
2. State the narrow readability problem: for example, an overloaded method,
   opaque name, repeated validation branch, compressed JSX, or a line that
   hides an important decision.
3. Make the smallest useful change. Prefer a named variable, guard clause,
   naturally wrapped call, or coherent private helper over a new framework or
   generic abstraction.
4. Keep validation, authorization, loading, business decisions, mutations,
   and response creation visibly ordered in backend workflows.
5. Run the relevant focused test before leaving the area. Add a focused test
   only when the extracted business rule previously had no observable coverage.
6. Inspect `git diff --check` and the diff itself. Confirm that public types,
   URLs, SQL, migrations, Compose keys, and rendered UI behaviour did not
   change accidentally.
7. Commit or review the area as an independent, reversible change before
   starting another high-risk area.

## Repository-wide safety gates

Run these gates at the stated points. Do not describe a phase as complete when
its required gate has not passed.

| Gate | Command | When required |
| --- | --- | --- |
| Whitespace and patch sanity | `git diff --check` | Every phase |
| Frontend static checks | `make frontend-lint` and `make frontend-typecheck` | Any frontend phase |
| Frontend tests | `make frontend-test` | Any frontend behaviour-adjacent phase |
| Service verification | `make backend-auth-test`, `make backend-grading-test`, or `make backend-learning-test` | Respective service phase |
| Production build | `make frontend-build` or `make backend-build` | At the end of its stack phase |
| Documentation validity | `npm run test:readme` and `npm run verify:readme` | Documentation or README phase |
| Compose syntax | `make compose-config` and `make e2e-config` | Docker or configuration phase |
| Container build | `make compose-build` | Dockerfile, image, Compose, or dependency phase |
| Full local CI | `make ci` | At release-candidate milestones |
| Offline browser flows | `make e2e` | Frontend/API integration and final milestone |

`make ci` and `make e2e` require Docker. Run them against disposable local
data only. Never use `compose-reset`, `e2e-reset`, or `fclean` as part of a
readability refactor unless the operator has explicitly approved data removal.

## Phase 0 — Establish a clean baseline

1. Preserve unrelated working-tree changes and record them before beginning.
2. Run `git status --short`, `git diff --check`, `npm run verify:readme`,
   `make frontend-lint`, `make frontend-typecheck`, and the three backend test
   targets where the environment permits.
3. Record existing failures separately from refactor failures. Do not fix an
   unrelated failing test inside a readability-only change.
4. Build a file-to-test map as each area is opened. Existing test files next to
   source files are the first source of truth; integration tests protect
   service boundaries.

Exit gate: documented baseline and no unexplained change to tracked files.

### Phase 0 baseline record — 2026-09-04

No application, infrastructure, test, or configuration code was changed during
this baseline. The only worktree entry is this untracked plan document.

Passed checks:

- `git diff --check`
- `npm run test:readme` (5 tests)
- `npm run verify:readme`
- `make frontend-lint`
- `make frontend-typecheck`
- `make backend-auth-test` (build success; one Docker-dependent test skipped)
- `make backend-learning-test` (build success; two Docker-dependent tests skipped)
- `npm run compose:config`
- `npm run compose:e2e:config`

Known baseline failures not changed in Phase 0:

- `make backend-grading-test` fails only in
  `MigrationIntegrationTest`: two assertions expect migration counts of 8 and
  6, while the checked-in migration history now contains 11 and 9 at those
  checkpoints. All other executed grading tests passed.
- `make frontend-test` reports 315 passing and 6 timing out at the configured
  15-second limit. The affected tests are in `MarkingReview`,
  `ManualResultForm`, `WorksheetBuilder`, and `QuestionForm`. These timeouts
  are baseline defects to investigate separately; no assertions, timeouts, or
  production code were changed to suppress them.

Docker-backed Testcontainers tests were skipped because no Docker daemon was
available. Before a release or a refactor that changes migrations, containers,
or cross-service behaviour, rerun the failed/skipped checks in a Docker-enabled
environment.

## Phase 1 — Docker, Compose, Nginx, and automation scripts

### Scope

- `compose.yaml`, `compose.e2e.yaml`, and `compose.production.yaml`
- `docker/nginx/nginx.conf.template`
- `docker/e2e-ai-mock/*` and `docker/e2e-seed/*`
- `scripts/*`, `Makefile`, `.env.example`, and `.env.production.example`
- `.github/workflows/ci.yml`

### Steps for each configuration block

1. Compare every variable, port, volume, health check, profile, and dependency
   edge with its consumers before editing.
2. Split dense shell or JavaScript script flows into named functions only when
   the functions correspond to operations such as generating a secret,
   validating a prerequisite, or writing a certificate.
3. Replace cryptic temporary names and long inline shell conditions with clear
   names and guard clauses. Keep shell options, exit codes, quoting, and file
   permissions exactly the same.
4. In Compose files, group each service into image/build, environment,
   persistence, networking, health, and dependency sections. Do not rename
   Compose anchors, services, networks, volumes, or environment keys.
5. In the Nginx template, preserve request forwarding, TLS settings, headers,
   location matching, and environment substitutions byte-for-byte unless a
   separately tested operational change is approved.
6. Keep fixture seed data deterministic and preserve its E2E account IDs,
   credentials, endpoints, and response shapes.

Validation after each related group: `make compose-config`; for E2E files also
`make e2e-config`; for image changes `make compose-build`; for workflow or
README command changes also run the README validation commands. Run `make e2e`
after any fixture or browser-facing stack change.

### Phase 1 completion record — 2026-09-05

Completed readability-only changes:

- Wrapped the E2E Compose invocation documentation and health-check command
  arrays in `compose.e2e.yaml`; the health-check arguments and all values are
  unchanged.
- Refactored the deterministic E2E AI mock and seed scripts into named
  request, response, retry, and seed-operation helpers. Endpoints, fixture
  data, credentials, ports, response shapes, retry policy, and idempotency
  keys remain unchanged.
- Wrapped the `Makefile` `.PHONY` list and clarified shell/README-verifier
  control flow without changing their interfaces or behavior.

Reviewed without changes because further cleanup would add operational risk:

- `compose.yaml`, `compose.production.yaml`, Nginx configuration, all
  Dockerfiles, and the CI workflow.

Passed checks:

- `git diff --check`
- `npm run test:readme` (5 tests)
- `npm run verify:readme`
- `npm run compose:config`
- `npm run compose:e2e:config`
- POSIX shell syntax checks for both secret/TLS scripts
- Node syntax checks for the README verifier and both E2E fixture scripts
- In-process contracts for the mock and seed scripts

The Docker daemon is unavailable in this environment, so `make compose-build`
and `make e2e` remain mandatory follow-up checks in a Docker-enabled
environment. No application behavior, container topology, deployment contract,
or CI behavior was intentionally changed.

## Phase 2 — Auth service

### Scope

`backend/auth-service/src/main/java/com/fttranscendence/authservice/`:

- `config`, `controller`, `dto`, `model`, `repository`, `security`, and
  `service`
- migrations and service tests under `src/test`

### Order of work

1. Refactor pure DTO/model formatting and repository method layout first.
2. Refactor service methods next, retaining the visible lifecycle:
   validate request, load identity, apply rules, persist, issue response.
3. Refactor controller methods only after locating every frontend/service
   caller and controller integration test.
4. Treat `SecurityConfig`, `JwtService`, `JwtAuthenticationFilter`, security
   headers, password handling, registration, and bootstrap-Tutor code as
   protected blocks. Improve names and layout only; do not alter policy.
5. Keep Flyway migrations immutable. Add no migration for formatting-only work.

Validation: focused unit/controller/security test followed by
`make backend-auth-test` and `make backend-auth-build`.

### Phase 2 completion record — 2026-09-06

Completed a behavior-preserving readability pass across the Auth service.

- Restructured registration, login, student-directory, user-details, and
  bootstrap-Tutor flows into clearly named steps and helpers while retaining
  their ordering, validation, persistence, and responses.
- Made JWT token validation and filter decisions, security configuration,
  CORS configuration, and security-header setup easier to scan without
  changing policy, claims, matcher order, headers, or error behavior.
- Improved controller, DTO, model, repository, application, POM, and
  properties layout and documentation only. No auth-service tests or Flyway
  migration files were changed.

Passed checks:

- `git diff --check`
- Focused service/bootstrap tests: 11 tests passed
- Focused JWT/security tests: 14 tests passed
- Focused controller/application tests: 6 tests passed
- `make backend-auth-test`: 38 tests passed; the optional PostgreSQL
  Testcontainers migration test was skipped because Docker is unavailable
- `make backend-auth-build`: passed

No intentional route, API-response, JWT, authorization, CORS, security-header,
database, migration, or bootstrap behavior changes were made. Docker-enabled
CI must still run the PostgreSQL/Testcontainers migration check before release.

Known unchanged coverage gaps: the existing JWT branches for a null role and
non-domain `UserDetails` do not have direct tests.

## Phase 3 — Learning service

### Scope and order

Work package-by-package under
`backend/learning-service/src/main/java/com/fttranscendence/learning/`:

1. `config`, models, DTO-like request/response classes, repositories
2. `syllabus`, `question`, `classroom`, and `student`
3. `worksheet` and `pdf`
4. `mastery`, `dashboard`, `insight`, `report`, and `alert`
5. `security` and inter-service controllers last

### Steps for every service method

1. Identify the ownership rule and transaction scope before extraction.
2. Make validation and authorization guards explicit at the top of the method.
3. Name domain decisions, especially worksheet eligibility, assignment scope,
   mastery thresholds, report periods, alert state transitions, and ordering.
4. Extract only cohesive operations, such as response assembly, assignment
   synchronization, or query-result mapping. Keep JPA query semantics and
   sort order unchanged.
5. Keep PDF layout and binary output verification separate from business-rule
   refactors.
6. Never modify applied migrations; preserve repository query method names and
   SQL result shapes unless callers and integration tests are changed together.

Validation: run the closest package tests after each package, then
`make backend-learning-test` and `make backend-learning-build`. For worksheet,
mastery, insight, alerts, or report work, include their integration tests and
exercise the affected critical flow from the validation checklist.

### Phase 3 completion record — 2026-09-06

Completed a behavior-preserving readability pass over the Learning service's
most complex business, integration, and output paths.

- Refactored student, classroom, question, and syllabus workflows into named
  validation, lookup, domain-decision, and response-assembly steps.
- Made worksheet generation, assignment idempotency, status handling, PDF
  response construction, and PDF header generation easier to follow without
  changing generated output or persistence behavior.
- Clarified mastery calculation, approved-marking synchronization, dashboard
  selection, and alert creation/deduplication logic while retaining transaction
  boundaries, query ordering, authoritative tutor approval, and event flows.
- Improved the JWT/security and internal synchronization controllers using
  named constants and explicit parsing/authorization stages. Routes, response
  contracts, headers, CORS, and access policy remain unchanged.

During independent validation, an early-rounding regression was identified in
the refactored mastery calculation. It was repaired before completion: the
running average again uses the original six-decimal intermediate value, while
the public adjusted-attempt percentage remains rounded to two decimals. A
focused fractional-mark regression test now protects that behavior.

Passed checks:

- `git diff --check`
- Focused core-domain suite: 46 tests passed
- Focused mastery suite: 11 tests passed, plus 3 calculator tests after the
  precision repair
- Focused alert/dashboard suite: 11 tests passed
- Related mastery/insight/report regression suite: 35 tests passed
- Focused security/controller suites: 13 tests passed
- `make backend-learning-test`: 196 tests passed (80 unit and 116
  integration); 2 PostgreSQL/Testcontainers tests skipped because Docker is
  unavailable
- `make backend-learning-build`: passed

No intentional API, database, migration, authorization, security, CORS,
idempotency, ordering, PDF, or user-visible behavior changes were made. Run
the PostgreSQL/Testcontainers migration and class-detail tests in Docker-enabled
CI before release.

## Phase 4 — Grading service

### Scope and order

`backend/grading-service/src/main/java/com/fttranscendence/grading/`:

1. DTO/model/repository formatting and isolated OCR/storage utilities
2. `ocr` and `storage`
3. `service` domain workflows
4. controllers and configuration
5. `security` and learning-service integration boundary last

### Protected workflow rules

- Keep Student/Tutor ownership validation before document or submission access.
- Keep OCR correction, manual answer, tutor approval, retraction, review
  state, and mastery outbox event transitions in the same transaction scope.
- Preserve event keys, revisions, payload fields, and ordering. Treat them as
  public inter-service contracts.
- Refactor `MarkingReviewService` as small internal steps only; do not split it
  into new public services until a separate architecture decision is approved.
- Refactor `LearningAuthorizationClient` only with contract tests against its
  request/response parsing and error handling.

Validation: focused OCR/manual-result/approval tests after each workflow, then
`make backend-grading-test` and `make backend-grading-build`. Run the full
offline E2E marking flow after a grading controller, event, or OCR change.

### Phase 4 completion record — 2026-09-06

Completed a behavior-preserving readability pass across the Grading service.

- Separated the dense marking-review workflow into named internal stages for
  validation, idempotency, canonical submission creation, review state changes,
  and outbox-event construction, without moving transaction boundaries or
  creating new public services.
- Clarified Learning-service authorization requests, marking-context parsing,
  scope resolution, and outbox dispatch/retry flow while retaining exact
  endpoints, headers, fields, error mappings, batch ordering, and payloads.
- Made OCR/storage validation, owner-scoped file handling, atomic cleanup,
  provider request construction, fallback behavior, and deterministic rule
  checks easier to follow.
- Improved controller, security, configuration, repository, and response
  assembly layout without changing routes, JSON shapes, error bodies, JWT,
  CORS, or security policy.

Passed checks:

- `git diff --check`
- Focused protected workflow/security suite: 47 tests passed
- Grading unit suite: 44 tests passed
- Grading integration workflow, document, OCR, approval/retraction, student
  result, security, and authorization checks passed
- `make backend-grading-build`: passed

`make backend-grading-test` still reports two pre-existing stale assertions in
`MigrationIntegrationTest`: it expects eight migrations/version six although
the unchanged repository contains eleven migrations through version twelve.
The Docker/Testcontainers PostgreSQL migration test is also skipped because
Docker is unavailable. Both limitations are recorded in `ISSUES.md` and are
not caused by this refactor.

No intentional route, API, authorization, document-storage, OCR, AI-provider,
review-state, outbox, database, migration, or user-visible behavior changes
were made.

## Phase 5 — Frontend foundations and API clients

### Scope

- `frontend/src/services/*`
- `frontend/src/lib/*`, `context/*`, `providers/*`, `proxy.ts`
- `theme/*`, `customizations/*`, `utils/*`, and shared navigation components

### Steps

1. Refactor each service independently. Preserve exported function names,
   request URLs, methods, headers, body fields, response parsing, and user
   error text.
2. Put runtime parsing, request construction, and response transformation in
   named helpers only when they communicate a real API concept.
3. Make authentication/token access and proxy routing explicit. Do not change
   browser token storage or cross-origin behaviour during cleanup.
4. Keep provider state, media-query state, theme tokens, and navigation
   configuration separate from UI rendering.
5. Retain all public TypeScript types used by pages and components; introduce
   more specific internal types only when they reduce ambiguity.

Validation: focused service/lib tests, then `make frontend-lint`,
`make frontend-typecheck`, `make frontend-test`, and `make frontend-build`.

### Phase 5 completion record — 2026-09-06

Completed a behavior-preserving readability pass across frontend foundations,
API clients, and shared navigation.

- Made authentication, API parsing, validation, provider state, navigation,
  and theme setup easier to scan without changing token/cookie storage, proxy
  routing, public types, responsive behavior, or accessible navigation.
- Clarified service request construction and runtime parsing while preserving
  exported functions, URLs, methods, headers, request bodies, parsed shapes,
  and user-facing errors. Multipart submission uploads still omit a manual
  `Content-Type` header.
- Added a focused multipart-header regression assertion; no API contract or
  user-visible behavior was intentionally changed.

Passed checks:

- `git diff --check`
- Focused service, foundation, navigation, and submission test runs passed
- `make frontend-lint`
- `make frontend-typecheck`
- `make frontend-test`: 69 files and 321 tests passed
- `make frontend-build`

No intentional route, API, authentication, authorization, storage, theme,
accessibility, or responsive-layout behavior changes were made.

## Phase 6 — Frontend pages and components

### Scope and sequence

1. Shared primitives, shell, sidebar, authentication, and legal components
2. Classes, students, and syllabus components/pages
3. Questions and worksheets components/pages
4. Upload, submissions, OCR, marking, manual answers, and mistakes
5. Mastery, dashboard, subject profile, reports, progress, and alerts
6. Route-level pages under `frontend/src/app/(main)` and public routes

### Steps for every component

1. Read its component and page tests before changing JSX.
2. Move substantial calculations and conditionals out of JSX into descriptive
   values or named event handlers.
3. Extract visual sections only when they have a distinct responsibility, such
   as a form, results list, status banner, or action bar.
4. Keep interactive semantics: labels, keyboard activation, focus management,
   error announcements, and responsive breakpoints must remain intact.
5. Avoid a mechanical split of every component. A small component with one
   responsibility should stay together even if it has several visual elements.

Validation: component/page tests, frontend lint/typecheck/test/build, then
the relevant Playwright flow. Run `make e2e` once a feature group is complete.

## Phase 7 — Tests, documentation, and cleanup

### Tests

1. Reformat tests for readability without weakening assertions.
2. Use arrange/act/assert structure where it makes intent clearer.
3. Replace opaque fixtures with named builders only when this makes the domain
   state easier to understand.
4. Add targeted edge-case tests for newly extracted rules; test observable
   behaviour rather than private helper implementation.
5. Keep E2E fixture contracts and test account credentials stable.

### Documentation

1. Update architecture, schema, transport, module catalogue, and README files
   only when refactor file locations or operational commands have changed.
2. Keep documentation examples executable and aligned with `Makefile` and CI.
3. Run README verification after every documentation edit.

Exit gate: `npm run verify`, `make ci`, `make e2e`, and `git diff --check`
pass in an environment with Node 20, JDK 17, and Docker.

## Milestone checklist

A milestone is complete only when all items below are true:

- [ ] Every changed block followed the universal change procedure.
- [ ] No API, schema, migration, security, Compose, or frontend route contract
      changed unintentionally.
- [ ] Focused tests passed for every touched domain workflow.
- [ ] Required stack-level checks passed.
- [ ] Diff review found no generated files, secrets, target artifacts, or
      unrelated formatting churn.
- [ ] Remaining risks and intentionally deferred dense areas are recorded.

## Recommended execution cadence

Use one small package or feature group per pull request. Start with low-risk
models, formatting, and isolated utilities; then service methods; then their
controllers/pages; finally integration boundaries and deployment files. Do not
refactor Docker, backend business logic, and frontend behaviour in the same
change set. This keeps failures diagnosable and makes every refactor easy to
revert without affecting program operability.
