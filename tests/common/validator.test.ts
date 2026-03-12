import { describe, expect, test } from 'bun:test';
import { Validator } from '../../src/common/validation';

describe('Validator', () => {
  describe('boolean', () => {
    test('accepts true', () => {
      const validator = new Validator({ active: true });
      const { success, payload } = validator.boolean('active').validate();

      expect(success).toBe(true);
      expect(payload.active).toBe(true);
    });

    test('accepts false', () => {
      const validator = new Validator({ active: false });
      const { success, payload } = validator.boolean('active').validate();

      expect(success).toBe(true);
      expect(payload.active).toBe(false);
    });

    test('rejects string values', () => {
      const validator = new Validator({ active: 'true' });
      const { success, errors } = validator.boolean('active').validate();

      expect(success).toBe(false);
      expect(errors.active).toBeDefined();
    });

    test('rejects numeric values', () => {
      const validator = new Validator({ active: 1 });
      const { success, errors } = validator.boolean('active').validate();

      expect(success).toBe(false);
      expect(errors.active).toBeDefined();
    });

    test('rejects null', () => {
      const validator = new Validator({ active: null });
      const { success, errors } = validator.boolean('active').validate();

      expect(success).toBe(false);
      expect(errors.active).toBeDefined();
    });
  });

  describe('string', () => {
    test('accepts non-empty string', () => {
      const validator = new Validator({ name: 'John' });
      const { success, payload } = validator.string('name').validate();

      expect(success).toBe(true);
      expect(payload.name).toBe('John');
    });

    test('trims surrounding whitespace', () => {
      const validator = new Validator({ name: '  John  ' });
      const { success, payload } = validator.string('name').validate();

      expect(success).toBe(true);
      expect(payload.name).toBe('John');
    });

    test('rejects empty string', () => {
      const validator = new Validator({ name: '' });
      const { success, errors } = validator.string('name').validate();

      expect(success).toBe(false);
      expect(errors.name).toBeDefined();
    });

    test('rejects whitespace-only string', () => {
      const validator = new Validator({ name: '   ' });
      const { success, errors } = validator.string('name').validate();

      expect(success).toBe(false);
      expect(errors.name).toBeDefined();
    });

    test('rejects non-string values', () => {
      const validator = new Validator({ name: 123 });
      const { success, errors } = validator.string('name').validate();

      expect(success).toBe(false);
      expect(errors.name).toBeDefined();
    });
  });

  describe('number', () => {
    test('accepts positive number', () => {
      const validator = new Validator({ count: 42 });
      const { success, payload } = validator.number('count').validate();

      expect(success).toBe(true);
      expect(payload.count).toBe(42);
    });

    test('accepts zero', () => {
      const validator = new Validator({ count: 0 });
      const { success, payload } = validator.number('count').validate();

      expect(success).toBe(true);
      expect(payload.count).toBe(0);
    });

    test('accepts negative numbers', () => {
      const validator = new Validator({ count: -5 });
      const { success, payload } = validator.number('count').validate();

      expect(success).toBe(true);
      expect(payload.count).toBe(-5);
    });

    test('rejects string numbers', () => {
      const validator = new Validator({ count: '42' });
      const { success, errors } = validator.number('count').validate();

      expect(success).toBe(false);
      expect(errors.count).toBeDefined();
    });

    test('rejects NaN', () => {
      const validator = new Validator({ count: NaN });
      const { success, errors } = validator.number('count').validate();

      expect(success).toBe(false);
      expect(errors.count).toBeDefined();
    });
  });

  describe('enum', () => {
    test('accepts allowed value', () => {
      const validator = new Validator({ method: 'GET' });
      const { success, payload } = validator.enum('method', ['GET', 'POST', 'PUT']).validate();

      expect(success).toBe(true);
      expect(payload.method).toBe('GET');
    });

    test('rejects value not in enum', () => {
      const validator = new Validator({ method: 'DELETE' });
      const { success, errors } = validator.enum('method', ['GET', 'POST', 'PUT']).validate();

      expect(success).toBe(false);
      expect(errors.method).toBeDefined();
    });

    test('rejects case mismatched value', () => {
      const validator = new Validator({ method: 'get' });
      const { success, errors } = validator.enum('method', ['GET', 'POST', 'PUT']).validate();

      expect(success).toBe(false);
      expect(errors.method).toBeDefined();
    });
  });

  describe('custom', () => {
    const email_validator = (value: unknown) => typeof value === 'string' && value.includes('@');

    test('accepts value passing custom validator', () => {
      const validator = new Validator({ email: 'it@example.com' });
      const { success, payload } = validator.custom('email', email_validator, 'must be a valid email').validate();

      expect(success).toBe(true);
      expect(payload.email).toBe('it@example.com');
    });

    test('rejects value failing custom validator', () => {
      const validator = new Validator({ email: 'invalid' });
      const { success, errors } = validator.custom('email', email_validator, 'must be a valid email').validate();

      expect(success).toBe(false);
      expect(errors.email).toBeDefined();
    });
  });

  describe('optional', () => {
    test('accepts value when present', () => {
      const validator = new Validator({ name: 'John' });
      const { success, payload } = validator.optional('name', 'string').validate();

      expect(success).toBe(true);
      expect(payload.name).toBe('John');
    });

    test('allows missing field', () => {
      const validator = new Validator({});
      const { success, payload } = validator.optional('name', 'string').validate();

      expect(success).toBe(true);
      expect(payload.name).toBeUndefined();
    });

    test('rejects invalid type when value provided', () => {
      const validator = new Validator({ name: 123 });
      const { success, errors } = validator.optional('name', 'string').validate();

      expect(success).toBe(false);
      expect(errors.name).toBeDefined();
    });
  });

  describe('path', () => {
    test('accepts simple route', () => {
      const validator = new Validator({ path: '/users' });
      const { success, payload } = validator.path('path').validate();

      expect(success).toBe(true);
      expect(payload.path).toBe('/users');
    });

    test('accepts route with parameters', () => {
      const validator = new Validator({ path: '/users/:id' });
      const { success, payload } = validator.path('path').validate();

      expect(success).toBe(true);
      expect(payload.path).toBe('/users/:id');
    });

    test('rejects malformed route pattern', () => {
      const validator = new Validator({ path: '/users/[' });
      const { success, errors } = validator.path('path').validate();

      expect(success).toBe(false);
      expect(errors.path).toBeDefined();
    });

    test('rejects empty string', () => {
      const validator = new Validator({ path: '' });
      const { success, errors } = validator.path('path').validate();

      expect(success).toBe(false);
      expect(errors.path).toBeDefined();
    });

    test('rejects non-string values', () => {
      const validator = new Validator({ path: 123 });
      const { success, errors } = validator.path('path').validate();

      expect(success).toBe(false);
      expect(errors.path).toBeDefined();
    });
  });

  describe('combined validation', () => {
    test('accepts valid payload', () => {
      const validator = new Validator({ path: '/users/:id', method: 'GET' });
      const { success, payload } = validator.path('path').string('method').validate();

      expect(success).toBe(true);
      expect(payload.path).toBe('/users/:id');
      expect(payload.method).toBe('GET');
    });

    test('collects errors from multiple fields', () => {
      const validator = new Validator({ path: '/users/[', method: 123 });
      const { success, errors } = validator.path('path').string('method').validate();

      expect(success).toBe(false);
      expect(errors.path).toBeDefined();
      expect(errors.method).toBeDefined();
    });
  });
});
