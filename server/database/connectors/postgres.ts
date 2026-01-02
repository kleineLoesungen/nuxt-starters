import { Pool, PoolClient, QueryResult } from 'pg';
import { BaseDatabaseConnector, DatabaseConfig } from './base';

/**
 * PostgreSQL database connector implementation
 */
export class PostgresConnector extends BaseDatabaseConnector {
  type = 'postgres';
  private pool: Pool | null = null;
  private client: PoolClient | null = null;
  private transactionActive: boolean = false;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  /**
   * Connect to the PostgreSQL database
   */
  async connect(): Promise<void> {
    if (this._isConnected) {
      return;
    }

    try {
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
        max: this.config.maxConnections || 10,
        idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis || 2000,
      });

      // Test connection and set schema if provided
      const client = await this.pool.connect();
      
      // Set search_path to use the specified schema
      if (this.config.schema) {
        await client.query(`SET search_path TO ${this.config.schema}, public`);
      }
      
      client.release();

      this._isConnected = true;
      console.log(`PostgreSQL connected successfully${this.config.schema ? ` (schema: ${this.config.schema})` : ''}`);
    } catch (error) {
      this._isConnected = false;
      console.error('PostgreSQL connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the PostgreSQL database
   */
  async disconnect(): Promise<void> {
    if (!this.pool) {
      return;
    }

    try {
      // If there's an active transaction, rollback first
      if (this.transactionActive) {
        await this.rollback();
      }

      await this.pool.end();
      this.pool = null;
      this.client = null;
      this._isConnected = false;
      console.log('PostgreSQL disconnected successfully');
    } catch (error) {
      console.error('PostgreSQL disconnection error:', error);
      throw error;
    }
  }

  /**
   * Execute a query and return all results
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    try {
      const queryClient = this.transactionActive && this.client ? this.client : this.pool;
      
      // Set search_path for each query to ensure correct schema usage
      if (this.config.schema && !this.transactionActive) {
        const client = await this.pool.connect();
        try {
          await client.query(`SET search_path TO ${this.config.schema}, public`);
          const result: QueryResult<T> = await client.query(sql, params);
          return result.rows;
        } finally {
          client.release();
        }
      } else {
        const result: QueryResult<T> = await queryClient.query(sql, params);
        return result.rows;
      }
    } catch (error) {
      console.error('PostgreSQL query error:', error);
      throw error;
    }
  }

  /**
   * Execute a query and return a single result
   */
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Begin a transaction
   */
  async beginTransaction(): Promise<void> {
    if (!this.pool) {
      throw new Error('Database not connected');
    }

    if (this.transactionActive) {
      throw new Error('Transaction already active');
    }

    try {
      this.client = await this.pool.connect();
      
      // Set search_path for the transaction
      if (this.config.schema) {
        await this.client.query(`SET search_path TO ${this.config.schema}, public`);
      }
      
      await this.client.query('BEGIN');
      this.transactionActive = true;
    } catch (error) {
      if (this.client) {
        this.client.release();
        this.client = null;
      }
      console.error('PostgreSQL begin transaction error:', error);
      throw error;
    }
  }

  /**
   * Commit a transaction
   */
  async commit(): Promise<void> {
    if (!this.transactionActive || !this.client) {
      throw new Error('No active transaction');
    }

    try {
      await this.client.query('COMMIT');
      this.client.release();
      this.client = null;
      this.transactionActive = false;
    } catch (error) {
      console.error('PostgreSQL commit error:', error);
      throw error;
    }
  }

  /**
   * Rollback a transaction
   */
  async rollback(): Promise<void> {
    if (!this.transactionActive || !this.client) {
      throw new Error('No active transaction');
    }

    try {
      await this.client.query('ROLLBACK');
      this.client.release();
      this.client = null;
      this.transactionActive = false;
    } catch (error) {
      console.error('PostgreSQL rollback error:', error);
      throw error;
    }
  }

  /**
   * Get the underlying pool
   */
  getClient(): Pool | null {
    return this.pool;
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: (connector: PostgresConnector) => Promise<T>): Promise<T> {
    await this.beginTransaction();

    try {
      const result = await callback(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
