import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/requests/data/api/book_request_api_service.dart';
import 'package:management_side/src/features/requests/domain/models/book_request_model.dart';
import 'package:management_side/src/features/requests/domain/repositories/book_request_repository.dart';

class BookRequestRepositoryImpl implements BookRequestRepository {
  final BookRequestApiService _apiService;

  BookRequestRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, BookRequest>> createBookRequest({
    required String bookId,
    String? reason,
  }) async {
    try {
      final requestBody = {
        'bookId': bookId,
        if (reason != null && reason.isNotEmpty) 'reason': reason,
      };

      final request = await _apiService.createBookRequest(requestBody);
      return Right(request);
    } on DioException catch (e) {
      return Left(
        ServerFailure(
          e.response?.data?['message']?.toString() ??
              'Failed to create book request',
        ),
      );
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }

  @override
  Future<Either<Failure, List<BookRequest>>> getPendingBookRequests() async {
    try {
      final requests = await _apiService.getPendingBookRequests();
      return Right(requests);
    } on DioException catch (e) {
      return Left(
        ServerFailure(
          e.response?.data?['message']?.toString() ??
              'Failed to fetch pending book requests',
        ),
      );
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }

  @override
  Future<Either<Failure, List<BookRequest>>> getRenewalRequests({
    String? status,
  }) async {
    try {
      final requests = await _apiService.getRenewalRequests(status);
      return Right(requests);
    } on DioException catch (e) {
      return Left(
        ServerFailure(
          e.response?.data?['message']?.toString() ??
              'Failed to fetch renewal requests',
        ),
      );
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> approveRenewalRequest({
    required String requestId,
    String? notes,
  }) async {
    try {
      final result = await _apiService.approveRenewalRequest(requestId, {
        'reason': notes ?? '',
      });
      return Right(result);
    } on DioException catch (e) {
      return Left(
        ServerFailure(
          e.response?.data?['message']?.toString() ??
              'Failed to approve renewal request',
        ),
      );
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }

  @override
  Future<Either<Failure, void>> rejectRenewalRequest({
    required String requestId,
    required String notes,
  }) async {
    try {
      await _apiService.rejectRenewalRequest(requestId, {'reason': notes});
      return const Right(null);
    } on DioException catch (e) {
      return Left(
        ServerFailure(
          e.response?.data?['message']?.toString() ??
              'Failed to reject renewal request',
        ),
      );
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> approveBookRequest({
    required String requestId,
    String? preferredCopyId,
    String? notes,
  }) async {
    try {
      final requestBody = <String, dynamic>{
        'preferredCopyId': preferredCopyId,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };

      final result = await _apiService.approveBookRequest(
        requestId,
        requestBody,
      );
      return Right(result);
    } on DioException catch (e) {
      return Left(
        ServerFailure(
          e.response?.data?['message']?.toString() ??
              'Failed to approve book request',
        ),
      );
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }

  @override
  Future<Either<Failure, void>> rejectBookRequest({
    required String requestId,
    required String notes,
  }) async {
    try {
      await _apiService.rejectBookRequest(requestId, {'notes': notes});
      return const Right(null);
    } on DioException catch (e) {
      return Left(
        ServerFailure(
          e.response?.data?['message']?.toString() ??
              'Failed to reject book request',
        ),
      );
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }
}
