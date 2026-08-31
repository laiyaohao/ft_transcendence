*This project was created as part of the 42 curriculum by lkoh, lwin, pzaw, tyingchu, and ylai.*

# ft_transcendence — Lumina

## Overview

Lumina is a Tutor-and-Student learning platform. Tutors organise classes, enrol
existing Student accounts, create taxonomy-backed questions and worksheets,
review uploaded completed work, and approve marking outcomes. Students receive
assigned work, upload it, correct low-confidence OCR text, and follow progress.

The application uses a Next.js frontend, Spring Boot services, PostgreSQL, and
Docker Compose. Live AI/OCR calls use an operator-provided OpenAI-compatible
provider key; no provider key is committed.

## Features and evidence

| Capability | Implementation | Automated evidence |
| --- | --- | --- |
| Account registration, login, JWT roles, and Tutor bootstrap | [auth-service](backend/auth-service) | [AuthControllerIntegrationTest](backend/auth-service/src/test/java/com/fttranscendence/authservice/controller/AuthControllerIntegrationTest.java) |
| Tutor classes, schedules, and existing-Student memberships | [classroom package](backend/learning-service/src/main/java/com/fttranscendence/learning/classroom) | [ClassStudentMembershipIntegrationTest](backend/learning-service/src/test/java/com/fttranscendence/learning/classroom/ClassStudentMembershipIntegrationTest.java) |
| P5/P6 taxonomy-backed question bank and worksheets | [question package](backend/learning-service/src/main/java/com/fttranscendence/learning/question) | [P6ScienceQuestionBankSeedIntegrationTest](backend/learning-service/src/test/java/com/fttranscendence/learning/question/P6ScienceQuestionBankSeedIntegrationTest.java) |
| Student worksheet library and PDF route | [worksheet pages](frontend/src/app/%28main%29/worksheets) | [StudentWorksheetLibraryIntegrationTest](backend/learning-service/src/test/java/com/fttranscendence/learning/worksheet/StudentWorksheetLibraryIntegrationTest.java) |
| Submission pages, OCR correction, and Tutor review | [submission controller](backend/grading-service/src/main/java/com/fttranscendence/grading/controller/SubmissionDocumentController.java) | [OcrSubmissionFinalizationIntegrationTest](backend/grading-service/src/test/java/com/fttranscendence/grading/controller/OcrSubmissionFinalizationIntegrationTest.java) |
| Mastery, subject-profile insight, reports, and alerts | [insight package](backend/learning-service/src/main/java/com/fttranscendence/learning/insight) | [SubjectProfileIntegrationTest](backend/learning-service/src/test/java/com/fttranscendence/learning/insight/SubjectProfileIntegrationTest.java) |
| Responsive and keyboard-accessible browser UI | [shared UI components](frontend/src/components) | [responsive-accessibility.spec.ts](frontend/e2e/responsive-accessibility.spec.ts) |
| Offline Compose browser checks | [fixture Compose overlay](compose.e2e.yaml) | [CI workflow](.github/workflows/ci.yml) |

## Architecture

The complete topology, trust boundaries, and core workflow are in
[docs/architecture.md](docs/architecture.md).

~~~mermaid
flowchart LR
  Browser --> Frontend[Next.js frontend]
  Frontend --> Auth[auth-service]
  Frontend --> Learning[learning-service]
  Frontend --> Grading[grading-service]
  Auth --> PostgreSQL[(PostgreSQL / auth)]
  Learning --> PostgreSQL2[(PostgreSQL / learning)]
  Grading --> PostgreSQL3[(PostgreSQL / grading)]
~~~

Each application service owns its Flyway migrations. Cross-service identity
references use stable user IDs rather than shared application tables.

## Database schema

[docs/database-schema.md](docs/database-schema.md) diagrams the main entities,
links them to executable migrations, and describes cross-schema boundaries.
Migration integration tests remain the database source of truth.

## Prerequisites

Install Docker Desktop/Engine with Compose v2 and Git for the container
workflow. Direct local checks also need Node.js 20, npm, and a complete JDK 17
with <code>javac</code>. The inventory and evaluator-facing dependency rationale
are in [DEPENDENCIES.md](DEPENDENCIES.md).

