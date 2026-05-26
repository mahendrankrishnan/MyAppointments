import { jest } from '@jest/globals';

// Mock Redis
jest.mock('../src/config/redis', () => ({
  connectRedis: jest.fn(),
  redisClient: {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock database
jest.mock('../src/db', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  },
}));

// Mock database init
jest.mock('../src/db/init', () => ({
  initDatabase: jest.fn(),
}));