# Issues awaiting product or deployment decisions

This log tracks only the parts of the requested issues that cannot be completed
truthfully or safely from the repository alone. Work that does not depend on a
decision continues separately.

## Issue 49 — Connect Student Subject Profile

**Confirmed:** the four tutor-confirmed diagnostic categories — concept,
keyword, expression, and application — are the learning dimensions for the
subject-profile screen. Implementation is in progress.

## Issue 50 — Harden validation, headers, secrets and transport

**Recommendation accepted pending deployment:** use a single public Nginx
edge, terminate TLS there, redirect HTTP to HTTPS, and publish only ports 80
and 443. Keep auth, grading, learning, PostgreSQL, and Adminer on the private
Compose network. Set `FRONTEND_ALLOWED_ORIGINS` to the final HTTPS application
origin only and enable HSTS after the TLS edge is verified. Keep the current
CSP deny-by-default; add external analytics or asset origins only when they are
actually introduced. Detailed risks and rollout guidance are in
`docs/DEPLOYMENT-AND-CI-RECOMMENDATIONS.md`.

## Issue 51 — Add Privacy Policy and Terms

**Confirmed:** create public documents based on the current build and
plain-language education privacy norms. They must not invent a legal contact,
jurisdiction, retention period, or unimplemented deletion/right workflow.
Implementation is in progress.

## Issue 52 — Verify responsive, accessible and Chrome-safe UI

**Confirmed:** use the current stable Chrome/Playwright Chromium and
deterministic browser assertions. Implementation is in progress.

## Issue 53 — Add MVP integration and E2E tests

**Confirmed:** use mock HTTP services in a Compose test override so the MVP
workflow runs offline in a Docker Compose virtual machine. Production Compose
wiring remains unchanged. Implementation is in progress.

## Issue 54 — Make the complete stack deployable with Compose

**Skipped at user request. Recommendation:** use the Nginx/private-network/TLS
edge described above; verify the PostgreSQL data mount, keep a named upload
volume, and create encrypted database/upload backups before a public launch.
Do not add Nginx or make port-exposure changes until the domain and certificate
source are available.

## Issue 55 — Configure CI/CD

**Skipped at user request. Recommendation:** require frontend, backend, Compose
configuration, and image-build checks for every pull request. Run the full
offline Compose/Playwright suite on `main`, nightly, and manually until timing
is measured; promote it to a required pull-request check only if it remains
reliable within the team's CI budget. Use descriptive stable check names before
configuring branch protection.
