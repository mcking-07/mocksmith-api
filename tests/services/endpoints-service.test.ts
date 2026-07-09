import { beforeEach, describe, expect, test } from 'vitest';
import { Conflict, ValidationFailed, NotFound } from '../../src/errors';
import { setup } from '../setup';

describe('EndpointsService', async () => {
  let services = await setup();
  let endpoints_service = services.resolve('service:endpoints');

  beforeEach(async () => {
    services = await setup();
    endpoints_service = services.resolve('service:endpoints');
  });

  describe('create', () => {
    test('should create endpoint with valid path and method', async () => {
      const result = await endpoints_service.create('/api/test', 'GET', '() => ({ ok: true })');

      expect(result).toBeDefined();
      expect(result.path).toBe('/api/test');
      expect(result.method).toBe('GET');
    });

    test('should throw conflict when endpoint path and method already exist', async () => {
      await endpoints_service.create('/api/duplicate', 'GET', '() => ({ ok: true })');

      await expect(endpoints_service.create('/api/duplicate', 'GET', '() => ({ ok: true })')).rejects.toThrow(Conflict);
    });

    test('should throw validation failed for invalid javascript code', async () => {
      await expect(endpoints_service.create('/api/test', 'GET', 'invalid {')).rejects.toThrow(ValidationFailed);
    });
  });

  describe('find', () => {
    test('should find endpoint by id', async () => {
      const created = await endpoints_service.create('/api/test', 'GET', '() => ({ ok: true })');
      const found = await endpoints_service.find(created.id);

      if (!found) throw new Error('Endpoint Not Found');
      if (Array.isArray(found)) throw new Error('Expected Single Endpoint');

      expect(found).not.toBeNull();
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    test('should return all active endpoints when no id provided', async () => {
      await endpoints_service.create('/api/test-1', 'GET', '() => ({ ok: true })');
      await endpoints_service.create('/api/test-2', 'POST', '() => ({ ok: true })');

      const result = await endpoints_service.find();
      if (!Array.isArray(result)) throw new Error('Expected Array of Endpoints');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    test('should throw not found for non-existent id', async () => {
      await expect(endpoints_service.find('nonexistent-id')).rejects.toThrow(NotFound);
    });
  });

  describe('find_by_path_and_method', () => {
    test('should find endpoint by path and method with params', async () => {
      await endpoints_service.create('/users/:id', 'GET', '() => ({ id: context.params.id })');

      const result = await endpoints_service.find_by_path_and_method('/users/123', 'GET');

      expect(result).toBeDefined();
      expect(result.params).toEqual({ id: '123' });
    });

    test('should throw not found when no matching endpoint', async () => {
      await expect(endpoints_service.find_by_path_and_method('/nonexistent', 'GET')).rejects.toThrow(NotFound);
    });
  });

  describe('update', () => {
    test('should update existing endpoint', async () => {
      const created = await endpoints_service.create('/api/original', 'GET', '() => ({ ok: true })');
      const updated = await endpoints_service.update(created.id, '/api/updated', 'POST');

      expect(updated.path).toBe('/api/updated');
      expect(updated.method).toBe('POST');
    });

    test('should throw not found for non-existent endpoint', async () => {
      await expect(endpoints_service.update('nonexistent', '/api/new')).rejects.toThrow(NotFound);
    });
  });

  describe('delete', () => {
    test('should soft delete endpoint', async () => {
      const created = await endpoints_service.create('/api/to-delete', 'GET', '() => ({ ok: true })');

      await expect(endpoints_service.delete(created.id)).resolves.not.toThrow();

      const endpoints = await endpoints_service.find();
      if (!Array.isArray(endpoints)) throw new Error('Expected Array of Endpoints');

      expect(endpoints.some(endpoint => endpoint.id === created.id)).toBe(false);
    });

    test('should throw not found for non-existent endpoint', async () => {
      await expect(endpoints_service.delete('nonexistent')).rejects.toThrow(NotFound);
    });
  });
});
