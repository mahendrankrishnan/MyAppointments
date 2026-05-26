import { FastifyInstance } from 'fastify';
import { appointmentRoutes } from '../src/routes/appointments';

describe('Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = require('fastify')();
    await app.register(appointmentRoutes);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should register routes correctly', async () => {
    const routes = app.printRoutes();
    expect(routes).toContain('appointments');
    expect(routes).toContain('GET');
    expect(routes).toContain('POST');
    expect(routes).toContain('PUT');
    expect(routes).toContain('DELETE');
  });

  it('should handle invalid routes', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/invalid-route',
    });

    expect(response.statusCode).toBe(404);
  });

  it('should handle invalid HTTP methods on valid routes', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/appointments',
    });

    // Fastify returns 404 for unsupported methods on routes that don't exist
    expect(response.statusCode).toBe(404);
  });
});