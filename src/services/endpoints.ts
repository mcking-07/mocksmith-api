import type { EndpointsRepository } from '../database';
import { Conflict, NotFound, PersistenceFailed, ValidationFailed } from '../errors';
import { EventPublisher, EndpointCreated, EndpointDeleted, EndpointUpdated } from '../eventing';
import type { SandboxService } from './sandbox';

class EndpointsService {
  private readonly endpoints: EndpointsRepository;
  private readonly sandbox: SandboxService;
  constructor(endpoints: EndpointsRepository, sandbox: SandboxService) {
    this.endpoints = endpoints;
    this.sandbox = sandbox;
  }

  create = (path: string, method: string, handler: string) => {
    const normalized = method?.toUpperCase();
    const existing = this.endpoints.find_by_path_and_method(path, normalized);
    if (existing) throw new Conflict('endpoint already exists', { existing_id: existing.id });

    const [validation_error] = this.sandbox.validate(handler);
    if (validation_error) throw new ValidationFailed('handler contains invalid javascript', { cause: validation_error.message });

    const [create_error, id] = this.endpoints.create({ path, method: normalized, handler });
    if (create_error || !id) throw new PersistenceFailed('failed to create endpoint', { path, method: normalized });

    const endpoint = this.endpoints.read(id);
    if (!endpoint) throw new PersistenceFailed('failed to read back endpoint after create', { id });

    EventPublisher.emit(new EndpointCreated({ id }));
    return endpoint;
  };

  find = (id?: string) => {
    if (!id) return this.endpoints.find_active();

    const endpoint = this.endpoints.read(id);
    if (!endpoint) throw new NotFound(`endpoint not found with id ${id}`, { id });

    return endpoint;
  };

  find_by_path_and_method = (path: string, method: string) => {
    const endpoint = this.endpoints.find_by_path_and_method(path, method);
    if (!endpoint) throw new NotFound(`endpoint not found with path ${path} and method ${method}`, { path, method });

    return endpoint;
  };

  update = (id: string, path?: string, method?: string, handler?: string) => {
    const existing = this.endpoints.read(id);
    if (!existing) throw new NotFound(`endpoint not found with id ${id}`, { id });

    const changes = Object.fromEntries(Object.entries({ path, method: method?.toUpperCase(), handler }).filter(([_, value]) => value !== undefined));
    if (!Object.keys(changes).length) return existing;

    if (changes?.handler) {
      const [validation_error] = this.sandbox.validate(changes.handler);
      if (validation_error) throw new ValidationFailed('handler contains invalid javascript', { cause: validation_error.message });
    }

    const [update_error] = this.endpoints.update(id, changes);
    if (update_error) throw new PersistenceFailed('failed to update endpoint', { id });

    const updated = this.endpoints.read(id);
    if (!updated) throw new PersistenceFailed('failed to read back endpoint after update', { id });

    EventPublisher.emit(new EndpointUpdated({ id: updated.id }));
    return updated;
  };

  delete = (id: string) => {
    const existing = this.endpoints.read(id);
    if (!existing) throw new NotFound(`endpoint not found with id ${id}`, { id });

    const [delete_error] = this.endpoints.delete(id);
    if (delete_error) throw new PersistenceFailed('failed to delete endpoint', { id });

    EventPublisher.emit(new EndpointDeleted({ id: existing.id }));
  };
}

export { EndpointsService };
