*This project was created as part of the 42 curriculum by lkoh, lwin, pzaw, tyingchu, and ylai.*

# ft_transcendence

An education platform foundation for shared Tutor and Student workflows. The current codebase contains a Next.js frontend, Spring Boot authentication, grading/OCR, and learning-data services, plus PostgreSQL migrations for users, classes, schedules, canonical student profiles, and class memberships.

## Current foundation (Issues 01–07)

- Email/password authentication with BCrypt, signed JWTs, and distinct `TUTOR`/`STUDENT` authorities.
- Public Student registration; clients cannot self-assign the Tutor role.
- Role-aware protected frontend shell with logout and responsive navigation.
- Flyway-managed, service-isolated PostgreSQL schemas; Hibernate validates and never mutates production tables.
- Tutor-owned class and canonical student-profile entities, constraints, repositories, and migration tests.
- Grading and learning services independently verify auth-service identity claims.
- Unit, integration, security, H2 migration, and optional real-PostgreSQL Testcontainers coverage.
- A complete Compose topology for frontend, three backend services, PostgreSQL, and Adminer.

Class/student HTTP APIs and screens, worksheet generation, grading approval orchestration, and later product workflows are intentionally outside Issues 01–07. See [service boundaries](docs/architecture/service-boundaries.md) before adding them.

## Prerequisites

For the container workflow, install Docker Desktop/Engine with Compose v2. For direct local builds, install Node.js 20, npm, and a complete JDK 17 containing `javac`; a Java runtime alone cannot compile the backend. The full inventory and evaluator-facing library rationale are in [DEPENDENCIES.md](DEPENDENCIES.md). Commands that need a Docker daemon, public registry, VM, provider key, or GitHub Actions—together with expected outputs and result fields—are in [the sandbox validation runbook](docs/SANDBOX-VALIDATION-RUNBOOK.md).

## Configure and run

```bash
cp .env.example .env
```

Replace every `change-me` value in `.env`. `JWT_SECRET` must contain at least 32 random bytes. Then validate and start the whole stack:

```bash
make compose-config
make compose-up
make compose-ps
```

Open the frontend at `http://localhost:3000`, Adminer at `http://localhost:8080`, and health probes at ports 8081–8083 under `/actuator/health`.

Follow service logs with `make compose-logs`; stop the stack while preserving its database and upload volumes with `make compose-down`. `make compose-reset` intentionally deletes those disposable development volumes and must not be used for data you need to keep. Run `make help` for every available local, VM-only, CI-equivalent, and offline-E2E command.

There are no shared default login credentials for ordinary local development. Student accounts are created through `/signup`. To provision the first Tutor, set all three `BOOTSTRAP_TUTOR_*` values for one startup; the password is validated and BCrypt-hashed, existing Tutor credentials are never reset, and public signup still rejects `TUTOR`. Clear the bootstrap values after the account has been created.

The Compose database volume is persistent. Because the service schemas were isolated during the Issue 03 foundation, reset only disposable pre-migration development data before first use if an older database volume contains tables in `public`.

## Tutor completed-work upload

Tutors upload completed work through `/upload`. The page resolves a real
Tutor-owned class, an enrolled student, and an approved worksheet before it
accepts files; it never invents a class, student, worksheet, or page preview.
Choose JPG, PNG, or one PDF (up to 20 MB per file). Multiple image pages can be
previewed, removed, reordered, or replaced before submission.

Submitting creates one durable grading submission document containing the class,
student, worksheet, Tutor, original file metadata, stored page bytes, OCR
extractions, timestamps, and status. The browser then opens `/ocr` using that
saved submission ID, so a refresh reloads the same server-authorised OCR review
rather than temporary browser state. Only the Tutor who uploaded the document
can retrieve that OCR review; the grading service independently validates the
class/student/worksheet relationship with learning-service before accepting it.

## VM-only HTTPS Docker Compose runbook

This procedure starts the production-shaped Compose overlay on a virtual
machine without public DNS. It uses `lumina.sg` only as a local test hostname,
a temporary hosts-file entry, and a 30-day self-signed certificate. It is not a
public deployment procedure.

The production overlay publishes only Nginx on ports 80 and 443. PostgreSQL,
Adminer, the frontend, and all APIs remain private to the Compose network.

### 1. Prerequisites

Install Docker Engine/Desktop with Docker Compose v2 on the VM. Run the
following from the repository root:

