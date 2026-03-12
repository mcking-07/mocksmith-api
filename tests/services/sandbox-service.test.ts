import { beforeEach, describe, expect, test } from 'bun:test';
import { setup } from '../setup';

describe('SandboxService', async () => {
  let services = await setup();
  let sandbox_service = services.resolve('service:sandbox');

  beforeEach(async () => {
    services = await setup();
    sandbox_service = services.resolve('service:sandbox');
  });

  const contextify = (overrides = {}) => ({
    query: {}, params: {}, body: {}, headers: {}, ...overrides,
  });

  describe('validate', () => {
    test('should validate valid javascript code', () => {
      const [error, result] = sandbox_service.validate('() => ({ ok: true })');

      expect(error).toBeNull();
      expect(result).toBeDefined();
    });

    test('should reject invalid javascript code', () => {
      const [error] = sandbox_service.validate('invalid {');

      expect(error).toBeDefined();
    });
  });

  describe('execute', () => {
    test('should execute valid javascript code', async () => {
      const context = contextify();
      const [error, result] = await sandbox_service.execute('() => ({ ok: true })', context);

      expect(error).toBeNull();
      expect(result).toBeDefined();
    });

    test('should throw error for invalid javascript code', async () => {
      const context = contextify();
      const [error] = await sandbox_service.execute('invalid {', context);

      expect(error).toBeDefined();
    });
  });
});
