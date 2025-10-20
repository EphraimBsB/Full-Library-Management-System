import 'dart:developer';

import 'package:dio/dio.dart';
import 'package:dartz/dartz.dart';
import 'package:flutter/foundation.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/loans/data/api/loan_api_service.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/domain/repositories/loan_repository.dart';

class NotFoundFailure extends Failure {
  const NotFoundFailure(String message) : super(message);

  @override
  List<Object> get props => [message];
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure(String message) : super(message);

  @override
  List<Object> get props => [message];
}

class LoanRepositoryImpl implements LoanRepository {
  final LoanApiService _apiService;

  const LoanRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<Loan>>> getLoans({
    String? status,
    String? userId,
    String? bookId,
    bool? overdueOnly,
    int? page,
    int? limit,
  }) async {
    return _handleApiCall(
      () => _apiService.getLoans(
        status: status,
        userId: userId,
        bookId: bookId,
        overdueOnly: overdueOnly,
        page: page,
        limit: limit,
      ),
    );
  }

  @override
  Future<Either<Failure, Loan>> getLoanById(String id) async {
    return _handleApiCall(() => _apiService.getLoanById(id));
  }

  @override
  Future<Either<Failure, Loan>> createLoan(Loan loan) async {
    return _handleApiCall(() => _apiService.createLoan(loan.toJson()));
  }

  @override
  Future<Either<Failure, Loan>> updateLoan(
    String id,
    Map<String, dynamic> updates,
  ) async {
    return _handleApiCall(() => _apiService.updateLoan(id, updates));
  }

  @override
  Future<Either<Failure, Unit>> deleteLoan(String id) async {
    return _handleApiCall<Unit>(() async {
      await _apiService.deleteLoan(id);
      return unit;
    });
  }

  @override
  Future<Either<Failure, Loan>> returnBook(String id) async {
    return _handleApiCall(() => _apiService.returnBook(id));
  }

  @override
  Future<Either<Failure, Loan>> renewLoan(String id) async {
    return _handleApiCall(() => _apiService.renewLoan(id));
  }

  @override
  Future<Either<Failure, List<Loan>>> getOverdueLoans({
    int? page,
    int? limit,
  }) async {
    return _handleApiCall(
      () => _apiService.getOverdueLoans(page: page, limit: limit),
    );
  }

  @override
  Future<Either<Failure, List<Loan>>> getUserLoans(
    String userId, {
    String? status,
    int? page,
    int? limit,
  }) async {
    return _handleApiCall(
      () => _apiService.getUserLoans(
        userId,
        status: status,
        page: page,
        limit: limit,
      ),
    );
  }

  Future<Either<Failure, T>> _handleApiCall<T>(
    Future<T> Function() apiCall, {
    String operation = 'operation',
  }) async {
    try {
      final result = await apiCall();
      return Right(result);
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final errorMessage =
          _getErrorMessageFromResponse(e.response?.data) ??
          e.message ??
          'An error occurred during $operation';

      if (statusCode != null && statusCode >= 500) {
        return Left(ServerFailure('Server error: $errorMessage'));
      } else if (statusCode == 404) {
        return Left(NotFoundFailure('Resource not found'));
      } else if (statusCode == 401 || statusCode == 403) {
        return Left(UnauthorizedFailure('Authentication required'));
      } else {
        return Left(ServerFailure(errorMessage));
      }
    } on FormatException catch (e) {
      return Left(ServerFailure('Data format error: ${e.message}'));
    } on TypeError catch (e) {
      return Left(
        ServerFailure(
          'Type error: ${e.toString()}. Please check the API response format.',
        ),
      );
    } catch (e, stackTrace) {
      if (kDebugMode) {
        log(
          'Unexpected error during $operation',
          error: e,
          stackTrace: stackTrace,
        );
      }
      return Left(
        ServerFailure('An unexpected error occurred during $operation'),
      );
    }
  }

  String? _getErrorMessageFromResponse(dynamic responseData) {
    if (responseData == null) return null;

    try {
      if (responseData is Map<String, dynamic>) {
        return responseData['message']?.toString() ??
            responseData['error']?.toString() ??
            responseData['errors']?.toString();
      }
      return responseData.toString();
    } catch (e) {
      return 'Failed to parse error message';
    }
  }
}
