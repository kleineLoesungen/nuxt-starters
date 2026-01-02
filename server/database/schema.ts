/**
 * Database schema definitions
 * This file contains the SQL schema for all database tables
 */

export const schema = {
  /**
   * Users table schema
   * Stores user authentication and profile information
   */
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `,

  /**
   * Sessions table schema
   * Stores user session information
   */
  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      id VARCHAR(255) PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index for session lookups
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  `,

  /**
   * Settings table schema
   * Stores application-wide configuration settings
   */
  settings: `
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default settings
    INSERT INTO settings (key, value, description) 
    VALUES 
      ('registration_enabled', 'true', 'Allow public user registration'),
      ('notify_user_creation', 'true', 'Send email to user when account is created'),
      ('notify_admin_registration', 'false', 'Send email to admins when new user registers')
    ON CONFLICT (key) DO NOTHING;
  `,

  /**
   * Groups table schema
   * Stores user groups for organizing users
   * is_public: false = permission-only group, true = public group (also has permissions)
   */
  groups: `
    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      is_public BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create index for group name lookups
    CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
    CREATE INDEX IF NOT EXISTS idx_groups_is_public ON groups(is_public);
  `,

  /**
   * User Groups junction table
   * Many-to-many relationship between users and groups
   */
  user_groups: `
    CREATE TABLE IF NOT EXISTS user_groups (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, group_id)
    );

    -- Create indexes for efficient lookups
    CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id);
  `,

  /**
   * Permissions table schema
   * Stores capability/feature permissions for groups
   * permission_key: unique capability identifier like 'admin.manage', 'reports.view'
   */
  permissions: `
    CREATE TABLE IF NOT EXISTS permissions (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      permission_key VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(group_id, permission_key)
    );

    -- Create indexes for permission lookups
    CREATE INDEX IF NOT EXISTS idx_permissions_group_id ON permissions(group_id);
    CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(permission_key);
  `,

  /**
   * API Tokens table schema
   * Stores hashed API tokens for user authentication
   */
  api_tokens: `
    CREATE TABLE IF NOT EXISTS api_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for token lookups
    CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_tokens_token_hash ON api_tokens(token_hash);
  `,
};

/**
 * Initialize all database tables
 * Call this function to set up the database schema
 */
export async function initializeSchema(db: any): Promise<void> {
  try {
    // Get schema name from config
    const schemaName = db.config?.schema || 'public';
    
    // Create schema if it doesn't exist (only for non-public schemas)
    if (schemaName !== 'public') {
      await db.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    }
    
    // Set search_path to use the specified schema
    await db.query(`SET search_path TO ${schemaName}, public`);
    
    // Create tables in order (respecting foreign key dependencies)
    await db.query(schema.users);
    await db.query(schema.sessions);
    await db.query(schema.settings);
    await db.query(schema.groups);
    await db.query(schema.user_groups);
    await db.query(schema.permissions);
    await db.query(schema.api_tokens);

    // Sync code-defined permissions to database
    const { syncPermissions } = await import('../utils/sync-permissions');
    await syncPermissions();

    // Run migrations for existing databases
    // Make email column nullable if it isn't already
    try {
      await db.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`);
    } catch (migrationError: any) {
      // Ignore error if column is already nullable
      if (!migrationError.message?.includes('column "email" of relation "users" is not defined')) {
        // Column exists and migration succeeded or was already applied
      }
    }
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
}
