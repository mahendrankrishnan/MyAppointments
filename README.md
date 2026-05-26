# Appointment Management System

A full-stack appointment management application built with Angular 19, Fastify, TypeScript, Drizzle ORM, PostgreSQL, and Redis.

## Features

- ✅ Create appointments
- ✅ Edit appointments
- ✅ List all appointments
- ✅ Delete appointments
- ✅ Redis caching for improved performance
- ✅ Docker Compose for easy deployment

## Tech Stack

- **Frontend**: Angular 19
- **Backend**: Fastify with TypeScript
- **ORM**: Drizzle
- **Database**: PostgreSQL
- **Cache**: Redis
- **Deployment**: Docker Compose

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

## Quick Start with Docker

1. Clone the repository
2. Run the following command:

```bash
docker-compose up --build
```

This will start:
- PostgreSQL on port **5438**
- Redis on port **6379**
- Backend API on port **4206**
- Frontend UI on port **4205**

3. Access the application at `http://localhost:4205`

## Local Development

### Backend Setup

```bash
cd backend
npm install
npm run db:generate  # Generate migrations
npm run db:migrate   # Run migrations
npm run dev          # Start dev server
```

### Frontend Setup

```bash
cd frontend
npm install
npm start            # Start dev server on port 4205
```

## Database Migrations

To generate new migrations after schema changes:

```bash
cd backend
npm run db:generate
npm run db:migrate
```

## API Endpoints

- `GET /appointments` - Get all appointments
- `GET /appointments/:id` - Get single appointment
- `POST /appointments` - Create appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Delete appointment

## Environment Variables

For Docker Compose, copy `.env.example` to `.env` in the project root and set your values. Compose loads that file automatically.

### Backend

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `PORT` - Server port (default: 4206)
- `FRONTEND_URL` - Frontend URL for CORS

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── db/          # Database schema and migrations
│   │   ├── routes/      # API routes
│   │   └── config/      # Configuration files
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   └── app/         # Angular components and services
│   └── Dockerfile
└── docker-compose.yml
```

