/// A class that represents either a success or a failure.
sealed class Result<T> {
  const Result();
  
  /// Returns `true` if the result is a success.
  bool get isSuccess => this is Success<T>;
  
  /// Returns `true` if the result is a failure.
  bool get isFailure => this is Failure<T>;
  
  /// Returns the success value if this is a success, otherwise returns null.
  T? get successOrNull => isSuccess ? (this as Success<T>).value : null;
  
  /// Returns the failure value if this is a failure, otherwise returns null.
  dynamic get failureOrNull => isFailure ? (this as Failure<T>).error : null;
  
  /// Maps the success value using the provided function.
  Result<R> mapSuccess<R>(R Function(T) f) {
    return when(
      success: (value) => Success(f(value)),
      failure: (error, stackTrace) => Failure(error, stackTrace),
    );
  }
  
  /// Maps the failure value using the provided function.
  Result<T> mapFailure(dynamic Function(dynamic, StackTrace?) f) {
    return when(
      success: (value) => Success(value),
      failure: (error, stackTrace) => Failure(f(error, stackTrace), stackTrace),
    );
  }
  
  /// Handles both success and failure cases.
  R when<R>({
    required R Function(T value) success,
    required R Function(dynamic error, StackTrace? stackTrace) failure,
  }) {
    if (this is Success<T>) {
      return success((this as Success<T>).value);
    } else {
      final f = this as Failure<T>;
      return failure(f.error, f.stackTrace);
    }
  }
  
  /// Executes the provided function if this is a success.
  void onSuccess(void Function(T) action) {
    if (isSuccess) {
      action((this as Success<T>).value);
    }
  }
  
  /// Executes the provided function if this is a failure.
  void onFailure(void Function(dynamic, StackTrace?) action) {
    if (isFailure) {
      final f = this as Failure<T>;
      action(f.error, f.stackTrace);
    }
  }
}

/// Represents a successful result.
class Success<T> extends Result<T> {
  final T value;
  
  const Success(this.value);
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Success<T> && other.value == value;
  }
  
  @override
  int get hashCode => value.hashCode;
  
  @override
  String toString() => 'Success($value)';
}

/// Represents a failed result.
class Failure<T> extends Result<T> {
  final dynamic error;
  final StackTrace? stackTrace;
  
  const Failure(this.error, [this.stackTrace]);
  
  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Failure<T> && other.error == error;
  }
  
  @override
  int get hashCode => error.hashCode;
  
  @override
  String toString() => 'Failure($error)';
}

/// Extension to convert Future results to Result
extension FutureResultExtension<T> on Future<T> {
  /// Converts a Future that may throw into a Future<Result> that never throws.
  Future<Result<T>> asResult() async {
    try {
      final value = await this;
      return Success(value);
    } catch (e, stackTrace) {
      return Failure(e, stackTrace);
    }
  }
}

/// Extension to convert Result to nullable
extension ResultExtension<T> on Result<T> {
  /// Returns the success value or null if failed.
  T? getOrNull() => when(
        success: (value) => value,
        failure: (_, __) => null,
      );
  
  /// Returns the success value or throws if failed.
  T getOrThrow() => when(
        success: (value) => value,
        failure: (error, stackTrace) {
          if (error is Error) {
            Error.throwWithStackTrace(error, stackTrace ?? StackTrace.current);
          } else if (error is Exception) {
            Error.throwWithStackTrace(error, stackTrace ?? StackTrace.current);
          } else {
            Error.throwWithStackTrace(
              Exception(error.toString()), 
              stackTrace ?? StackTrace.current,
            );
          }
        },
      );
  
  /// Returns the success value or the provided default value if failed.
  T getOrElse(T defaultValue) => when(
        success: (value) => value,
        failure: (_, __) => defaultValue,
      );
  
  /// Returns the success value or computes it from the error.
  T getOrElseGet(T Function(dynamic error, StackTrace? stackTrace) onFailure) => when(
        success: (value) => value,
        failure: (error, stackTrace) => onFailure(error, stackTrace),
      );
}

/// Helper function to create a success result.
Result<T> success<T>(T value) => Success(value);

/// Helper function to create a failure result.
Result<T> failure<T>(dynamic error, [StackTrace? stackTrace]) => Failure<T>(error, stackTrace);
