import { Database } from 'bun:sqlite';
import { Migrations } from './migrations';

const { env: { DATABASE_PATH, DATABASE_MIGRATIONS_PATH } = {} } = process;

const main = async () => {
  if (!DATABASE_PATH || !DATABASE_MIGRATIONS_PATH) throw new Error('environment variables misconfigured');

  const database = new Database(DATABASE_PATH);
  const migrations = new Migrations(database, DATABASE_MIGRATIONS_PATH);

  const command = process?.argv?.[2];
  const args = process?.argv?.slice(3);

  await migrations.run({ command, args });
};

main().catch((error: Error) => console.error(`[!] an error occurred: ${error?.message || error}`));
