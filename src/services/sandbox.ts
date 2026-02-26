import { safe } from '../common';
import { config } from '../config';
import type { SandboxContext, SandboxResponse } from '../types';

class SandboxService {
  private readonly timeout: number;
  private readonly bun_path: string;
  constructor() {
    this.timeout = config?.sandbox?.timeout || 20000;
    this.bun_path = Bun.which('bun') ?? 'bun';
  }

  validate = safe((code: string) => {
    return new Function(`return ${code}`);
  });

  private kill_on_timeout = (child: ReturnType<typeof Bun.spawn>, timeout_ms: number) => {
    return new Promise<never>((_, reject) => {
      setTimeout(() => {
        child.kill();
        reject(new Error(`sandbox execution timeout after ${timeout_ms}ms`));
      }, timeout_ms);
    });
  };

  private wrapped = (code: string, context: SandboxContext) => {
    return `
    (async () => {
      try {
        const handler = (() => (${code}))();
        const value = await handler(${JSON.stringify(context)});

        process.stdout.write(JSON.stringify({ success: true, payload: value }));
      } catch (err) {
        const error = err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : { name: "Error", message: String(err) };

        process.stdout.write(JSON.stringify({ success: false, error }));
        process.exit(1);
      }
    })();`;
  };

  execute = safe(async (code: string, context: SandboxContext) => {
    const wrapped = this.wrapped(code, context);
    const subprocess = Bun.spawn([this.bun_path, '-e', wrapped], { stdout: 'pipe', stderr: 'inherit' });

    await Promise.race([subprocess.exited, this.kill_on_timeout(subprocess, this.timeout)]);
    const response = JSON.parse(await subprocess.stdout.text()) as SandboxResponse;

    if (response.success) return response.payload;

    throw Object.assign(new Error(response.error?.message ?? 'execution failed'), {
      name: response.error?.name ?? 'SandboxError', stack: response.error?.stack,
    });
  });
}

export { SandboxService };
