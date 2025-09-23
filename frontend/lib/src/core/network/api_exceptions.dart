/// Base API exception class
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  const ApiException({required this.message, this.statusCode, this.data});

  @override
  String toString() =>
      'ApiException: $message${statusCode != null ? ' ($statusCode)' : ''}';
}

/// 400 Bad Request
class BadRequestException extends ApiException {
  BadRequestException({String? message, dynamic data})
    : super(message: message ?? 'Bad request', statusCode: 400, data: data);
}

/// 401 Unauthorized
class UnauthorizedException extends ApiException {
  UnauthorizedException({String? message, dynamic data})
    : super(message: message ?? 'Unauthorized', statusCode: 401, data: data);
}

/// 403 Forbidden
class ForbiddenException extends ApiException {
  ForbiddenException({String? message, dynamic data})
    : super(message: message ?? 'Forbidden', statusCode: 403, data: data);
}

/// 404 Not Found
class NotFoundException extends ApiException {
  NotFoundException({String? message, dynamic data})
    : super(
        message: message ?? 'Resource not found',
        statusCode: 404,
        data: data,
      );
}

/// 422 Unprocessable Entity (Validation errors)
class ValidationException extends ApiException {
  final Map<String, dynamic> errors;

  ValidationException({String? message, required this.errors, dynamic data})
    : super(
        message: message ?? 'Validation failed',
        statusCode: 422,
        data: data,
      );

  @override
  String toString() {
    final errorMessages = errors.entries
        .map(
          (e) =>
              '${e.key}: ${e.value is List ? (e.value as List).join(', ') : e.value}',
        )
        .join('; ');
    return 'ValidationException: $message. Errors: $errorMessages';
  }
}

/// 500 Internal Server Error
class ServerException extends ApiException {
  ServerException({String? message, dynamic data})
    : super(
        message: message ?? 'Internal server error',
        statusCode: 500,
        data: data,
      );
}

/// No internet connection
class NoInternetException extends ApiException {
  NoInternetException()
    : super(message: 'No internet connection', statusCode: -1);
}

/// Request cancelled
class CancelRequestException extends ApiException {
  CancelRequestException()
    : super(message: 'Request cancelled', statusCode: -2);
}
