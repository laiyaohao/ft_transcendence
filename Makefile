COMPOSE_FILE := ./compose.yaml
ENV_FILE := ./.env
TEMPLATE_ENV_FILE := ./.env.example

COMPOSE := docker compose --env-file $(ENV_FILE) -f $(COMPOSE_FILE)
TEMPLATE_COMPOSE := docker compose --env-file $(TEMPLATE_ENV_FILE) -f $(COMPOSE_FILE)

E2E_ENV_FILE := ./compose.e2e.env
E2E_COMPOSE_FILES := -f ./compose.yaml -f ./compose.e2e.yaml
E2E_COMPOSE := docker compose --env-file $(E2E_ENV_FILE) $(E2E_COMPOSE_FILES) --profile e2e

PRODUCTION_COMPOSE_FILES := -f ./compose.yaml -f ./compose.production.yaml
PRODUCTION_ENV_FILES := --env-file ./.env.production --env-file ../secrets.txt
PRODUCTION_COMPOSE := docker compose $(PRODUCTION_ENV_FILES) $(PRODUCTION_COMPOSE_FILES)

.DEFAULT_GOAL := help

all: compose-up

## Development Compose commands
compose-config:
	$(COMPOSE) config --quiet

compose-build: compose-config
	$(COMPOSE) build

compose-up: compose-config
	$(COMPOSE) up --build -d

compose-ps:
	$(COMPOSE) ps

compose-logs:
	$(COMPOSE) logs -f

compose-down:
	$(COMPOSE) down

compose-restart:
	$(COMPOSE) restart

# Removes development PostgreSQL and upload volumes. Use only for disposable data.
compose-reset:
	$(COMPOSE) down --volumes --remove-orphans

# Backwards-compatible aliases.
build: compose-build
up: compose-up
down: compose-down
clean: compose-reset
re: compose-reset compose-up

# Explicitly broad Docker cleanup; never part of the default workflow.
fclean: compose-reset
	docker system prune -a --volumes -f

## Local validation commands
deps:
	npm ci
	npm --prefix frontend ci

frontend-deps:
	npm --prefix frontend ci

frontend-lint:
	npm --prefix frontend run lint

frontend-typecheck:
	npm --prefix frontend run typecheck

frontend-test:
	npm --prefix frontend test

frontend-build:
	npm --prefix frontend run build

backend-auth-test:
	./backend/auth-service/mvnw -f backend/auth-service/pom.xml verify

backend-grading-test:
	./backend/auth-service/mvnw -f backend/grading-service/pom.xml verify

backend-learning-test:
	./backend/auth-service/mvnw -f backend/learning-service/pom.xml verify

backend-auth-build:
	./backend/auth-service/mvnw -f backend/auth-service/pom.xml package -DskipTests

backend-grading-build:
	./backend/auth-service/mvnw -f backend/grading-service/pom.xml package -DskipTests

backend-learning-build:
	./backend/auth-service/mvnw -f backend/learning-service/pom.xml package -DskipTests

backend-test: backend-auth-test backend-grading-test backend-learning-test

backend-build: backend-auth-build backend-grading-build backend-learning-build

test: frontend-test backend-test

test-integration:
	npm run test:integration

ci-frontend: frontend-lint frontend-typecheck frontend-test frontend-build

ci-backend: backend-test

security-audit:
	npm --prefix frontend audit --omit=dev --audit-level=high

ci-compose:
	$(TEMPLATE_COMPOSE) config --quiet
	$(TEMPLATE_COMPOSE) build

ci: ci-frontend ci-backend security-audit ci-compose

## Disposable offline Compose + Playwright commands
e2e-config:
	$(E2E_COMPOSE) config --quiet

e2e-build: e2e-config
	$(E2E_COMPOSE) build

e2e-up: e2e-config
	$(E2E_COMPOSE) up --build --wait --wait-timeout 180

e2e-test:
	npm --prefix frontend run test:e2e:ci

# Installs the Chrome channel Playwright uses for the offline browser suite.
e2e-chrome:
	npx --prefix frontend playwright install chrome

# CI-equivalent Chrome setup for Linux; it also installs native browser libraries.
e2e-chrome-linux:
	npx --prefix frontend playwright install --with-deps chrome

