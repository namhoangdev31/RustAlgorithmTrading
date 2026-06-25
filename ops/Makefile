.PHONY: up up-all build build-all up-build down restart logs ps clean clean-all

ENV_FILE=--env-file ../.env
PROFILES=--profile trading

up:
	docker compose $(ENV_FILE) up -d

up-all:
	docker compose $(ENV_FILE) $(PROFILES) up -d

build:
	docker compose $(ENV_FILE) build

build-all:
	docker compose $(ENV_FILE) $(PROFILES) build

up-build:
	docker compose $(ENV_FILE) $(PROFILES) up -d --build

down:
	docker compose $(ENV_FILE) $(PROFILES) down

restart:
	docker compose $(ENV_FILE) $(PROFILES) restart

logs:
	docker compose $(ENV_FILE) $(PROFILES) logs -f

ps:
	docker compose $(ENV_FILE) $(PROFILES) ps

clean:
	docker system prune -f
	docker builder prune -f

clean-all:
	docker system prune -a --volumes -f
