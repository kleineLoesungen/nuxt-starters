import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { mockRuntimeConfig, getTestDatabaseConfig } from '../../utils/test-helpers';
import { useDatabase, dbQuery, dbQueryOne, dbTransaction } from '../../../server/composables/useDatabase';
import { ConnectorFactory } from '../../../server/database/connector-factory';
import type { DatabaseConnector } from '../../../server/database/connectors/base';

/**
 * Test suite for database composables
 * 
 * These tests use mocked database connections to avoid requiring
 * an actual database server for running tests.
 * 
 * Run tests with: npm test
 */
describe('Database Composables', () => {
  let mockConnector: any;

  beforeAll(() => {
    // Mock Nuxt runtime config
    mockRuntimeConfig();
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create a mock database connector
    mockConnector = {
      isConnected: vi.fn(() => true),
      connect: vi.fn(),
      disconnect: vi.fn(),
      query: vi.fn(),
      queryOne: vi.fn(),
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      getClient: vi.fn(() => ({})),
      type: 'postgres',
    };

    // Mock the ConnectorFactory to return our mock connector
    vi.spyOn(ConnectorFactory, 'create').mockResolvedValue(mockConnector as any);
  });

  afterAll(async () => {
    // Clean up all connections after tests
    await ConnectorFactory.closeAll();
    vi.restoreAllMocks();
  });

  /**
   * Basic connection tests
   */
  describe('useDatabase', () => {
    it('should connect to database with environment variables', async () => {
      const db = await useDatabase();

      expect(db).toBeDefined();
      expect(db.isConnected()).toBe(true);
      expect(db.type).toBe('postgres');
      expect(mockConnector.isConnected).toHaveBeenCalled();
    });

    it('should return the same instance on multiple calls', async () => {
      const db1 = await useDatabase();
      const db2 = await useDatabase();

      expect(db1).toBe(db2);
    });

    it('should have access to database client', async () => {
      const db = await useDatabase();
      const client = db.getClient();

      expect(client).toBeDefined();
      expect(mockConnector.getClient).toHaveBeenCalled();
    });
  });

  /**
   * Query execution tests
   */
  describe('dbQuery', () => {
    it('should execute a simple SELECT query', async () => {
      const mockResult = [{ num: 1 }];
      mockConnector.query.mockResolvedValue(mockResult);

      const result = await dbQuery('SELECT 1 as num');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].num).toBe(1);
      expect(mockConnector.query).toHaveBeenCalledWith('SELECT 1 as num', undefined);
    });

    it('should execute query with parameters', async () => {
      const mockResult = [{ value: 42 }];
      mockConnector.query.mockResolvedValue(mockResult);

      const result = await dbQuery('SELECT $1::int as value', [42]);

      expect(result).toBeDefined();
      expect(result[0].value).toBe(42);
      expect(mockConnector.query).toHaveBeenCalledWith('SELECT $1::int as value', [42]);
    });

    it('should execute multiple queries', async () => {
      mockConnector.query
        .mockResolvedValueOnce([{ num: 1 }])
        .mockResolvedValueOnce([{ num: 2 }]);

      const result1 = await dbQuery('SELECT 1 as num');
      const result2 = await dbQuery('SELECT 2 as num');

      expect(result1[0].num).toBe(1);
      expect(result2[0].num).toBe(2);
      expect(mockConnector.query).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Single result query tests
   */
  describe('dbQueryOne', () => {
    it('should return a single result', async () => {
      mockConnector.queryOne.mockResolvedValue({ num: 1 });

      const result = await dbQueryOne('SELECT 1 as num');

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      expect(result?.num).toBe(1);
      expect(mockConnector.queryOne).toHaveBeenCalledWith('SELECT 1 as num', undefined);
    });

    it('should return null when no results', async () => {
      mockConnector.queryOne.mockResolvedValue(null);

      const result = await dbQueryOne('SELECT 1 as num WHERE 1 = 0');

      expect(result).toBeNull();
      expect(mockConnector.queryOne).toHaveBeenCalled();
    });

    it('should return first result when multiple rows match', async () => {
      mockConnector.queryOne.mockResolvedValue({ num: 1 });

      const result = await dbQueryOne('SELECT unnest(ARRAY[1, 2, 3]) as num');

      expect(result).toBeDefined();
      expect(result?.num).toBe(1);
      expect(mockConnector.queryOne).toHaveBeenCalled();
    });
  });

  /**
   * Transaction tests
   */
  describe('dbTransaction', () => {
    it('should execute queries in a transaction', async () => {
      mockConnector.query
        .mockResolvedValueOnce([{ num: 1 }])
        .mockResolvedValueOnce([{ num: 2 }]);

      const result = await dbTransaction(async (db) => {
        const res1 = await db.query('SELECT 1 as num');
        const res2 = await db.query('SELECT 2 as num');
        return { res1, res2 };
      });

      expect(result.res1[0].num).toBe(1);
      expect(result.res2[0].num).toBe(2);
      expect(mockConnector.beginTransaction).toHaveBeenCalled();
      expect(mockConnector.commit).toHaveBeenCalled();
    });

    it('should commit successful transactions', async () => {
      mockConnector.query.mockResolvedValue([{ now: new Date() }]);

      const result = await dbTransaction(async (db) => {
        await db.query('SELECT NOW()');
        return 'committed';
      });

      expect(result).toBe('committed');
      expect(mockConnector.beginTransaction).toHaveBeenCalled();
      expect(mockConnector.commit).toHaveBeenCalled();
      expect(mockConnector.rollback).not.toHaveBeenCalled();
    });

    it('should execute nested queries in transaction', async () => {
      mockConnector.query
        .mockResolvedValueOnce([{ step: 1 }])
        .mockResolvedValueOnce([{ step: 2 }])
        .mockResolvedValueOnce([{ step: 3 }]);

      const result = await dbTransaction(async (db) => {
        const step1 = await db.query('SELECT 1 as step');
        const step2 = await db.query('SELECT 2 as step');
        const step3 = await db.query('SELECT 3 as step');
        
        return {
          step1: step1[0].step,
          step2: step2[0].step,
          step3: step3[0].step,
        };
      });

      expect(result.step1).toBe(1);
      expect(result.step2).toBe(2);
      expect(result.step3).toBe(3);
      expect(mockConnector.beginTransaction).toHaveBeenCalled();
      expect(mockConnector.commit).toHaveBeenCalled();
    });
  });
});
