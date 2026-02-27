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

  private append = (field: string, message: string) => {
    this.errors[field] ??= [];
    this.errors[field].push(message);
  };

  private missing = (value: unknown) => {
    return value === undefined || value === null;
  };

  string = (field: string, options: ValidatorOptions = {}) => {
    const value = this.source[field];

    if (this.missing(value)) {
      if (!options.optional) this.append(field, `${field} is required`);
      return this;
    }

    if (typeof value !== 'string' || !value.trim()) {
      this.append(field, `${field} is not a valid string`);
      return this;
    }

    this.output[field] = value.trim();
    return this;
  };

  number = (field: string, options: ValidatorOptions = {}) => {
    const value = this.source[field];

    if (this.missing(value)) {
      if (!options.optional) this.append(field, `${field} is required`);
      return this;
    }

    if (typeof value !== 'number' || Number.isNaN(value)) {
      this.append(field, `${field} is not a number`);
      return this;
    }

    this.output[field] = value;
    return this;
  };

  boolean = (field: string, options: ValidatorOptions = {}) => {
    const value = this.source[field];

    if (this.missing(value)) {
      if (!options.optional) this.append(field, `${field} is required`);
      return this;
    }

    if (typeof value !== 'boolean') {
      this.append(field, `${field} is not a boolean`);
      return this;
    }

    this.output[field] = value;
    return this;
  };

  enum = (field: string, values: string[], options: ValidatorOptions = {}) => {
    const value = this.source[field];

    if (this.missing(value)) {
      if (!options.optional) this.append(field, `${field} is required`);
      return this;
    }

    if (!values.includes(value as string)) {
      this.append(field, `${field} is not a valid enum value. must be one of [${values.join(', ')}]`);
      return this;
    }

    this.output[field] = value;
    return this;
  };

  custom = (field: string, validate: (value: unknown) => boolean, message: string) => {
    const value = this.source[field];
    if (!this.missing(value) && !validate(value)) {
      this.append(field, message);
    }
    return this;
  };

  optional = (field: string) => {
    const value = this.source[field];
    this.output[field] = value;
    return this;
  };

  validate = () => {
    const success = Object.keys(this.errors).length === 0;
    return { success, errors: this.errors, payload: this.output as PayloadType };
  };
}

export { Validator };