```bash
docker compose version
git status --short
cp .env.production.example .env.production
make help
```

The copied `.env.production` contains no secrets. It configures the local
browser origin as `https://lumina.sg`, uses the OpenAI-compatible API endpoint,
and keeps HSTS disabled for the self-signed VM certificate.

### 2. Create and update the external secrets file

Secrets live one directory above the repository, at `../secrets.txt`. They are
loaded at container runtime by Docker Compose and are never copied into a
Docker image or committed to Git.

On a fresh VM, create the file once:

```bash
make production-secrets
chmod 600 ../secrets.txt
```

The generator refuses to overwrite an existing file. Open it locally and set
these values; do not paste any API key into source code, a browser, or chat:

```dotenv
# One OpenAI or DeepSeek server-side API key. Replace the generated placeholder.
AI_ENGINE_API_KEY=PASTE_YOUR_PROVIDER_KEY_HERE

# VM-only Tutor account. The bootstrap runs only for a fresh database and never
# resets an existing account password.
BOOTSTRAP_TUTOR_EMAIL=teacher@lumina.sg
BOOTSTRAP_TUTOR_PASSWORD=Demoteacher123!
BOOTSTRAP_TUTOR_FULL_NAME=Demo Teacher
```

OpenAI uses one API key for both text marking and image OCR in this application.
The default `.env.production` profile uses OpenAI's Chat Completions endpoint
and `gpt-4.1-mini` for both operations. To use DeepSeek instead, replace the
non-secret endpoint/model values in `.env.production` with the commented
DeepSeek profile, then paste the DeepSeek key into the same
`AI_ENGINE_API_KEY` line. Only one provider is active at a time.

### 3. Create VM-only TLS files

Create the self-signed certificate and private key outside the repository:

```bash
make vm-tls
openssl x509 -in ../tls/fullchain.pem -noout -subject -ext subjectAltName
```

The result must include `DNS:lumina.sg`. The private key is owner-readable only.
The script refuses to replace an existing certificate or key.

### 4. Route `lumina.sg` to the VM and trust the local certificate

On the machine running Chrome, replace `<VM_IP>` with the VM's reachable IP.
For macOS or Linux, add a temporary hosts-file entry:

```bash
sudo sh -c 'printf "%s\\n" "<VM_IP> lumina.sg" >> /etc/hosts'
getent hosts lumina.sg 2>/dev/null || dscacheutil -q host -a name lumina.sg
```

Trust the self-signed certificate on that same browser machine. On macOS, when
the repository and `../tls` directory are local to the Mac:

```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain "$(cd .. && pwd)/tls/fullchain.pem"
```

On Debian/Ubuntu Linux:

```bash
sudo install -m 644 ../tls/fullchain.pem /usr/local/share/ca-certificates/lumina-vm.crt
sudo update-ca-certificates
```

Do not use this self-signed certificate or its trust setting for an Internet
deployment. HSTS remains disabled in the VM profile so the browser does not pin
the temporary certificate.

### 5. Validate and start the stack

Run all Compose commands from the repository root:

```bash
make production-config
make production-up
make production-ps
```

Wait until every required service reports healthy, then verify the edge from
the browser machine:

```bash
curl --resolve lumina.sg:443:<VM_IP> --cacert ../tls/fullchain.pem \
  -I https://lumina.sg/login
curl --resolve lumina.sg:443:<VM_IP> --cacert ../tls/fullchain.pem \
  -fsS https://lumina.sg/healthz
curl --resolve lumina.sg:80:<VM_IP> -I http://lumina.sg/
```

The last command must return an HTTP-to-HTTPS redirect. Open
`https://lumina.sg` in Chrome only after the certificate is trusted. View
runtime logs with:

```bash
make production-logs
```

### 6. VM test accounts

The Tutor account is created automatically on the first startup of a fresh
database from `../secrets.txt`:

| Role | Email | Password |
| --- | --- | --- |
| Tutor | `teacher@lumina.sg` | `Demoteacher123!` |

Sign in at `https://lumina.sg/login`.

Create the Student through the public signup page once the stack is running:

| Role | Email | Password | Full name |
| --- | --- | --- | --- |
| Student | `student@lumina.sg` | `Demostudent123!` | `Demo Student` |

1. Open `https://lumina.sg/signup`.
2. Enter the Student details from the table and submit.
3. The application signs the Student in and provisions a minimal Student
   profile on the first learning-service request. No Tutor/class membership is
   assigned automatically.
