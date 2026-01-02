import { beforeAll, afterAll } from 'vitest';
import { loadEnvConfig } from './utils/test-helpers';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Global test setup
 * Runs once before all tests
 */
beforeAll(async () => {
  // Load .env.test file if it exists
  try {
    const envTestPath = resolve(process.cwd(), '.env.test');
    const envContent = readFileSync(envTestPath, 'utf-8');
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      
      const [key, ...values] = line.split('=');
      const value = values.join('=');
      if (key && value !== undefined) {
        process.env[key] = value;
      }
    });
  } catch (error) {
    // .env.test not found, use defaults
  }
  
  // Load environment variables for tests (with defaults)
  loadEnvConfig();
});

/**
 * Global test teardown
 * Runs once after all tests
 */
afterAll(async () => {
  // Cleanup can be added here if needed
});
