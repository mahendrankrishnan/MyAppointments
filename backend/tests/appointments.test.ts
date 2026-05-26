import { FastifyInstance } from 'fastify';
import { appointmentRoutes } from '../src/routes/appointments';
import { db } from '../src/db';
import { redisClient } from '../src/config/redis';
import { appointments } from '../src/db/schema';

const mockedDb = db as jest.Mocked<typeof db>;
const mockedRedis = redisClient as jest.Mocked<typeof redisClient>;

describe('Appointment Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = require('fastify')();
    await app.register(appointmentRoutes);

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /appointments', () => {
    it('should return cached appointments', async () => {
      const cachedAppointments = [{ id: 1, title: 'Test Appointment' }];
      mockedRedis.get.mockResolvedValue(JSON.stringify(cachedAppointments));

      const response = await app.inject({
        method: 'GET',
        url: '/appointments',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(cachedAppointments);
      expect(mockedRedis.get).toHaveBeenCalledWith('appointments:all');
      expect(mockedDb.select).not.toHaveBeenCalled();
    });

    it('should fetch from database when not cached', async () => {
      const dbAppointments = [{ id: 1, title: 'Test Appointment' }];
      mockedRedis.get.mockResolvedValue(null);
      mockedDb.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(dbAppointments),
      } as any);

      const response = await app.inject({
        method: 'GET',
        url: '/appointments',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(dbAppointments);
      expect(mockedRedis.get).toHaveBeenCalledWith('appointments:all');
      expect(mockedRedis.setEx).toHaveBeenCalledWith('appointments:all', 60, JSON.stringify(dbAppointments));
    });

    it('should handle database errors', async () => {
      mockedRedis.get.mockResolvedValue(null);
      mockedDb.select.mockReturnValue({
        from: jest.fn().mockRejectedValue(new Error('Database error')),
      } as any);

      const response = await app.inject({
        method: 'GET',
        url: '/appointments',
      });

      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.payload)).toEqual({ error: 'Failed to fetch appointments' });
    });
  });

  describe('GET /appointments/:id', () => {
    it('should return cached appointment', async () => {
      const cachedAppointment = { id: 1, title: 'Test Appointment' };
      mockedRedis.get.mockResolvedValue(JSON.stringify(cachedAppointment));

      const response = await app.inject({
        method: 'GET',
        url: '/appointments/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(cachedAppointment);
      expect(mockedRedis.get).toHaveBeenCalledWith('appointments:1');
    });

    it('should return appointment from database', async () => {
      const dbAppointment = [{ id: 1, title: 'Test Appointment' }];
      mockedRedis.get.mockResolvedValue(null);
      mockedDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(dbAppointment),
          }),
        }),
      } as any);

      const response = await app.inject({
        method: 'GET',
        url: '/appointments/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(dbAppointment[0]);
      expect(mockedRedis.setEx).toHaveBeenCalledWith('appointments:1', 60, JSON.stringify(dbAppointment[0]));
    });

    it('should return 404 for non-existent appointment', async () => {
      mockedRedis.get.mockResolvedValue(null);
      mockedDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const response = await app.inject({
        method: 'GET',
        url: '/appointments/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({ error: 'Appointment not found' });
    });
  });

  describe('POST /appointments', () => {
    it('should create appointment successfully', async () => {
      const newAppointment = {
        title: 'New Appointment',
        description: 'Test description',
        appointmentDate: '2024-01-01T10:00:00Z',
      };
      const createdAppointment = { id: 1, ...newAppointment };

      mockedDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([createdAppointment]),
        }),
      } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/appointments',
        payload: newAppointment,
      });

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toEqual(createdAppointment);
      expect(mockedRedis.del).toHaveBeenCalledWith('appointments:all');
    });

    it('should validate input data', async () => {
      const invalidAppointment = {
        title: '', // Invalid: empty title
        appointmentDate: 'invalid-date',
      };

      const response = await app.inject({
        method: 'POST',
        url: '/appointments',
        payload: invalidAppointment,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.payload);
      expect(body.error).toBeDefined();
    });
  });

  describe('PUT /appointments/:id', () => {
    it('should update appointment successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
      };
      const updatedAppointment = { id: 1, ...updateData };

      mockedDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedAppointment]),
          }),
        }),
      } as any);

      const response = await app.inject({
        method: 'PUT',
        url: '/appointments/1',
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual(updatedAppointment);
      expect(mockedRedis.del).toHaveBeenCalledWith('appointments:all');
      expect(mockedRedis.del).toHaveBeenCalledWith('appointments:1');
    });

    it('should return 404 for non-existent appointment', async () => {
      mockedDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([]),
          }),
        }),
      } as any);

      const response = await app.inject({
        method: 'PUT',
        url: '/appointments/999',
        payload: { title: 'Updated Title' },
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({ error: 'Appointment not found' });
    });
  });

  describe('DELETE /appointments/:id', () => {
    it('should delete appointment successfully', async () => {
      const deletedAppointment = { id: 1, title: 'Deleted Appointment' };

      mockedDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([deletedAppointment]),
        }),
      } as any);

      const response = await app.inject({
        method: 'DELETE',
        url: '/appointments/1',
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toEqual({ message: 'Appointment deleted successfully' });
      expect(mockedRedis.del).toHaveBeenCalledWith('appointments:all');
      expect(mockedRedis.del).toHaveBeenCalledWith('appointments:1');
    });

    it('should return 404 for non-existent appointment', async () => {
      mockedDb.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const response = await app.inject({
        method: 'DELETE',
        url: '/appointments/999',
      });

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.payload)).toEqual({ error: 'Appointment not found' });
    });
  });
});