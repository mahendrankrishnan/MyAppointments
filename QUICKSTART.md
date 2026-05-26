# Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Ports 4205, 4206, 5438, and 6379 available

## Start the Application

1. **Start all services with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Wait for all services to be ready:**
   - PostgreSQL will start on port 5438
   - Redis will start on port 6379
   - Backend will start on port 4206 (migrations run automatically)
   - Frontend will start on port 4205

3. **Access the application:**
   - Open your browser and navigate to: `http://localhost:4205`

## Features Available

- ✅ **List Appointments**: View all appointments on the home page
- ✅ **Create Appointment**: Click "New Appointment" button to create
- ✅ **Edit Appointment**: Click "Edit" on any appointment
- ✅ **Delete Appointment**: Click "Delete" on any appointment

## API Endpoints

The backend API is available at `http://localhost:4206`:

- `GET /appointments` - Get all appointments
- `GET /appointments/:id` - Get single appointment
- `POST /appointments` - Create appointment
- `PUT /appointments/:id` - Update appointment
- `DELETE /appointments/:id` - Delete appointment

## Stop the Application

Press `Ctrl+C` or run:
```bash
docker-compose down
```

To remove volumes (database data):
```bash
docker-compose down -v
```

## Troubleshooting

1. **Port conflicts**: Make sure ports 4205, 4206, 5438, and 6379 are not in use
2. **Database connection**: Wait for PostgreSQL to be healthy before backend starts
3. **Redis connection**: Wait for Redis to be healthy before backend starts
4. **Frontend not loading**: Check that backend is running and accessible

