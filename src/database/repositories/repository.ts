import { randomUUIDv7 } from 'bun';
import type { SQLQueryBindings } from 'bun:sqlite';
import { safe } from '../../common';
import type { Database } from '../database';

class Repository<Entity = Record<string, unknown>> {
  protected database: Database;
  protected table: string;
  constructor(database: Database, table: string) {
    this.database = database;
    this.table = table;
  }

  create = safe((payload: Partial<Entity>) => {
    const id = `${randomUUIDv7()}`;

    const keys = Object.keys({ ...payload, id });
    const values = Object.values({ ...payload, id }) as SQLQueryBindings[];
    const placeholders = keys.map(() => '?').join(', ');

    this.database.run(`INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
    return id;
  });

  read(): Entity[];
  read(id: string): Entity | null;
  read(id?: string): Entity | Entity[] | null {
    if (!id) return this.database.query<Entity>(`SELECT * FROM ${this.table}`) as Entity[];
    return this.database.get<Entity>(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  update = safe((id: string, payload: Partial<Entity>) => {
    const keys = Object.keys(payload);
    const values = Object.values(payload) as SQLQueryBindings[];
    const clause = keys.map(key => `${key} = ?`).join(', ');

    return this.database.run(`UPDATE ${this.table} SET ${clause} WHERE id = ?`, [...values, id]);
  });

  delete = safe((id: string) => {
    return this.database.run(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  });
}

export { Repository };
