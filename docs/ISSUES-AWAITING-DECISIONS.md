# Issues awaiting product or deployment decisions

This log tracks only the parts of the requested issues that cannot be completed
truthfully or safely from the repository alone. Work that does not depend on a
decision continues separately.

## Issue 49 — Connect Student Subject Profile

**Decision needed:** confirm whether the four tutor-confirmed diagnostic
categories — concept, keyword, expression, and application — are the intended
"learning dimensions" for the subject-profile screen. The existing API already
has those categories as evidence-backed findings, but it does not expose a
separate dimensions summary.

## Issue 50 — Harden validation, headers, secrets and transport

**Decision needed:** provide the production frontend origin(s), CSP allowances
(including any analytics or external assets), and the HTTPS/TLS termination
location. The application can provide secure defaults and environment-based
configuration, but it must not invent a production domain or silently assume
that TLS terminates at a proxy.

## Issue 51 — Add Privacy Policy and Terms

**Decision needed:** approve the authoritative privacy and legal claims:
responsible organisation/contact, governing jurisdiction, retention/deletion
periods for accounts and uploads, AI/OCR provider disclosure, and how users
exercise data rights. Pages will not make unverified promises about student
data processing.

## Issue 52 — Verify responsive, accessible and Chrome-safe UI

**Decision needed:** confirm the supported Chrome release range and whether the
accessibility gate must use a specific scanner (for example axe) or the
repository may use deterministic browser assertions without a new dependency.

## Issue 53 — Add MVP integration and E2E tests

**Decision needed:** choose the deterministic AI/OCR test seam: in-process
fixture/profile, mock HTTP services in Compose, or a dedicated fixture service.
This controls production wiring, CI startup, and the fidelity of the browser
flows.

## Issue 54 — Make the complete stack deployable with Compose

**Decision needed:** provide the deployment domain, TLS termination strategy,
whether direct backend ports remain reachable, and the backup/retention policy
for PostgreSQL and uploaded documents. Nginx cannot be configured securely for
an invented hostname or certificate source.

## Issue 55 — Configure CI/CD

**Decision needed:** confirm the GitHub branch-protection/required-check names
and whether CI should run the full Compose browser suite on every pull request
or reserve it for a scheduled/manual workflow. This determines expected CI
duration and required hosted-runner capabilities.
