type ErrorCode = 
  | 'UNAUTHORIZED' 
  | 'RATE_LIMITED' 
  | 'BAD_REQUEST' 
  | 'NOT_FOUND' 
  | 'VALIDATION_FAILED' 
  | 'CONFLICT' 
  | 'SERVICE_NOT_REGISTERED' 
  | 'PERSISTENCE_FAILED' 
  | 'HANDLER_EXECUTION_FAILED' 
  | 'INTERNAL_ERROR';

type ErrorPayload = Record<string, unknown>;

export type { ErrorCode, ErrorPayload };
