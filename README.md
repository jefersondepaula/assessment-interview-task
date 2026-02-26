# Assessment Results System - Technical Interview Task

> **📋 First time here?** Read [SUBMISSION_INSTRUCTIONS.md](SUBMISSION_INSTRUCTIONS.md) for how to complete and submit this assessment.

A simplified assessment management system focusing on results calculation and display. This project demonstrates working with multi-entity domain models, business logic, and full-stack development.

## Project Overview

This is a teaching assessment platform that calculates and displays results from self-assessments. The system includes:
- **Backend**: Symfony 6.4 (PHP 8.1) with Doctrine ORM
- **Frontend**: React 18 with TypeScript and Vite
- **Database**: PostgreSQL 15
- **Architecture**: Domain-Driven Design with Repository and Service patterns

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Setup

1. **Clone and start the containers:**
   ```bash
   git clone <repository-url>
   cd assessment-interview-task
   docker-compose up -d
   ```

   Dependencies are automatically installed during the Docker build. Wait ~30 seconds for services to be ready.

2. **Access the applications:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8002
   - Database: localhost:5432 (credentials in `.env.example`)

### Database Setup

The database is automatically initialized with the migration script when the containers start. The seed data includes:
- 1 assessment template (element "1.1")
- 4 questions (3 Likert scale + 1 reflection)
- 1 session with 1 instance
- Partial answers (2/3 Likert questions answered)

**Pre-seeded Instance ID:** `d1111111-1111-1111-1111-111111111111`

### Testing the API

```bash
# Get assessment results
curl http://localhost:8002/api/assessment/results/d1111111-1111-1111-1111-111111111111
```

**Expected Response:**
```json
{
  "instance": {
    "id": "d1111111-1111-1111-1111-111111111111",
    "completed": false,
    "element": "1.1"
  },
  "total_questions": 4,
  "answered_questions": 2,
  "completion_percentage": 50,
  "scores": {
    "total_score": 9,
    "max_score": 15,
    "percentage": 53.85
  },
  "insights": [...]
}
```

## Architecture

### Backend Structure

```
backend/
├── config/
│   └── packages/          # Symfony configuration
├── src/
│   ├── Controller/
│   │   └── Assessment/    # API endpoints
│   ├── Domain/            # Domain entities, services
│   │   ├── Assessment.php
│   │   ├── AssessmentQuestion.php
│   │   ├── AssessmentAnswerOption.php
│   │   ├── AssessmentSession.php
│   │   ├── AssessmentInstance.php
│   │   ├── AssessmentAnswer.php
│   │   ├── AssessmentRepository.php
│   │   └── AssessmentService.php
│   └── Entity/            # Supporting entities
└── migrations/            # Database initialization
```

### Frontend Structure

```
frontend/
└── src/
    ├── components/
    │   └── AssessmentResults.tsx  # Main results display
    ├── App.tsx                     # Main application
    └── main.tsx                    # Entry point
```

### Data Model

**Key Relationships:**
- `Assessment` (template) ← ManyToMany → `AssessmentQuestion`
- `AssessmentQuestion` ← OneToMany → `AssessmentAnswerOption`
- `AssessmentSession` ← OneToMany → `AssessmentInstance`
- `AssessmentInstance` ← OneToMany → `AssessmentAnswer`
- `AssessmentAnswer` → `AssessmentAnswerOption` (ManyToOne)

## Scoring Algorithm

The system uses a normalization formula to convert Likert scale (1-5) to percentage (0-100%):

```
normalized_score = (total_score - answered_count) / (max_score - answered_count) * 100
```

**Example:**
- Answered 2 questions: scores of 4 and 5
- total_score = 9, max_score = 10, answered = 2
- normalized = (9 - 2) / (10 - 2) * 100 = 87.5%

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Stop all services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d

# Access database
docker-compose exec db psql -U interview -d interview_db

# Run backend shell
docker-compose exec backend sh

# Run frontend shell
docker-compose exec frontend sh
```

## Troubleshooting

**Backend not starting:**
- Check logs: `docker-compose logs backend`
- Verify composer install completed
- Ensure database is healthy: `docker-compose ps`

**Frontend not starting:**
- Check logs: `docker-compose logs frontend`
- Verify npm install completed
- Clear node_modules: `docker-compose exec frontend rm -rf node_modules && npm install`

**Database connection issues:**
- Ensure database container is healthy
- Check DATABASE_URL in `.env`
- Wait for database to fully initialize (check logs)

**API returns 404:**
- Verify Symfony routes are loaded: `docker-compose exec backend bin/console debug:router`
- Check controller namespaces and annotations

## Development Notes

- No authentication required - focus is on assessment logic
- Entities use Doctrine annotations for ORM mapping
- Timestamps handled by Gedmo Timestampable
- Repository extends Doctrine EntityRepository
- Service layer handles business logic
- Frontend uses Axios for API calls
- Styling uses plain CSS (no framework dependency)

## License

MIT - Created for technical interview purposes