e2e-down:
	$(E2E_COMPOSE) down --remove-orphans

# Removes the disposable E2E database volume. It must not be used for real data.
e2e-reset:
	$(E2E_COMPOSE) down --volumes --remove-orphans

# Start the fixture stack, run browser tests, then clean it up even after failure.
e2e: e2e-config
	@set -e; \
	trap '$(E2E_COMPOSE) down --volumes --remove-orphans' EXIT; \
	$(E2E_COMPOSE) up --build --wait --wait-timeout 180; \
	npm --prefix frontend run test:e2e:ci

## VM-only production-shaped Compose commands
production-config:
	@test -f ../secrets.txt || (echo "Missing external secrets file: ../secrets.txt"; exit 1)
	@test -f ./.env.production || (echo "Missing production config: ./.env.production"; exit 1)
	$(PRODUCTION_COMPOSE) config --quiet

production-secrets:
	@./scripts/generate-production-secrets.sh ../secrets.txt

vm-tls:
	@./scripts/generate-vm-tls.sh ../tls

production-build: production-config
	$(PRODUCTION_COMPOSE) build

production-up: production-config
	$(PRODUCTION_COMPOSE) up --build -d

production-ps: production-config
	$(PRODUCTION_COMPOSE) ps

production-logs: production-config
	$(PRODUCTION_COMPOSE) logs -f

production-down: production-config
	$(PRODUCTION_COMPOSE) down

production-restart: production-config
	$(PRODUCTION_COMPOSE) restart

# Deletes production-shaped test data and volumes. Use only for a disposable VM test.
production-reset: production-config
	$(PRODUCTION_COMPOSE) down --volumes --remove-orphans

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  compose-config     Validate .env and development Compose configuration"
	@echo "  compose-build      Build development application images"
	@echo "  compose-up         Start the development stack in the background"
	@echo "  compose-ps         Show development service status"
	@echo "  compose-logs       Follow development service logs"
	@echo "  compose-down       Stop development containers, preserving volumes"
	@echo "  compose-restart    Restart development containers"
	@echo "  compose-reset      Delete disposable development containers and volumes"
	@echo ""
	@echo "Checks:"
	@echo "  deps              Install locked root and frontend JavaScript dependencies"
	@echo "  frontend-deps     Install locked frontend JavaScript dependencies"
	@echo "  frontend-lint | frontend-typecheck | frontend-test | frontend-build"
	@echo "  backend-auth-test | backend-grading-test | backend-learning-test"
	@echo "  test              Run frontend and all backend verification suites"
	@echo "  test-integration  Run cross-layer integration suites"
	@echo "  security-audit    Fail on high/critical production dependency advisories"
	@echo "  ci                Run the PR-equivalent checks locally"
	@echo ""
	@echo "Offline browser E2E (disposable fixture data):"
	@echo "  e2e-config | e2e-build | e2e-up | e2e-test | e2e-chrome | e2e-chrome-linux | e2e-down | e2e-reset"
	@echo "  e2e               Start, test, and remove the fixture stack"
	@echo ""
	@echo "VM-only HTTPS stack:"
	@echo "  production-secrets | vm-tls | production-config | production-build"
	@echo "  production-up | production-ps | production-logs | production-down"
	@echo "  production-restart | production-reset"
	@echo ""
	@echo "Compatibility aliases: build, up, down, clean, re."
	@echo "fclean also runs a broad Docker system prune; use it deliberately."

.PHONY: all \
	compose-config compose-build compose-up compose-ps compose-logs compose-down compose-restart compose-reset \
	build up down clean re fclean \
	deps frontend-deps frontend-lint frontend-typecheck frontend-test frontend-build \
	backend-auth-test backend-grading-test backend-learning-test \
	backend-auth-build backend-grading-build backend-learning-build backend-test backend-build test test-integration \
	ci-frontend ci-backend security-audit ci-compose ci \
	e2e-config e2e-build e2e-up e2e-test e2e-chrome e2e-chrome-linux e2e-down e2e-reset e2e \
	production-config production-secrets vm-tls production-build production-up production-ps production-logs production-down production-restart production-reset \
	help