4. Log out, sign in as the Tutor, then sign back in as the Student to confirm
   the role-specific dashboards and access controls.

If the Tutor bootstrap account already exists, changing the password in
`../secrets.txt` does not reset it. For a disposable VM test only, reset the
entire stack and database volumes, then start again:

```bash
make production-reset
make production-up
```

This command permanently deletes the VM's PostgreSQL and uploaded-document
volumes. Never use it against data you need to keep.

### Troubleshooting an existing local database

PostgreSQL applies `POSTGRES_PW` only when its data volume is first created.
After the first successful start, keep the same `POSTGRES_PW` in
`../secrets.txt`; do not regenerate that file for an existing database. If an
older local volume and a newly generated secrets file are combined, auth-service
will report `password authentication failed for user "lumina"` even though
PostgreSQL itself is healthy. Restore the password used when that volume was
created to preserve its data. For a disposable VM test, use the explicit
volume-reset command above instead.

### 7. Stop the VM stack

```bash
make production-down
```

This stops containers while preserving PostgreSQL and upload volumes. See
[production transport notes](docs/production-transport.md) for the production
certificate, HSTS, CORS, and provider rollout requirements.

## Build and test locally

Install locked JavaScript dependencies:

```bash
make deps
```

Run all checks:

```bash
make ci
```

`make ci` matches the pull-request quality gates: frontend lint, TypeScript, unit tests and build; a high/critical production-dependency audit; Maven verification for auth, grading and learning; Compose validation; and application image builds. Use the smaller targets when investigating a failure: `make frontend-lint`, `make frontend-typecheck`, `make frontend-test`, `make frontend-build`, `make security-audit`, `make backend-auth-test`, `make backend-grading-test`, `make backend-learning-test`, and `make test-integration`. PostgreSQL Testcontainers checks run when Docker is available and are skipped explicitly when it is not; deterministic H2 migration tests always run.

To validate the normal Compose file without copying a real environment file:

```bash
make ci-compose
```

## Offline Compose browser tests

The browser workflow suite runs against a clean, Docker Compose fixture stack: PostgreSQL, the three services, the frontend, deterministic AI/OCR mock, and a disposable seed service. It needs no OpenAI/DeepSeek key, external network service, or production secrets.

After installing the frontend dependencies above, install the Chrome channel if your machine does not already have current stable Chrome, then validate the fixture configuration and run it locally:

```bash
make e2e-chrome
make e2e-config
make e2e
```

On Linux, use `make e2e-chrome-linux` instead of `make e2e-chrome` to install
the native browser libraries used by CI.

`make e2e` always removes the fixture containers and E2E database volume when the test finishes, including after a failure. To run each phase separately use `make e2e-up`, `make e2e-test`, and `make e2e-down`; use `make e2e-reset` to explicitly delete a failed fixture stack and its volume. The seed accounts are `e2e.tutor@example.test` / `E2eTutor!Pass123` and `e2e.student@example.test` / `E2eStudent!Pass123`, and are valid only inside this disposable fixture environment.

## Continuous integration

GitHub Actions uses two CI tiers:

- Every pull request runs `Frontend checks`, including the high/critical production-dependency audit; the three expanded `Backend checks` entries (`auth-service`, `grading-service`, and `learning-service`); and `Compose configuration and images`. These are the recommended branch-protection required checks once they have completed successfully on the repository.
- Pushes to `main`, the nightly scheduled run, and manual workflow dispatch also run `Offline E2E`. It starts the offline fixture stack, runs the Chrome Playwright suite, retains failure screenshots/traces/video and Compose logs for 14 days, and then deletes the stack and volumes. It is deliberately not a pull-request required check until hosted-runner timing and reliability are measured.

The current offline suite verifies its existing seeded browser workflows. It is not a claim that every future MVP workflow has E2E coverage; add the remaining deterministic fixture scenarios before promoting `Offline E2E` to a required pull-request check. An intentional failing test should make its corresponding GitHub Action job fail; use that in a test pull request to verify repository branch protection after enabling the checks.

## Database ownership

The services share one PostgreSQL instance while owning separate schemas:

- `auth`: accounts and role identity.
- `grading`: submissions, OCR, and advisory marking data.
- `learning`: classes, schedules, student profiles, and memberships.

Flyway owns every schema change and stores independent history in each service schema. Cross-service relationships use stable auth `userId` values rather than unsafe database foreign keys between services.