Commands that require a Docker daemon, hosted CI, provider key, or VM are
recorded with expected output in
[docs/SANDBOX-VALIDATION-RUNBOOK.md](docs/SANDBOX-VALIDATION-RUNBOOK.md).

## Clean-checkout quick start

~~~bash
git clone https://github.com/laiyaohao/ft_transcendence.git
cd ft_transcendence
cp .env.example .env
~~~

Before continuing, replace every <code>change-me</code> value in <code>.env</code>
with a real local secret. Use the same database password in all database
variables, a JWT secret of at least 32 random bytes, and a separate high-entropy
<code>LEARNING_MARKING_SYNC_KEY</code>.

~~~bash
make deps
make compose-config
make compose-up
make compose-ps
~~~

Expected result: <code>postgres</code>, <code>auth-service</code>,
<code>grading-service</code>, <code>learning-service</code>, and
<code>frontend</code> become healthy. Open <http://localhost:3000>; Adminer is
at <http://localhost:8080>. Use <code>make compose-logs</code> to investigate,
<code>make compose-down</code> to preserve volumes, and
<code>make compose-reset</code> only for disposable data.

## Configuration

[.env.example](.env.example) is the complete development variable template. It
must never be committed as <code>.env</code>.

| Variable | Purpose |
| --- | --- |
| <code>POSTGRES_*</code> | Local PostgreSQL account and database. |
| <code>JWT_SECRET</code> | Server-side signing key shared by services. |
| <code>LEARNING_MARKING_SYNC_KEY</code> | Private grading-to-learning hand-off key. |
| <code>AI_ENGINE_URL</code>, <code>AI_ENGINE_MODEL</code>, <code>AI_VISION_MODEL</code>, <code>AI_ENGINE_API_KEY</code> | OpenAI-compatible marking and OCR provider settings. |
| <code>NEXT_PUBLIC_*_API_URL</code> | Browser-visible development API origins. |
| <code>FRONTEND_ALLOWED_ORIGINS</code> | Browser origins permitted by backend CORS. |

Normal Compose is a development topology and publishes diagnostic service ports.
The production-shaped overlay exposes only Nginx and reads secrets from
<code>../secrets.txt</code>.

## Test accounts

Ordinary local development has no committed credentials. Create a Student at
<code>/signup</code>. To create the first Tutor, set all three
<code>BOOTSTRAP_TUTOR_*</code> values for one clean startup; existing Tutor
credentials are never reset.

The disposable offline E2E environment seeds only these temporary accounts:

| Role | Email | Password |
| --- | --- | --- |
| Tutor | <code>e2e.tutor@example.test</code> | <code>E2eTutor!Pass123</code> |
| Student | <code>e2e.student@example.test</code> | <code>E2eStudent!Pass123</code> |

## Development commands

| Command | Outcome |
| --- | --- |
| <code>make deps</code> | Installs locked root and frontend JavaScript dependencies. |
| <code>make compose-config</code> | Validates <code>.env</code> and development Compose configuration. |
| <code>make compose-up</code> / <code>make compose-down</code> | Starts / stops the development stack. |
| <code>make compose-ps</code> / <code>make compose-logs</code> | Shows health status / follows logs. |
| <code>make frontend-lint</code>, <code>make frontend-typecheck</code>, <code>make frontend-test</code> | Runs frontend checks. |
| <code>make backend-test</code> | Runs Maven verification for all services. |
| <code>make ci</code> | Runs the local pull-request-equivalent suite. |

Run <code>make help</code> for every target.

## Testing and validation

~~~bash
npm run test:readme
npm run verify:readme
make frontend-lint
make frontend-typecheck
make test
make ci
~~~

<code>npm run test:readme</code> tests the documentation verifier itself.
<code>npm run verify:readme</code> validates headings, local evidence links,
placeholder-free prose, module-table arithmetic, and quick-start command parity.
It does not award module points. <code>make ci</code> needs Docker and registry
access for its Compose stage. Use <code>git diff --check</code> before committing.

## Offline Compose browser tests

The browser suite uses deterministic local AI/OCR mock and seed services; it
does not use an OpenAI or DeepSeek key.

