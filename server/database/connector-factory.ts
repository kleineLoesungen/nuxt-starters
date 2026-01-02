import { DatabaseConnector, DatabaseConfig } from './connectors/base';
import { PostgresConnector } from './connectors/postgres';

/**
 * Connector factory type definition
 */
type ConnectorConstructor = new (config: DatabaseConfig) => DatabaseConnector;

/**
 * Registry of available database connectors
 * Add new connectors here to make them available
 */
const connectorRegistry: Record<string, ConnectorConstructor> = {
  postgres: PostgresConnector,
  // Easy to add new connectors:
  // mysql: MySQLConnector,
  // mongodb: MongoDBConnector,
  // sqlite: SQLiteConnector,
};

/**
 * Factory class for creating database connectors
 * Provides a singleton pattern for database connections
 */
export class ConnectorFactory {
  private static instances: Map<string, DatabaseConnector> = new Map();

  /**
   * Create or get a database connector instance
   * Uses singleton pattern to ensure only one connection per configuration
   */
  static async create(config: DatabaseConfig): Promise<DatabaseConnector> {
    const key = this.getConfigKey(config);

    // Return existing instance if available
    if (this.instances.has(key)) {
      const instance = this.instances.get(key)!;
      if (instance.isConnected()) {
        return instance;
      }
    }

    // Get the connector constructor
    const ConnectorClass = connectorRegistry[config.type];
    if (!ConnectorClass) {
      throw new Error(
        `Unsupported database type: ${config.type}. Available types: ${Object.keys(connectorRegistry).join(', ')}`
      );
    }

    // Create new instance
    const connector = new ConnectorClass(config);
    await connector.connect();

    // Store instance for reuse
    this.instances.set(key, connector);

    return connector;
  }

  /**
   * Get an existing connector instance without creating a new one
   */
  static get(config: DatabaseConfig): DatabaseConnector | null {
    const key = this.getConfigKey(config);
    return this.instances.get(key) || null;
  }

  /**
   * Close a specific connector instance
   */
  static async close(config: DatabaseConfig): Promise<void> {
    const key = this.getConfigKey(config);
    const instance = this.instances.get(key);

    if (instance) {
      await instance.disconnect();
      this.instances.delete(key);
    }
  }

  /**
   * Close all connector instances
   */
  static async closeAll(): Promise<void> {
    const closePromises = Array.from(this.instances.values()).map((instance) =>
      instance.disconnect()
    );
    await Promise.all(closePromises);
    this.instances.clear();
  }

  /**
   * Register a new connector type
   * Allows dynamic registration of custom connectors
   */
  static registerConnector(type: string, connectorClass: ConnectorConstructor): void {
    connectorRegistry[type] = connectorClass;
  }

  /**
   * Generate a unique key for a configuration
   */
  private static getConfigKey(config: DatabaseConfig): string {
    return `${config.type}:${config.host}:${config.port}:${config.database}:${config.user}`;
  }

  /**
   * Get list of available connector types
   */
  static getAvailableTypes(): string[] {
    return Object.keys(connectorRegistry);
  }
}

/**
 * Graceful shutdown handler
 * Closes all database connections when the process exits
 */
if (typeof process !== 'undefined') {
  const shutdownHandler = async () => {
    console.log('Closing all database connections...');
    await ConnectorFactory.closeAll();
    process.exit(0);
  };

  process.on('SIGINT', shutdownHandler);
  process.on('SIGTERM', shutdownHandler);
}
