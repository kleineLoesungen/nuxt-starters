import { DatabaseConnector, DatabaseConfig } from '../database/connectors/base';
import { ConnectorFactory } from '../database/connector-factory';

/**
 * Composable for database access in Nuxt server routes
 * Usage: const db = await useDatabase()
 */
export const useDatabase = async (): Promise<DatabaseConnector> => {
  const config = useRuntimeConfig();

  // Build database configuration from runtime config
  const dbConfig: DatabaseConfig = {
    type: config.database.type as 'postgres' | 'mysql' | 'mongodb',
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    schema: config.database.schema,
    ssl: config.database.ssl,
    maxConnections: config.database.maxConnections,
    idleTimeoutMillis: config.database.idleTimeoutMillis,
    connectionTimeoutMillis: config.database.connectionTimeoutMillis,
  };

  // Create or get existing connector
  const connector = await ConnectorFactory.create(dbConfig);

  return connector;
};

/**
 * Type-safe database query helper
 * Usage: const users = await dbQuery<User>('SELECT * FROM users WHERE id = $1', [userId])
 */
export const dbQuery = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> => {
  const db = await useDatabase();
  return db.query<T>(sql, params);
};

/**
 * Type-safe database query helper for single results
 * Usage: const user = await dbQueryOne<User>('SELECT * FROM users WHERE id = $1', [userId])
 */
export const dbQueryOne = async <T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> => {
  const db = await useDatabase();
  return db.queryOne<T>(sql, params);
};

/**
 * Transaction helper
 * Usage: await dbTransaction(async (db) => {
 *   await db.query('INSERT INTO users ...')
 *   await db.query('INSERT INTO profiles ...')
 * })
 */
export const dbTransaction = async <T>(
  callback: (db: DatabaseConnector) => Promise<T>
): Promise<T> => {
  const db = await useDatabase();

  await db.beginTransaction();

  try {
    const result = await callback(db);
    await db.commit();
    return result;
  } catch (error) {
    await db.rollback();
    throw error;
  }
};
