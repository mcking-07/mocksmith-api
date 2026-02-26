import { type SQLQueryBindings, Database as SQLiteDatabase } from 'bun:sqlite';
import { safe } from '../common';

class Database {
  private readonly database: SQLiteDatabase;
  constructor(path: string) {
    this.database = new SQLiteDatabase(path);
  }

  ping = safe(() => {
    return this.database.prepare('SELECT 1').get() !== null;
  });

  public get = <Entity>(sql: string, params?: SQLQueryBindings[]) => {
    return this.database.prepare(sql).get(...params ?? []) as Entity | null;
  };

  public query = <Entity>(sql: string, params?: SQLQueryBindings[]) => {
    return this.database.prepare(sql).all(...params ?? []) as Entity[];
  };

  public run = (sql: string, params?: SQLQueryBindings[]) => {
    return this.database.prepare(sql).run(...params ?? []);
  };

  public close = () => {
    this.database.close();
  };
}

export { Database };
