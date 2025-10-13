import 'package:equatable/equatable.dart';

abstract class Failure extends Equatable {
  final String message;

  const Failure(this.message);

  @override
  List<Object> get props => [message];
}

class ServerFailure extends Failure {
  const ServerFailure(String message) : super(message);
}

class CacheFailure extends Failure {
  const CacheFailure(String message) : super(message);
}

class NetworkFailure extends Failure {
  const NetworkFailure(String message) : super(message);
  
  const NetworkFailure.noInternet() : super('No internet connection');
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure(String s) : super('Unauthorized access');
}

class NotFoundFailure extends Failure {
  const NotFoundFailure(String s) : super('Resource not found');
}

class ValidationFailure extends Failure {
  const ValidationFailure(String message) : super(message);
}
