# Validation Issues

Last checked: 2026-09-06

This file records unresolved validation blockers from the full-suite audit.
None is currently confirmed to be a behavior regression from the Phase 3
refactor.

## 1. Frontend unit suite does not complete reliably in this runner

**Status:** Unresolved validation blocker; likely test-harness resource
contention, not yet a confirmed application bug.

`make ci-frontend` passed lint and type checking, then its Vitest unit suite
produced widespread 15-second interaction timeouts and was stopped before a
final summary. The affected tests included `ManualResultForm`, marking-page
worksheet filters, `QuestionList`, `MarkingReview`, `QuestionForm`,
`ClassForm`, and `WorksheetBuilder`. React `act(...)` warnings were also
emitted for some of these tests.

Earlier baseline testing had already recorded timeouts in several overlapping
areas. The larger set observed during this run occurred while the full suite
was executing and has not been reproduced in an isolated serial test run.

**Required follow-up:** Run the frontend suite serially in a less constrained
environment and investigate any test that still exceeds its 15-second timeout.
Do not classify this as a refactor bug unless it reproduces outside the
resource-constrained run.

## 2. Production dependency audit cannot reach the npm registry

**Status:** Environment limitation.

`make security-audit` failed with:

```text
getaddrinfo ENOTFOUND registry.npmjs.org
```

No vulnerability result was returned, so the production dependency audit is
incomplete.

**Required follow-up:** Restore DNS/network access and rerun
`make security-audit`.

## 3. Docker-backed verification cannot run locally

**Status:** Environment limitation.

Docker CLI is installed, but its daemon socket is unavailable:

```text
failed to connect to the docker API at unix:///Users/yingchun/.docker/run/docker.sock
```

This blocks image builds and the disposable browser E2E workflow. It also
causes the PostgreSQL/Testcontainers checks to skip: Auth and Grading migration
tests, plus Learning migration and class-detail tests.

**Required follow-up:** Run `make ci-compose`, `make e2e`, and the skipped
Testcontainers tests in Docker-enabled CI or a Docker-enabled local environment.

## 4. Cross-layer integration suite remains pending

**Status:** Pending because the frontend unit suite did not complete in the
available audit window.

`npm run test:integration` was not run after the stalled frontend unit suite.

**Required follow-up:** After resolving or isolating Issue 1, run
`npm run test:integration` and record the result here.

## 5. Grading migration integration test has stale expectations

**Status:** Pre-existing test defect; unrelated to the Phase 4 refactor.

`MigrationIntegrationTest` has two failing assertions because it expects eight
migrations with version six, while the unchanged repository contains eleven
migrations through version twelve. No Grading migration files were modified
during the refactor.

The H2 migration checks still run successfully. The PostgreSQL-specific
migration check is separately skipped because Docker is unavailable (Issue 3).

**Required follow-up:** Update the stale expected migration count and version
in a separately authorized test-maintenance change, then run the grading
migration checks in Docker-enabled CI.
