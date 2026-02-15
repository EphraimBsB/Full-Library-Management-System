export class ApiException extends Error {
  statusCode?: number;
  data?: unknown;

  constructor(message: string, statusCode?: number, data?: unknown) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export class BadRequestException extends ApiException {
  constructor(message?: string, data?: unknown) {
    super(message || 'Bad request', 400, data);
    this.name = 'BadRequestException';
  }
}

export class UnauthorizedException extends ApiException {
  constructor(message?: string, data?: unknown) {
    super(message || 'Unauthorized', 401, data);
    this.name = 'UnauthorizedException';
  }
}

export class ForbiddenException extends ApiException {
  constructor(message?: string, data?: unknown) {
    super(message || 'Forbidden', 403, data);
    this.name = 'ForbiddenException';
  }
}

export class NotFoundException extends ApiException {
  constructor(message?: string, data?: unknown) {
    super(message || 'Resource not found', 404, data);
    this.name = 'NotFoundException';
  }
}

export class ValidationException extends ApiException {
  errors: Record<string, unknown>;

  constructor(message: string, errors: Record<string, unknown>, data?: unknown) {
    super(message || 'Validation failed', 422, data);
    this.name = 'ValidationException';
    this.errors = errors;
  }

  toString() {
    return `ValidationException: ${this.message}`;
  }
}

export class ServerException extends ApiException {
  constructor(message?: string, data?: unknown) {
    super(message || 'Internal server error', 500, data);
    this.name = 'ServerException';
  }
}

export class NetworkException extends ApiException {
  constructor(message?: string) {
    super(message || 'Network error', 0);
    this.name = 'NetworkException';
  }
}
