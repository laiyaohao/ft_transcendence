# Production transport and headers

The production topology is an overlay, not a replacement for local development.
It is configured for the public hostname `lumina.sg`:

```bash
cp .env.production.example .env.production
# Keep ../secrets.txt outside the repository. This creates it once with mode
# 600 and refuses to overwrite it. Replace the AI-provider key afterwards.
make production-secrets
make vm-tls
make production-config
make production-up
```

`make production-up` invokes Docker Compose with `--env-file .env.production`
and `--env-file ../secrets.txt`. Docker Compose reads the external file only at
container start and supplies its values as runtime environment variables; the
Dockerfiles do not copy or bake secrets into an image. `../secrets.txt` is
resolved from the repository root, so it belongs beside the repository folder.

## VM-only hostname and TLS

`make vm-tls` creates `../tls/fullchain.pem` and `../tls/privkey.pem`: a
30-day self-signed certificate for `lumina.sg`. It is only for a VM test and
refuses to overwrite existing files. On the browser machine, map the VM's IP
address to `lumina.sg` in the hosts file, then explicitly trust this local
certificate in the OS/browser before opening `https://lumina.sg`. HSTS remains
off in this profile to avoid pinning an untrusted test certificate. Do not use
this generated certificate on the public Internet.

## External secrets file

Generate the initial file once from the repository root:

```bash
make production-secrets
```

The generated `../secrets.txt` contains the database password, JWT signing
secret, marking-sync credential, and an initial Tutor password. It also has an
`AI_ENGINE_API_KEY` entry that must be replaced with a real key from the
approved AI provider before marking or OCR can work. That credential cannot be
generated locally because it is issued by the provider.

There is only one OpenAI API key; it is not split into OCR and response keys.
Paste it after `AI_ENGINE_API_KEY=` in `../secrets.txt`, without quotes or
spaces, and leave it server-side. The current implementation sends
OpenAI-compatible Chat Completions requests for both text marking and
base64-image OCR. The default `.env.production` profile uses OpenAI's endpoint
and an image-capable model for both paths. To use DeepSeek instead, change only
the endpoint and two model values to the commented DeepSeek profile, then paste
the DeepSeek key into the same `AI_ENGINE_API_KEY` field. A DeepSeek text-only
model cannot perform OCR; its configured vision model is required for that
path.

For a VM-only test, make the browser machine resolve `lumina.sg` to the VM
(for example, by a temporary hosts-file entry). HTTPS still needs a certificate
whose subject/SAN covers `lumina.sg`; a self-signed certificate is suitable
only when its issuing certificate is explicitly trusted by that test browser.

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
