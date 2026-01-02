/**
 * Base interface for database connectors
 * Extend this interface to add new database types
 */
export interface DatabaseConnector {
  /**
   * The type of database connector
   */
  type: string;

  /**
   * Connect to the database
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the database
   */
  disconnect(): Promise<void>;

  /**
   * Check if the database is connected
   */
  isConnected(): boolean;

  /**
   * Execute a raw query
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;

  /**
   * Execute a query that returns a single result
   */
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;

  /**
   * Begin a transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit a transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback a transaction
   */
  rollback(): Promise<void>;

  /**
   * Get the underlying client (implementation-specific)
   */
  getClient(): any;
}

/**
 * Configuration options for database connectors
 */
export interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'mongodb'; // Easily extendable
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  schema?: string; // Database schema (e.g., 'public', 'app')
  ssl?: boolean;
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

/**
 * Abstract base class for database connectors
 * Provides common functionality
 */
export abstract class BaseDatabaseConnector implements DatabaseConnector {
  protected _isConnected: boolean = false;
  abstract type: string;

  constructor(protected config: DatabaseConfig) {}

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  abstract queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
  abstract beginTransaction(): Promise<void>;
  abstract commit(): Promise<void>;
  abstract rollback(): Promise<void>;
  abstract getClient(): any;

  isConnected(): boolean {
    return this._isConnected;
  }
}
