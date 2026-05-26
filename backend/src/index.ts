import Fastify from 'fastify';
import cors from '@fastify/cors';
import { appointmentRoutes } from './routes/appointments';
import { aiRoutes } from './routes/ai';
import { connectRedis } from './config/redis';
import { initDatabase } from './db/init';

const fastify = Fastify({
  logger: true,
});

async function start() {
  try {
    // Initialize database (run migrations)
    await initDatabase();
    console.log('Database initialized');

    // Connect to Redis
    await connectRedis();
    console.log('Connected to Redis');

    // Register CORS
    await fastify.register(cors, {
      origin: process.env.FRONTEND_URL || 'http://localhost:4205',
    });

    // Register routes
    await fastify.register(appointmentRoutes);
    await fastify.register(aiRoutes, { prefix: '/ai' });

    // Start server
    const port = parseInt(process.env.PORT || '4206');
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
