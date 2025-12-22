# Docker Setup for Wealth Management CRM

This directory contains Docker configuration and documentation for the CRM system.

## Quick Start

From the root directory of the project:

```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

## Services

The application consists of four services:

### 1. PostgreSQL (Port 5432)
- Database server for storing all application data
- Uses PostgreSQL 15 Alpine image
- Data persisted in `postgres_data` volume
- Automatically initializes schema on first start

### 2. Redis (Port 6379)
- Caching and session management
- Uses Redis 7 Alpine image
- Data persisted in `redis_data` volume

### 3. Backend (Port 3001)
- NestJS application server
- API documentation at http://localhost:3001/api/docs
- Hot reload enabled in development
- Depends on PostgreSQL and Redis

### 4. Frontend (Port 3000)
- Next.js 14 application
- UI accessible at http://localhost:3000
- Hot reload enabled in development
- Depends on backend service

## First Time Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CRM
   ```

2. **Start services**
   ```bash
   docker-compose up
   ```

3. **Wait for initialization**
   - PostgreSQL will initialize the database schema
   - Backend will install dependencies and start
   - Frontend will install dependencies and start
   - First startup may take 2-5 minutes

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Documentation: http://localhost:3001/api/docs

5. **Login with default credentials**
   - Email: `admin@example.com`
   - Password: `Admin123!`

## Development

### Backend Development

```bash
# Access backend container
docker-compose exec backend sh

# Run tests
docker-compose exec backend npm test

# Run linter
docker-compose exec backend npm run lint

# Generate migration
docker-compose exec backend npm run migration:generate -- -n MigrationName

# Run migrations
docker-compose exec backend npm run migration:run
```

### Frontend Development

```bash
# Access frontend container
docker-compose exec frontend sh

# Run tests
docker-compose exec frontend npm test

# Run linter
docker-compose exec frontend npm run lint

# Type check
docker-compose exec frontend npm run type-check
```

### Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d crm_db

# Backup database
docker-compose exec postgres pg_dump -U postgres crm_db > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d crm_db
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Check what's using the port
lsof -i :3000  # or :3001, :5432, :6379

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Backend Won't Start

```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend container
docker-compose build backend
docker-compose up backend

# Clear node_modules and reinstall
docker-compose down
docker-compose up --build
```

### Frontend Won't Start

```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend container
docker-compose build frontend
docker-compose up frontend

# Clear Next.js cache
docker-compose exec frontend rm -rf .next
docker-compose restart frontend
```

### Reset Everything

If all else fails, completely reset:

```bash
# Stop all containers
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild and start fresh
docker-compose up --build
```

## Production Deployment

For production deployment, see:
- `/infrastructure/kubernetes/` for Kubernetes manifests
- `/infrastructure/terraform/` for cloud infrastructure
- `SECURITY.md` for security best practices
- `COMPLIANCE.md` for compliance requirements

## Environment Variables

### Backend
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_USER` - PostgreSQL username
- `DB_PASSWORD` - PostgreSQL password
- `DB_NAME` - Database name
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - JWT expiration time
- `REFRESH_TOKEN_SECRET` - Refresh token secret
- `REFRESH_TOKEN_EXPIRES_IN` - Refresh token expiration

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Health Checks

All services have health checks configured:

```bash
# Check service health
docker-compose ps

# Services should show "(healthy)" when ready
```

## Volumes

Data is persisted in Docker volumes:

- `postgres_data` - PostgreSQL database
- `redis_data` - Redis cache

To back up volumes:

```bash
# Backup PostgreSQL volume
docker run --rm -v crm_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore PostgreSQL volume
docker run --rm -v crm_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Networking

All services are on the `crm-network` bridge network, allowing them to communicate using service names as hostnames.

## Support

For issues or questions:
1. Check logs: `docker-compose logs [service]`
2. Review documentation in `/docs`
3. Create an issue in the repository
