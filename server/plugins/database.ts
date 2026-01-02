import { useDatabase } from '../composables/useDatabase';
import { initializeSchema } from '../database/schema';

export default defineNitroPlugin(async (nitroApp) => {
  console.log('Initializing database schema...');
  
  try {
    const db = await useDatabase();
    await initializeSchema(db);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    // Don't throw error to allow app to start
  }
});
