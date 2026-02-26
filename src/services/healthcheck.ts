import { loggerFor } from '../common';
import type { Database } from '../database';

const logger = loggerFor(import.meta.url);

class HealthService {
  private readonly database: Database;
  constructor(database: Database) {
    this.database = database;
  }

  check = async () => {
    const timestamp = new Date().toISOString();

    const [error] = this.database.ping();
    if (error) logger.error(`database health check failed with error: ${error?.message}`, error);

    const status = error ? 'unhealthy' : 'healthy';
    const checks = { api: 'ok', database: error ? 'not ok' : 'ok' };

    return { status, timestamp, checks };
  };
}
export { HealthService };
