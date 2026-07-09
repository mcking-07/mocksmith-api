import { safe } from '../common';

class Database {
  private readonly db: D1Database;
  constructor(database: D1Database) {
    this.db = database;
  }

  ping = safe(async () => {
    const result = await this.db.prepare('SELECT 1').first();
    return result !== null;
  });

  get = async <Entity>(sql: string, params: (string | number | null | ArrayBuffer)[] = []) => {
    return this.db.prepare(sql).bind(...params).first<Entity>();
  };

  query = async <Entity>(sql: string, params: (string | number | null | ArrayBuffer)[] = []) => {
    const result = await this.db.prepare(sql).bind(...params).all<Entity>();
    return result.results;
  };

  run = async (sql: string, params: (string | number | null | ArrayBuffer)[] = []) => {
    return this.db.prepare(sql).bind(...params).run();
  };
}

export { Database };
