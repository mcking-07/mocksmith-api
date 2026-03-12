import type { Database } from 'bun:sqlite';
import { migrate, getMigrations as get_migrations, getDatabaseVersion as get_applied_version } from 'bun-sqlite-migrations';
import { writeFile } from 'fs/promises';
import { join } from 'path';

const { env: { NODE_ENV } = {} } = process;

type Command = 'migrate' | 'status' | 'create' | 'help';
type Handler = (params: Partial<ValidatedParams>) => Promise<void>;
type Handlers = Record<Command, Handler>;
type InputParams = { command: string; args?: string[]; };
type ValidatedParams = { command: Command; args?: string[]; error?: string; };

class Migrations {
  private readonly database: Database;
  private readonly path: string;
  constructor(database: Database, path: string) {
    this.database = database;
    this.path = path;
  }

  private validated(params: InputParams) {
    const { command, args } = params;
    if (!command) return { command: 'help', args: [], error: 'no command provided' };

    const commands_with_args = ['create'];
    if (commands_with_args.includes(command) && !args?.length) return { command: 'help', args: [], error: 'missing argument(s)' };

    return { command, args };
  }

  private async handle_migrate() {
    const before = get_applied_version(this.database);
    const migrations = get_migrations(this.path);

    migrate(this.database, migrations);

    const after = get_applied_version(this.database);
    const applied = after - before;

    const message = applied === 0 ? `no pending migrations (version ${after})` : `${applied} migrations applied (version ${before} → ${after})`;
    if (NODE_ENV !== 'test') console.log(`\n[+] ${message}`);
  }

  private async handle_status() {
    const migrations = get_migrations(this.path);
    const current = get_applied_version(this.database);

    const pending = migrations.length - current;
    const symbol = pending === 0 ? '+' : '~';

    console.log(`\n[${symbol}] ${migrations.length} migrations found, ${current} applied, ${pending} pending`);
    if (pending > 0) console.log(`[!] run 'bun run db:migrate' to apply pending migrations`);
  }

  private async handle_create(args?: string[]) {
    const name = args?.[0];
    if (!name) throw new Error('missing migration name');

    const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!pattern.test(name)) throw new Error('invalid migration name, use lowercase alphanumeric characters and underscores only');

    const migrations = get_migrations(this.path);
    const next = String(migrations.length + 1).padStart(3, '0');

    const filename = `${next}_${name}.sql`;
    const filepath = join(this.path, filename);

    await writeFile(filepath, '');
    console.log(`\n[+] created migration: ${filepath.toString()}`);
  }

  private async handle_help(error?: string) {
    if (error) console.log(`\n[!] an error occurred: ${error}`);

    console.log(`\nusage: bun run database <command> [args]`);
    console.log(`\ncommands:`);
    console.log(`  migrate              run pending migrations`);
    console.log(`  status               show migration status`);
    console.log(`  create <name>        create new migration (e.g., create_users_table)`);
    console.log(`  help                 show this help`);
  }

  async run(params: InputParams) {
    const { command, args, error } = this.validated(params);

    const handlers: Handlers = {
      migrate: () => this.handle_migrate(),
      status: () => this.handle_status(),
      create: ({ args }) => this.handle_create(args),
      help: ({ error }) => this.handle_help(error),
    };

    const handler = handlers[command as Command];
    return await handler({ args, error });
  }
}

export { Migrations };
