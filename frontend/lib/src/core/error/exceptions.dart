import 'package:equatable/equatable.dart';

abstract class AppException extends Equatable implements Exception {
  final String message;
  final int? statusCode;

  const AppException(this.message, {this.statusCode});

  @override
  String toString() => message;

  @override
  List<Object?> get props => [message, statusCode];
}

class ServerException extends AppException {
  const ServerException(String message, {int? statusCode})
    : super(message, statusCode: statusCode);
}

class CacheException extends AppException {
  const CacheException(String message) : super(message);
}

class NetworkException extends AppException {
  const NetworkException() : super('No internet connection');
}

class UnauthorizedException extends AppException {
  const UnauthorizedException(String s)
    : super('Unauthorized access', statusCode: 401);
}

class NotFoundException extends AppException {
  const NotFoundException() : super('Resource not found', statusCode: 404);
}

class ValidationException extends AppException {
  final Map<String, dynamic>? errors;

  const ValidationException(String message, {this.errors}) : super(message);

  @override
  List<Object?> get props => [message, errors];
}
