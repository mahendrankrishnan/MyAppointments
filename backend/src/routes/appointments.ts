import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db';
import { appointments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { redisClient } from '../config/redis';

const appointmentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  appointmentDate: z.string().datetime(),
});

const updateAppointmentSchema = appointmentSchema.partial();

export async function appointmentRoutes(fastify: FastifyInstance) {
  // Get all appointments
  fastify.get('/appointments', async (request, reply) => {
    try {
      const cacheKey = 'appointments:all';
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }

      const allAppointments = await db.select().from(appointments);
      
      await redisClient.setEx(cacheKey, 60, JSON.stringify(allAppointments));
      
      return allAppointments;
    } catch (error) {
      reply.code(500).send({ error: 'Failed to fetch appointments' });
    }
  });

  // Get single appointment
  fastify.get<{ Params: { id: string } }>('/appointments/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const cacheKey = `appointments:${id}`;
      
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const appointment = await db
        .select()
        .from(appointments)
        .where(eq(appointments.id, parseInt(id)))
        .limit(1);

      if (appointment.length === 0) {
        return reply.code(404).send({ error: 'Appointment not found' });
      }

      await redisClient.setEx(cacheKey, 60, JSON.stringify(appointment[0]));
      
      return appointment[0];
    } catch (error) {
      reply.code(500).send({ error: 'Failed to fetch appointment' });
    }
  });

  // Create appointment
  fastify.post('/appointments', async (request, reply) => {
    try {
      const body = appointmentSchema.parse(request.body);
      
      const [appointment] = await db
        .insert(appointments)
        .values({
          title: body.title,
          description: body.description,
          appointmentDate: new Date(body.appointmentDate),
        })
        .returning();

      // Invalidate cache
      await redisClient.del('appointments:all');
      
      reply.code(201).send(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      reply.code(500).send({ error: 'Failed to create appointment' });
    }
  });

  // Update appointment
  fastify.put<{ Params: { id: string } }>('/appointments/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const body = updateAppointmentSchema.parse(request.body);
      
      const updateData: any = {};
      if (body.title) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.appointmentDate) updateData.appointmentDate = new Date(body.appointmentDate);
      updateData.updatedAt = new Date();

      const [updated] = await db
        .update(appointments)
        .set(updateData)
        .where(eq(appointments.id, parseInt(id)))
        .returning();

      if (!updated) {
        return reply.code(404).send({ error: 'Appointment not found' });
      }

      // Invalidate cache
      await redisClient.del('appointments:all');
      await redisClient.del(`appointments:${id}`);
      
      return updated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: error.errors });
      }
      reply.code(500).send({ error: 'Failed to update appointment' });
    }
  });

  // Delete appointment
  fastify.delete<{ Params: { id: string } }>('/appointments/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const [deleted] = await db
        .delete(appointments)
        .where(eq(appointments.id, parseInt(id)))
        .returning();

      if (!deleted) {
        return reply.code(404).send({ error: 'Appointment not found' });
      }

      // Invalidate cache
      await redisClient.del('appointments:all');
      await redisClient.del(`appointments:${id}`);
      
      return { message: 'Appointment deleted successfully' };
    } catch (error) {
      reply.code(500).send({ error: 'Failed to delete appointment' });
    }
  });
}

