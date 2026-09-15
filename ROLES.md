# Lumina team roles and defence ownership

## Purpose and status

This document assigns a primary speaker and maintenance owner to every project
area that the evaluation checklist requires. It is based on the tracked Git
history and the repository layout, not on unverified claims about work done
outside the repository.

Before the defence, the team must confirm the five roster names below and use
one canonical Git identity per person. The current README names `tyingchu`,
while Git contains both `tyingchun` and `yingchun`; this is treated as one
unresolved identity mapping, not proof of a sixth contributor.

## Team roles

| Team member | Git identity evidence | Primary role | Primary ownership and defence topic |
| --- | --- | --- | --- |
| `ylai` | Yao Hao Lai / Yao Hao LAI / `laiyaohao` | Project Manager and Technical Lead | Initial repository structure, frontend and Spring Boot scaffolding, authentication, shared architecture, pull-request integration, CI direction, and technical trade-offs. |
| `tyingchu` | `tyingchun` and `yingchun`, confirmation required | Lead Integration Developer | Learning and grading workflows, classes, worksheets, submission/OCR/marking integration, reports, Compose deployment, test hardening, and final documentation integration. |
| `lkoh` | Lyndy / `lyndykoh` | Product Owner and AI/OCR Developer | Learning workflow requirements, user-facing value, AI/OCR scope and limitations, and the original AI/OCR backend contribution. |
| `lwin` | `linnthit342` / `vbox-lwin` | Tutor Experience Developer | Tutor dashboard, classes, Students, worksheets, and marking pages; explain Tutor workflow and responsive UI choices. |
| `pzaw` | Jace / `pyaephyozaw16300` | Student Experience Developer | Student-facing routes, upload and worksheet experience, profile/progress/mistakes pages, navigation, and accessibility/responsive behaviour. |

The role labels describe current accountability for the defence and future
maintenance. Each person must confirm that the contribution statement reflects
their own work before it is copied into a submitted README or presented as an
individual claim.

## Evidence-backed contribution map

| Owner | Repository evidence | Demonstration they should lead |
| --- | --- | --- |
| `ylai` | [initial frontend scaffold](frontend), [auth-service](backend/auth-service), [security configuration](backend/auth-service/src/main/java/com/fttranscendence/authservice/config/SecurityConfig.java), and [CI workflow](.github/workflows/ci.yml) | Explain the three-service boundary, BCrypt and JWT authentication, why Flyway is service-owned, and how CI validates the stack. |
| `tyingchu` | [learning service](backend/learning-service), [grading service](backend/grading-service), [Compose topology](compose.yaml), [production overlay](compose.production.yaml), and [architecture documentation](docs/architecture.md) | Create or inspect a class and worksheet, trace a submission through OCR/review to mastery, then explain the private grading-to-learning hand-off. |
| `lkoh` | [AI/OCR integration](backend/grading-service/src/main/java/com/fttranscendence/grading/service/AiOcrService.java), [OCR tests](backend/grading-service/src/test/java/com/fttranscendence/grading/controller/OcrSubmissionFinalizationIntegrationTest.java), and [OCR observability runbook](docs/ocr-rollout-observability.md) | Explain provider configuration, retry and failure behaviour, why AI output is advisory, and where Tutor approval occurs. |
| `lwin` | [Tutor routes](frontend/src/app/%28main%29/tutor), [class UI](frontend/src/components/classes), [worksheet UI](frontend/src/components/worksheets), and [marking UI](frontend/src/components/marking) | Sign in as Tutor, create a class, enrol an existing Student, create or inspect a worksheet, and review results. |
| `pzaw` | [Student routes](frontend/src/app/%28main%29/student), [upload route](frontend/src/app/%28main%29/upload/page.tsx), [responsive E2E test](frontend/e2e/responsive-accessibility.spec.ts), and [browser-console E2E test](frontend/e2e/chrome-console.spec.ts) | Sign in as Student, open assigned work, upload/correct a page where configured, and show the interface at desktop and mobile widths. |

## Project-management approach

The visible delivery pattern is issue-based incremental work: commits name
individual issues, feature branches were merged through pull requests, and
later commits integrate, secure, format, document, and test those increments.
The project-management owner should maintain this cycle:

1. Define an independently demonstrable slice with acceptance checks.
2. Assign one primary owner and a reviewer from a different area.
3. Merge only after relevant unit/integration checks pass.
4. Re-run the shared verification commands after cross-service changes.
5. Record the feature, owner, test evidence, and any limitation in the README.

`ISSUES.md`, commit messages, pull-request history, and
[.github/workflows/ci.yml](.github/workflows/ci.yml) are the repository
evidence for this approach. Live meeting attendance and verbal participation
must be demonstrated at the evaluation; Git history cannot prove them.

## Requirement ownership

