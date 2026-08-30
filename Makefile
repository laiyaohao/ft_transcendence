COMPOSE_FILE := ./compose.yaml

ENV_FILE := ./.env

PRODUCTION_COMPOSE_FILES := -f ./compose.yaml -f ./compose.production.yaml
PRODUCTION_ENV_FILES := --env-file ./.env.production --env-file ../secrets.txt

# ifeq ($(origin DOMAIN_NAME), undefined)
# 	DOMAIN_NAME := $(strip $(shell grep ^DOMAIN_NAME $(ENV_FILE) | cut -d= -f2-))
# endif

# Default target when 'make' is run without arguments
all: up

# Build Docker images defined in docker-compose.yml
build:
	@echo "Building Docker images..."
	docker compose -f $(COMPOSE_FILE) build

# Bring up the services and build images if necessary
up: build
	@echo "Starting Docker containers..."
	docker compose -f $(COMPOSE_FILE) up

# Production secrets are read by Docker Compose from ../secrets.txt at runtime;
# they are not build arguments, image layers, or repository files.
production-config:
	@test -f ../secrets.txt || (echo "Missing external secrets file: ../secrets.txt"; exit 1)
	@test -f ./.env.production || (echo "Missing production config: ./.env.production"; exit 1)
	docker compose $(PRODUCTION_ENV_FILES) $(PRODUCTION_COMPOSE_FILES) config --quiet

production-secrets:
	@./scripts/generate-production-secrets.sh ../secrets.txt

vm-tls:
	@./scripts/generate-vm-tls.sh ../tls

production-up: production-config
	docker compose $(PRODUCTION_ENV_FILES) $(PRODUCTION_COMPOSE_FILES) up --build -d

# Stop and remove containers, networks
down:
	@echo "Stopping and removing Docker containers, networks"
	docker compose -f $(COMPOSE_FILE) down

# Remove volumes too
clean:
	@echo "Stopping and removing Docker containers, networks, and volumes..."
	docker compose -f $(COMPOSE_FILE) down --volumes

# Clean up dangling images (optional, but good for disk space)
fclean: clean
	@echo "Removing all stopped containers, all unused networks, all unused images, and all unused volumes..."
	docker system prune -a --volumes -f 

# Stop and remove containers, and then build and start them again
re: fclean up

# Run the frontend and backend test suites.
test:
	npm test

# Run only the cross-layer MVP integration suites.
test-integration:
	npm run test:integration

# Display help message
help:
	@echo "Available commands:"
	@echo "  make build    - Build Docker images as defined in ./compose.yaml"
	@echo "  make up       - Build and start all services in detached mode"
	@echo "  make production-config - Validate Lumina production configuration and external secrets"
	@echo "  make production-secrets - Create ../secrets.txt once (refuses to overwrite it)"
	@echo "  make vm-tls - Create a 30-day self-signed lumina.sg certificate for VM-only testing"
	@echo "  make production-up - Start the HTTPS production edge using ../secrets.txt"
	@echo "  make down     - Stop and remove all services, networks"
	@echo "  make clean    - Stop and remove all services, networks, and volumes"
	@echo "  make fclean   - Stop and remove all stopped containers, all unused networks, all unused images, and all unused volumes"
	@echo "  make re       - Rebuild and restart all services"
	@echo "  make test     - Run all automated test suites"
	@echo "  make test-integration - Run MVP integration test suites"
	@echo "  make help     - Display this help message"

# Declare phony targets to ensure they always run
.PHONY: all build up production-config production-secrets vm-tls production-up down clean fclean re test test-integration help
