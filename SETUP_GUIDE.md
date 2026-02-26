# Setup Guide - First Time Setup

This guide walks you through setting up the assessment interview task for the first time.

## What You Need

- Docker Desktop installed and running
- Git
- A terminal/command prompt
- ~10 minutes

## Step-by-Step Setup

### 1. Navigate to the Project

```bash
cd /path/to/assessment-interview-task
```

### 2. Copy Environment File

```bash
cp backend/.env.example backend/.env
```

### 3. Start Docker Containers

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database
- Initialize database with seed data (automatically)
- Start PHP backend server
- Start React frontend dev server

**Wait ~30 seconds** for all services to be healthy.

**Note:** Dependencies are automatically installed during the Docker build process. No additional installation steps needed!

### 4. Verify Setup

**Check services are running:**
```bash
docker-compose ps
```

All should show "Up" and "healthy".

**Test the API:**
```bash
curl http://localhost:8002/api/assessment/results/d1111111-1111-1111-1111-111111111111
```

Should return JSON with assessment results.

**Open the frontend:**
```
http://localhost:3000
```

You should see the Assessment Results interface with pre-loaded data.

## Troubleshooting

### Database not initializing

```bash
# Check database logs
docker-compose logs db

# If needed, manually run migration
docker-compose exec db psql -U interview -d interview_db -f /docker-entrypoint-initdb.d/001_init_and_seed.sql
```

### Backend errors

```bash
# View logs
docker-compose logs backend

# Check PHP syntax
docker-compose exec backend php -l src/Domain/Assessment.php

# Verify composer installed correctly
docker-compose exec backend composer dump-autoload
```

### Frontend not loading

```bash
# View logs
docker-compose logs frontend

# Reinstall dependencies
docker-compose exec frontend rm -rf node_modules
docker-compose exec frontend npm install

# Check Vite config
docker-compose exec frontend cat vite.config.ts
```

### Port conflicts

If ports 3000, 5432, or 8000 are in use:

**Option 1:** Stop conflicting services
**Option 2:** Edit `docker-compose.yml` to use different ports

```yaml
ports:
  - "3001:3000"  # Frontend on 3001 instead
  - "8001:8000"  # Backend on 8001 instead
```

## Resetting Everything

To start fresh:

```bash
# Stop and remove all containers, networks, volumes
docker-compose down -v

# Restart
docker-compose up -d

# Reinstall dependencies
docker-compose exec backend composer install
docker-compose exec frontend npm install
```

## For Candidates

Once setup is complete:

1. Read [TASK.md](TASK.md) for the interview task
2. Start with the ERD exercise in [ERD_TEMPLATE.md](ERD_TEMPLATE.md)
3. Review the code in `backend/src/Domain/`
4. Test the API and frontend
5. Implement any improvements/fixes needed

## For Interviewers

After candidate completes setup:

1. Verify they can access http://localhost:3000
2. Verify API returns results
3. Give them the TASK.md to review
4. Start timer once they begin the ERD
5. Observe their approach and problem-solving

## Quick Reference

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | N/A |
| Backend API | http://localhost:8002 | N/A |
| Database | localhost:5432 | interview / password |
| DB Name | interview_db | - |

**Pre-seeded Instance ID:** `d1111111-1111-1111-1111-111111111111`

## Common Commands

```bash
# View all logs
docker-compose logs -f

# Restart a service
docker-compose restart backend

# Access database
docker-compose exec db psql -U interview -d interview_db

# Run SQL query
docker-compose exec db psql -U interview -d interview_db -c "SELECT * FROM assessment;"

# Access backend shell
docker-compose exec backend sh

# Access frontend shell
docker-compose exec frontend sh
```

## Next Steps

- [README.md](README.md) - Full project documentation
- [TASK.md](TASK.md) - Interview task description
- [ERD_TEMPLATE.md](ERD_TEMPLATE.md) - ERD exercise instructions
- [backend/README.md](backend/README.md) - Backend architecture
- [frontend/README.md](frontend/README.md) - Frontend details

Good luck! 🚀