| Evaluation area | Accountable owner | Required evidence or action |
| --- | --- | --- |
| Team presence and individual explanations | Project Manager | Confirm all five members attend. Each person explains one feature in the contribution map and one cross-team decision. |
| Repository identity and Git collaboration | Project Manager | Show `git remote -v`, clone into an empty directory, `git log`, and the canonical identity mapping in this file. |
| README completeness | Project Manager + Lead Integration Developer | Keep project description, roles, management approach, technology rationale, database schema, feature ownership, individual contributions, and module scorecard current. |
| Frontend, backend, and database | Technical Lead + respective Developers | Explain [frontend](frontend), the three [backend](backend) services, and [database schema](docs/database-schema.md). |
| Single-command deployment | Lead Integration Developer | Demonstrate `make compose-up` with valid local secrets; use the [production transport runbook](docs/production-transport.md) for the HTTPS topology. |
| Chrome, responsiveness, and accessibility | Student Experience Developer + Tutor Experience Developer | Demonstrate desktop and mobile layouts and run the responsive and console E2E checks. |
| Privacy Policy and Terms of Use | Product Owner + Lead Integration Developer | Verify the global-footer links, [Privacy Policy](frontend/src/app/privacy/page.tsx), [Terms of Use](frontend/src/app/terms/page.tsx), and [legal-document tests](frontend/src/components/legal/LegalDocument.test.tsx). Keep provider, retention, jurisdiction, and support-contact disclosures deployment-accurate. |
| Credentials and authentication | Technical Lead | Show [.gitignore](.gitignore), [.env.example](.env.example), BCrypt configuration, JWT verification, and security tests. |
| Form validation and data access | Lead Integration Developer | Show frontend validation plus Spring `@Valid` constraints and authorization integration tests. |
| HTTPS and private services | Technical Lead + Lead Integration Developer | Demonstrate the Nginx production overlay and explain that local Compose is HTTP development only. |
| Module score and justification | Project Manager + Product Owner | Obtain the official subject/module catalogue, map only demonstrated modules, justify each claim, and reach a validated total of at least 14 points. |
| Test execution and final sign-off | All members | Run the documented checks, record actual results, resolve failures, and have each owner demonstrate their assigned workflow. |

## Technology rationale for the defence

| Technology | Why it is used |
| --- | --- |
| Next.js, React, and TypeScript | Browser routes, component-based Tutor and Student workflows, and typed frontend contracts. |
| Material UI and Emotion | The project styling solution, providing responsive components, themes, accessible controls, and consistent interaction patterns. |
| Spring Boot and Java 17 | Separate authenticated APIs with declarative validation, security filters, health checks, and testable services. |
| PostgreSQL and Flyway | Relational learning and grading records with versioned, service-owned migrations. |
| Docker Compose and Nginx | Repeatable multi-service development, offline E2E topology, and a private production-shaped HTTPS edge. |
| OpenAI-compatible AI/OCR provider | Optional marking and extraction assistance. Provider output remains advisory and requires Tutor approval. |

## Pre-defence gates

The following gates are not satisfied by documentation alone and must be closed
before claiming full evaluation readiness:

1. **Module score:** [README.md](README.md) currently declares `0 / 14` and
   marks the catalogue `BLOCKED`. The official subject/module catalogue is not
   tracked, so a passing 14-point claim cannot be made yet.
2. **Roster proof:** reconcile `tyingchu` with the `tyingchun`/`yingchun` Git
   identities, then have all five members confirm their role and contribution.
3. **Frontend lint:** `make frontend-lint` currently fails on the
   `react-hooks/set-state-in-effect` rule in five files: the mistakes page,
   Tutor worksheets page, `StudentList`, and two effects in `SyllabusPicker`.
   Resolve these failures and remove the now-unused lint-disable comments before
   presenting the CI-equivalent check as passing.
4. **Grading migration tests:** `backend/grading-service` verification currently
   fails two assertions in `MigrationIntegrationTest`: the test expects 8 and 6
   migrations but Flyway applies 11 and 9. Update the expected migration counts
   and re-run the service verification; do not mask the failure.
5. **Learning migration test:** `backend/learning-service` verification fails
   one `MigrationIntegrationTest` assertion because it expects 28 migrations
   while Flyway applies 30. Update the expectation and re-run the service
   verification; do not mask the failure.
6. **Runtime deployment proof:** run the Compose and Chrome demonstrations on a
   machine with a working Docker daemon and valid local secrets. A static review
   cannot prove the stack starts or the browser console is clean.
7. **Production legal details:** the checked-in legal pages deliberately avoid
   inventing the deployment operator, jurisdiction, support contact, provider
   region, and retention duration. The deployment operator must publish those
   facts before any public launch.
8. **Repository source verification:** demonstrate a fresh clone of the shown
   remote in an empty directory and review scripts/aliases in the evaluator's
   own shell.

## Defence sequence

1. Project Manager verifies attendance, repository remote, clean clone, and
   Git history.
2. Product Owner explains the learning problem, roles, AI limits, Privacy
   Policy, and Terms of Use.
3. Technical Lead explains architecture, security, environment variables,
   database boundaries, HTTPS, and test strategy.
4. Tutor and Student Experience Developers demonstrate their role-specific
   workflows at desktop and mobile widths.
5. Lead Integration Developer demonstrates the end-to-end submission,
   Tutor-review, and learning-insight flow, then runs the agreed checks.
6. The team maps the official module catalogue to working demonstrations and
   calculates the final validated score.
