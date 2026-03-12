import { beforeEach, describe, expect, test } from 'bun:test';
import { setup } from '../setup';

describe('EndpointsRepository', async () => {
  let services = await setup();
  let endpoints_repo = services.resolve('database:endpoints');

  beforeEach(async () => {
    services = await setup();
    endpoints_repo = services.resolve('database:endpoints');
  });

  describe('create', () => {
    test('should create endpoint', () => {
      const [error, id] = endpoints_repo.create({ path: '/api/test', method: 'GET', handler: '() => ({ ok: true })' });

      expect(error).toBeNull();
      expect(typeof id).toBe('string');
      expect(id?.length).toBeGreaterThan(0);
    });
  });

  describe('read', () => {
    test('should return existing endpoint by id', () => {
      const [error, id] = endpoints_repo.create({ path: '/api/read-test', method: 'POST', handler: '() => ({ id: context.params.id })' });

      expect(error).toBeNull();
      expect(id).not.toBeNull();

      const endpoint = endpoints_repo.read(id!);

      expect(endpoint).not.toBeNull();
      expect(endpoint?.path).toBe('/api/read-test');
      expect(endpoint?.method).toBe('POST');
    });

    test('should return null for non-existent endpoint', () => {
      const endpoint = endpoints_repo.read('non-existent-id');
      expect(endpoint).toBeNull();
    });
  });

  describe('find_by_path_and_method', () => {
    test('should find endpoint by path and method', () => {
      endpoints_repo.create({ path: '/api/exact', method: 'GET', handler: '() => ({ ok: true })' });

      const result = endpoints_repo.find_by_path_and_method('/api/exact', 'GET');

      expect(result).not.toBeNull();
      expect(result?.path).toBe('/api/exact');
    });

    test('should return null when no match', () => {
      const result = endpoints_repo.find_by_path_and_method('/api/nonexistent', 'GET');
      expect(result).toBeNull();
    });
  });

  describe('find_by_method', () => {
    test('should return endpoints filtered by method', () => {
      endpoints_repo.create({ path: '/api/get-1', method: 'GET', handler: '() => ({})' });
      endpoints_repo.create({ path: '/api/get-2', method: 'GET', handler: '() => ({})' });
      endpoints_repo.create({ path: '/api/post-1', method: 'POST', handler: '() => ({})' });

      const get_endpoints = endpoints_repo.find_by_method('GET');
      const post_endpoints = endpoints_repo.find_by_method('POST');

      expect(get_endpoints.length).toBeGreaterThanOrEqual(2);
      expect(post_endpoints.length).toBeGreaterThanOrEqual(1);
      expect(get_endpoints.every(endpoint => endpoint.method === 'GET')).toBe(true);
      expect(post_endpoints.every(endpoint => endpoint.method === 'POST')).toBe(true);
    });
  });

  describe('find_active', () => {
    test('should return only non-deleted endpoints', () => {
      const [first_error, active_id] = endpoints_repo.create({ path: '/api/active', method: 'GET', handler: '() => ({ ok: true })' });
      expect(first_error).toBeNull();

      const [second_error, deleted_id] = endpoints_repo.create({ path: '/api/deleted', method: 'GET', handler: '() => ({ ok: true })' });
      expect(second_error).toBeNull();

      const [delete_error] = endpoints_repo.delete(deleted_id!);
      expect(delete_error).toBeNull();

      const active_endpoints = endpoints_repo.find_active();

      expect(active_endpoints.some(endpoint => endpoint.id === active_id)).toBe(true);
      expect(active_endpoints.some(endpoint => endpoint.id === deleted_id)).toBe(false);
    });
  });

  describe('delete', () => {
    test('should soft delete endpoint', () => {
      const [create_error, id] = endpoints_repo.create({ path: '/api/to-delete', method: 'GET', handler: '() => ({ ok: true })' });

      expect(create_error).toBeNull();
      expect(id).not.toBeNull();
      expect(endpoints_repo.read(id!)).not.toBeNull();

      const [delete_error] = endpoints_repo.delete(id!);
      expect(delete_error).toBeNull();

      const active_endpoints = endpoints_repo.find_active();
      expect(active_endpoints.some(endpoint => endpoint.id === id)).toBe(false);

      const all_endpoints = endpoints_repo.read();
      expect(all_endpoints.some(endpoint => endpoint.id === id)).toBe(true);
    });
  });
});
