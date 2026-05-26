# Backend Testing

This directory contains comprehensive tests for the appointment management backend API.

## Test Structure

### Unit Tests (`appointments.test.ts`)
Tests the appointment routes with mocked dependencies:
- **GET /appointments** - Fetch all appointments (with caching)
- **GET /appointments/:id** - Fetch single appointment (with caching)
- **POST /appointments** - Create new appointment (with validation)
- **PUT /appointments/:id** - Update existing appointment
- **DELETE /appointments/:id** - Delete appointment

### Integration Tests (`integration.test.ts`)
Tests the Fastify application setup and routing:
- Route registration verification
- Invalid route handling
- HTTP method validation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

The tests provide comprehensive coverage of:
- ✅ HTTP route handlers
- ✅ Input validation (Zod schemas)
- ✅ Error handling (404, 500 responses)
- ✅ Redis caching logic
- ✅ Database operations (mocked)

## Mocking Strategy

- **Database**: Drizzle ORM operations are mocked to avoid real database connections
- **Redis**: All Redis operations are mocked for consistent testing
- **Database Init**: Database initialization is mocked to prevent migrations during tests

## Test Data

Tests use realistic appointment data structures:
```typescript
{
  id: number,
  title: string,
  description?: string,
  appointmentDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## CI/CD Integration

These tests are designed to run in CI/CD pipelines and provide fast feedback on code changes. The mocking strategy ensures tests run quickly without external dependencies.