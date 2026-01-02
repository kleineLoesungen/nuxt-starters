import { vi } from 'vitest';
import type { DatabaseConfig } from '../../server/database/connectors/base';

/**
 * Load environment configuration for tests
 */
export function loadEnvConfig() {
  // Set default test environment variables if not provided
  process.env.DATABASE_TYPE = process.env.NUXT_DATABASE_TYPE || 'postgres';
  process.env.DATABASE_HOST = process.env.NUXT_DATABASE_HOST || 'localhost';
  process.env.DATABASE_PORT = process.env.NUXT_DATABASE_PORT || '5432';
  process.env.DATABASE_NAME = process.env.NUXT_DATABASE_NAME || 'myapp_test';
  process.env.DATABASE_USER = process.env.NUXT_DATABASE_USER || 'postgres';
  process.env.DATABASE_PASSWORD = process.env.NUXT_DATABASE_PASSWORD || 'postgres';
  process.env.DATABASE_SCHEMA = process.env.NUXT_DATABASE_SCHEMA || 'public';
  process.env.DATABASE_SSL = process.env.NUXT_DATABASE_SSL || 'false';
  process.env.DATABASE_MAX_CONNECTIONS = process.env.NUXT_DATABASE_MAX_CONNECTIONS || '10';
  process.env.DATABASE_IDLE_TIMEOUT = process.env.NUXT_DATABASE_IDLE_TIMEOUT || '30000';
  process.env.DATABASE_CONNECTION_TIMEOUT = process.env.NUXT_DATABASE_CONNECTION_TIMEOUT || '2000';
}

/**
 * Mock Nuxt runtime config for testing
 */
export function mockRuntimeConfig() {
  const config = {
    database: {
      type: process.env.DATABASE_TYPE || 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      name: process.env.DATABASE_NAME || 'app_test',
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      schema: process.env.DATABASE_SCHEMA || 'public',
      ssl: process.env.DATABASE_SSL === 'true',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
      idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '2000'),
    },
  };

  // Mock the useRuntimeConfig function
  global.useRuntimeConfig = vi.fn(() => config);

  return config;
}

/**
 * Get test database configuration
 */
export function getTestDatabaseConfig(): DatabaseConfig {
  return {
    type: process.env.DATABASE_TYPE as 'postgres' | 'mysql' | 'mongodb' || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'app_test',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    schema: process.env.DATABASE_SCHEMA || 'public',
    ssl: process.env.DATABASE_SSL === 'true',
    maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '10'),
    idleTimeoutMillis: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '2000'),
  };
}

/**
 * Wait for async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
