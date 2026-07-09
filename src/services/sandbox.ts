import { parse } from 'acorn';
import { simple } from 'acorn-walk';
import { getQuickJSWASMModule } from '@cf-wasm/quickjs/workerd';
import { safe } from '../common';
import type { SandboxContext } from '../types';

const BLOCKED_IDENTIFIERS = ['eval', 'Function', 'globalThis', 'self', 'navigator', 'WebSocket', 'Atomics', 'SharedArrayBuffer'];

const dispose = (...resources: { dispose: () => void; }[]) => resources.forEach(r => r.dispose());

class SandboxService {
  private readonly timeout: number;
  constructor(timeout: number = 10000) {
    this.timeout = timeout;
  }

  validate = safe((code: string) => {
    const tree = parse(`(${code})`, { ecmaVersion: 'latest', sourceType: 'script' });

    simple(tree, {
      ImportExpression() {
        throw new SyntaxError('dynamic import() is not allowed in handlers');
      },
      Identifier(node: { name: string; }) {
        if (BLOCKED_IDENTIFIERS.includes(node.name)) {
          throw new SyntaxError(`'${node.name}' is not allowed in handlers`);
        }
      },
      ThisExpression() {
        throw new SyntaxError('\'this\' is not allowed in handlers');
      },
    });

    return tree;
  });

  private inject = (vm: ReturnType<Awaited<ReturnType<typeof getQuickJSWASMModule>>['newContext']>) => {
    const crypto_obj = vm.newObject();
    const random_uuid = vm.newFunction('randomUUID', () => vm.newString(crypto.randomUUID()));
    vm.setProp(crypto_obj, 'randomUUID', random_uuid);
    vm.setProp(vm.global, 'crypto', crypto_obj);
    random_uuid.dispose();
    crypto_obj.dispose();
  };

  private wrap = (code: string, context: SandboxContext) => {
    return `(function() { const handler = (${code}); return JSON.stringify(handler(${JSON.stringify(context)})); })()`;
  };

  execute = safe(async (code: string, context: SandboxContext) => {
    const wasm_module = await getQuickJSWASMModule();
    const runtime = wasm_module.newRuntime();
    const start = Date.now();

    runtime.setMemoryLimit(1024 * 1024 * 10);
    runtime.setMaxStackSize(1024 * 1024);
    runtime.setInterruptHandler(() => Date.now() - start > this.timeout);

    const vm = runtime.newContext();
    this.inject(vm);
    const result = vm.evalCode(this.wrap(code, context));
    const handle = result.error ?? result.value;
    const output = vm.dump(handle);

    dispose(handle, vm, runtime);

    if (result.error) {
      const timedout = Date.now() - start > this.timeout;
      throw Object.assign(new Error(output?.message ?? 'execution failed'), timedout ? { cause: 'ETIMEDOUT' } : {});
    }

    return JSON.parse(output);
  });
}

export { SandboxService };
