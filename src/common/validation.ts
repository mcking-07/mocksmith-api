import { match } from 'path-to-regexp';
import { safe } from './safe';
import type { ValidatorOptions } from '../types';

class Validator<PayloadType extends Record<string, unknown>> {
  private readonly source: Record<string, unknown>;
  private errors: Record<string, string[]> = {};
  private output: Record<string, unknown> = {};
  constructor(source: Record<string, unknown>) {
    this.source = source;
    this.errors = {};
    this.output = {};
  }

  private formatted = (value: unknown) => {
    return typeof value === 'string' ? `"${value}"` : JSON.stringify(value);
  };

  private append = (field: string, expected: string, received: unknown) => {
    this.errors[field] ??= [];
    this.errors[field].push(`${field} ${expected}, received: ${this.formatted(received)}`);
  };

  private missing = (value: unknown) => {
    return value === undefined || value === null;
  };

  private value_of = (field: string, options: ValidatorOptions = {}) => {
    const value = this.source[field];

    if (this.missing(value)) {
      if (!options.optional) this.append(field, 'is required', 'undefined');
      return undefined;
    }

    return value;
  };

  string = (field: string, options: ValidatorOptions = {}) => {
    const value = this.value_of(field, options);
    if (value === undefined) return this;

    if (typeof value !== 'string') {
      this.append(field, 'must be a string', value);
      return this;
    }

    if (!value.trim()) {
      this.append(field, 'must be a non-empty string', value);
      return this;
    }

    this.output[field] = value.trim();
    return this;
  };

  number = (field: string, options: ValidatorOptions = {}) => {
    const value = this.value_of(field, options);
    if (value === undefined) return this;

    if (typeof value !== 'number' || Number.isNaN(value)) {
      this.append(field, 'must be a valid number', value);
      return this;
    }

    this.output[field] = value;
    return this;
  };

  boolean = (field: string, options: ValidatorOptions = {}) => {
    const value = this.value_of(field, options);
    if (value === undefined) return this;

    if (typeof value !== 'boolean') {
      this.append(field, 'must be a boolean', value);
      return this;
    }

    this.output[field] = value;
    return this;
  };

  enum = (field: string, values: string[], options: ValidatorOptions = {}) => {
    const value = this.value_of(field, options);
    if (value === undefined) return this;

    if (typeof value !== 'string') {
      this.append(field, 'must be a string', value);
      return this;
    }

    if (!values.includes(value)) {
      this.append(field, `must be one of [${values.join(', ')}]`, value);
      return this;
    }

    this.output[field] = value;
    return this;
  };

  custom = (field: string, validate: (value: unknown) => boolean, message: string) => {
    const value = this.value_of(field);
    if (value === undefined) return this;

    if (!validate(value)) {
      this.append(field, message, value);
    }

    this.output[field] = value;
    return this;
  };

  optional = (field: string, type: 'string' | 'number' | 'boolean') => {
    const options = { optional: true };
    const validators = {
      string: () => this.string(field, options),
      number: () => this.number(field, options),
      boolean: () => this.boolean(field, options),
    };

    const validator = validators[type];
    if (!validator) {
      this.append(field, `unsupported optional type: ${type}`, type);
    }

    return validator();
  };

  path = (field: string, options: ValidatorOptions = {}) => {
    const value = this.value_of(field, options);
    if (value === undefined) return this;

    if (typeof value !== 'string') {
      this.append(field, 'must be a string', value);
      return this;
    }

    if (!value.trim()) {
      this.append(field, 'must be a non-empty string', value);
      return this;
    }

    const [error] = safe(() => match(value.trim()))();
    if (error) {
      this.append(field, `${error?.message?.split(';')[0] ?? 'contains invalid pattern'}`, value);
      return this;
    }

    this.output[field] = value.trim();
    return this;
  };

  validate = () => {
    const success = Object.keys(this.errors).length === 0;
    return { success, errors: this.errors, payload: this.output as PayloadType };
  };
}

export { Validator };