~~~bash
make e2e-chrome
make e2e-config
make e2e
~~~

On Linux use <code>make e2e-chrome-linux</code>. <code>make e2e</code> creates
a clean fixture stack, waits for healthy services, runs Playwright, and removes
its E2E containers and volume even after failure. Use <code>make e2e-up</code>,
<code>make e2e-test</code>, and <code>make e2e-down</code> to inspect stages.

## Deployment

The VM-only production-shaped deployment uses <code>lumina.sg</code> as a
temporary hosts-file name and a self-signed certificate. It is not a public
Internet deployment. Only the Nginx edge is published on ports 80 and 443.

~~~bash
cp .env.production.example .env.production
make production-secrets
chmod 600 ../secrets.txt
make vm-tls
make production-config
make production-up
make production-ps
~~~

Set the provider key only in <code>../secrets.txt</code>. OpenAI and DeepSeek
use the same <code>AI_ENGINE_API_KEY</code> variable; choose their endpoint and
model in <code>.env.production</code>. The complete VM-only procedure is in
[docs/production-transport.md](docs/production-transport.md).

## Security and privacy

- APIs enforce roles, resource ownership, validation, CORS, and response headers;
  see [learning hardening tests](backend/learning-service/src/test/java/com/fttranscendence/learning/security/SecurityHardeningIntegrationTest.java).
- Keep <code>.env</code>, <code>../secrets.txt</code>, provider keys, JWT
  secrets, and TLS private keys outside version control.
- Browser token storage remains a future hardening target; consider an HttpOnly,
  Secure, SameSite-cookie session design before an Internet launch.
- User-facing disclosures: [Privacy Policy](frontend/src/app/privacy/page.tsx)
  and [Terms](frontend/src/app/terms/page.tsx). Review them against the
  deployed provider and retention policy before public release.

## Continuous integration

[.github/workflows/ci.yml](.github/workflows/ci.yml) has two tiers:

- Pull requests run <code>Frontend checks</code>, three <code>Backend checks</code>
  matrix entries, and <code>Compose configuration and images</code>.
- <code>main</code>, nightly, and manual runs execute <code>Offline E2E</code>,
  retaining failure artefacts and Compose logs for 14 days.

Make the first four check names branch-protection requirements only after they
have successfully run. Keep <code>Offline E2E</code> post-merge until hosted
runner timing and reliability are measured.

## Module evidence

**Module catalogue status:** BLOCKED

The exact official 42 subject/module catalogue for this evaluation is not
checked into this repository. Therefore no point claim is made. This is a
ready-to-map feature inventory, not an assertion that it earns a module in
another subject version. See the
[module catalogue blocker log](docs/module-catalogue-blocker.md).

<!-- MODULE_SCORECARD_START -->
| Catalogue ID | Claim | Points | Implementation | Test | Status |
| --- | --- | ---: | --- | --- | --- |
| N/A | Exact evaluation catalogue is unavailable | 0 | [blocker log](docs/module-catalogue-blocker.md) | N/A | BLOCKED |
<!-- MODULE_SCORECARD_END -->

**Verified module total:** 0 / 14

After the official catalogue is added, replace the blocked row with one row per
claim, cite the official ID and point value, link implementation and passing
automated evidence, then run:

~~~bash
npm run verify:modules
~~~

The command fails until the documented verified total is at least 14; it cannot
turn a feature inventory into evaluation points by itself.

## Known limitations

- The official, versioned module catalogue is absent, so the requested 14-point
  assessment cannot yet be verified.
- VM-only TLS uses a self-signed certificate and temporary hosts-file entry.
- Provider-dependent OCR/marking needs a real key and deployment smoke test;
  offline E2E uses deterministic fixtures instead.
- Development Compose publishes diagnostic ports; use the production overlay
  for private service networking.

## Contributors

The repository header records the project contributors: lkoh, lwin, pzaw,
tyingchu, and ylai. Use normal pull requests, run relevant checks, and keep
feature documentation linked to implementation and tests.

## Licence

The root package metadata currently declares the ISC licence. Confirm the
team's intended distribution licence before publishing or public deployment.
