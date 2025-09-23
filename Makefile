# DojoPool Build Scripts

# Build all services for production
build:prod:
	docker-compose -f docker-compose.production.yml build --no-cache

# Build specific service
build:api:
	docker build -f services/api/Dockerfile.prod -t dojopool-api:latest .

build:web:
	docker build -f apps/web/Dockerfile.prod -t dojopool-web:latest .

# Development environment
dev:up:
	docker-compose -f docker-compose.development.yml up -d

dev:down:
	docker-compose -f docker-compose.development.yml down

dev:logs:
	docker-compose -f docker-compose.development.yml logs -f

# Production environment
prod:up:
	docker-compose -f docker-compose.production.yml up -d

prod:down:
	docker-compose -f docker-compose.production.yml down

prod:logs:
	docker-compose -f docker-compose.production.yml logs -f

# Database operations
db:migrate:
	docker-compose -f docker-compose.production.yml exec api yarn prisma:migrate

db:seed:
	docker-compose -f docker-compose.production.yml exec api yarn seed:achievements

# Health checks
health:check:
	curl -f http://localhost:3002/health && curl -f http://localhost:3000/api/health

# Cleanup
clean:all:
	docker-compose -f docker-compose.development.yml down -v
	docker-compose -f docker-compose.production.yml down -v
	docker system prune -f

# Security scan
security:scan:
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image dojopool-api:latest
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		aquasec/trivy image dojopool-web:latest
