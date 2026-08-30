# Deployment and CI recommendations

## Issue 50 — production transport and headers

Recommended topology: expose a single Nginx edge on ports 80 and 443, redirect
HTTP to HTTPS, and terminate TLS at Nginx. Place the frontend and the three
application services on the private Compose network. Do not publish PostgreSQL,
Adminer, auth, grading, or learning ports in production.

After the public application origin is known, set `FRONTEND_ALLOWED_ORIGINS` to
that one HTTPS origin and set `SECURITY_HEADERS_HSTS_ENABLED=true`. The current
CSP starts from `self` and explicitly permits only the configured API origins.
Add an analytics, font, image, or other third-party origin only when the
integration is approved and tested; do not use wildcard CSP directives.

Current risks to resolve before launch:

- The deployment domain and certificate source are not yet selected.
- Browser tokens are currently stored in local storage. A future security
  review should consider an HttpOnly, Secure, SameSite cookie session design.
- The production operator must provide real, high-entropy environment secrets;
  template `change-me` values are intentionally rejected by the services.
- TLS termination, reverse-proxy forwarding, and HSTS need a real deployment
  smoke test, not only application-level tests.

## Issue 54 — deployment

Before enabling a public deployment, verify persistence with an empty-volume
startup, a restart, and a database/upload recovery exercise. Keep PostgreSQL
and uploads in named volumes, back both up on a documented schedule, encrypt
backup storage, and test restoration. The existing Compose configuration should
gain Nginx only after its hostname, certificate strategy, and public routing are
known.

## Issue 55 — CI

Use two tiers:

1. Every pull request: frontend lint, typecheck, unit tests and build; Maven
   verify for all services; Compose syntax validation; container image builds.
2. `main`, nightly, and manual dispatch: the offline Compose fixture stack and
   complete Playwright workflow suite.

Recommended required-check names are `Frontend checks`, the three expanded
`Backend checks` matrix entries, and `Compose configuration and images`. Add a
separate `Offline E2E` check after the fixture stack has demonstrated stable
runtime and cleanup on GitHub-hosted runners.

Known work still needed before CI can enforce full MVP E2E: deterministic
fixture data and test-only users, Compose readiness/teardown checks, and a
non-interactive browser artifact policy for failure screenshots/traces.
