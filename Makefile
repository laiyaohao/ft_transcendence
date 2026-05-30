COMPOSE_FILE := ./compose.yaml

ENV_FILE := ./.env

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

# Display help message
help:
	@echo "Available commands:"
	@echo "  make build    - Build Docker images as defined in ./compose.yaml"
	@echo "  make up       - Build and start all services in detached mode"
	@echo "  make down     - Stop and remove all services, networks"
	@echo "  make clean    - Stop and remove all services, networks, and volumes"
	@echo "  make fclean   - Stop and remove all stopped containers, all unused networks, all unused images, and all unused volumes"
	@echo "  make re       - Rebuild and restart all services"
	@echo "  make help     - Display this help message"

# Declare phony targets to ensure they always run
.PHONY: all build up down clean fclean re help
