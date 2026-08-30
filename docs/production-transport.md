# Production transport and headers

The production topology is an overlay, not a replacement for local development:

```bash
cp .env.example .env
cp .env.production.example .env.production
# Set every change-me value in .env, then replace every example value in
# .env.production with the real DNS hostname, matching HTTPS origin, and
# absolute certificate/key paths.
docker compose --env-file .env --env-file .env.production \
  -f compose.yaml -f compose.production.yaml config --quiet
docker compose --env-file .env --env-file .env.production \
  -f compose.yaml -f compose.production.yaml up --build -d
```

Only Nginx publishes host ports 80 and 443. HTTP redirects to HTTPS. PostgreSQL,
Adminer, the frontend, and all three application services have no production
host-port mapping. Adminer is also disabled by default; it can only be started
for a controlled maintenance session with `--profile maintenance` and remains
unpublished.

Nginx terminates TLS using the PEM certificate chain and private key mounted
from `TLS_CERT_PATH` and `TLS_KEY_PATH`. It accepts only `PUBLIC_APP_DOMAIN`,
adds HSTS after successful TLS negotiation, and forwards the original host,
client address chain, and HTTPS scheme to upstream services. It proxies the
same-origin browser prefixes as follows:

| Browser prefix | Service path after proxying |
| --- | --- |
| `/auth/` | auth-service `/` |
| `/learning/` | learning-service `/` |
| `/grading/` | grading-service `/` |

The production frontend is built with those relative prefixes, so no browser
request needs a direct backend origin. `FRONTEND_ALLOWED_ORIGINS` is still set
to exactly `https://PUBLIC_APP_DOMAIN` as defence in depth for backend CORS.
Do not add wildcard CORS or CSP entries. Add third-party origins only after an
approved and tested integration.

## Deployment smoke test

After real DNS and certificates are installed, verify the edge from outside the
Docker host:

```bash
curl -I http://PUBLIC_APP_DOMAIN/
curl -I https://PUBLIC_APP_DOMAIN/login
curl -fsS https://PUBLIC_APP_DOMAIN/healthz
curl -I https://PUBLIC_APP_DOMAIN/auth/api/auth/login
```

The first response must be a 301 HTTPS redirect. The HTTPS response must expose
`Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`,
and `Referrer-Policy`; the API process ports must not be reachable from the
Internet. Use an actual login and upload flow to prove forwarded HTTPS headers,
upload limits, and certificates in the target environment. Do not preload HSTS
until the selected domain and TLS operation have been stable.

## Deliberate boundary

The `application` Docker network is not marked `internal: true`: grading needs
outbound access to its configured AI/OCR provider. It remains private in the
important sense that no application service has a host-port mapping. Restrict
that egress at the host/firewall layer to the approved provider when the
deployment platform supports it.
