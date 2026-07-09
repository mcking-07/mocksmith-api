import { safe } from '../../common';
import type { Database } from '../database';

class Repository<Entity = Record<string, unknown>> {
  protected database: Database;
  protected table: string;
  constructor(database: Database, table: string) {
    this.database = database;
    this.table = table;
  }

  create = safe(async (payload: Partial<Entity>) => {
    const id = crypto.randomUUID();

    const keys = Object.keys({ ...payload, id });
    const values = Object.values({ ...payload, id }) as (string | number | null | ArrayBuffer)[];
    const placeholders = keys.map(() => '?').join(', ');

    await this.database.run(`INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`, values);
    return id;
  });

  read(): Promise<Entity[]>;
  read(id: string): Promise<Entity | null>;
  async read(id?: string): Promise<Entity | Entity[] | null> {
    if (!id) return this.database.query<Entity>(`SELECT * FROM ${this.table}`);
    return this.database.get<Entity>(`SELECT * FROM ${this.table} WHERE id = ?`, [id]);
  }

  update = safe(async (id: string, payload: Partial<Entity>) => {
    const keys = Object.keys(payload);
    const values = Object.values(payload) as (string | number | null | ArrayBuffer)[];
    const clause = keys.map(key => `${key} = ?`).join(', ');

    return this.database.run(`UPDATE ${this.table} SET ${clause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, id]);
  });

  delete = safe(async (id: string) => {
    return this.database.run(`DELETE FROM ${this.table} WHERE id = ?`, [id]);
  });
}

export { Repository };
