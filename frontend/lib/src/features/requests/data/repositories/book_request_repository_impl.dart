import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/auth/utils/token_storage.dart';
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
      final response = await testDirectRequest(requestBody);
      print('Direct request successful!');
      return Right(BookRequest.fromJson(response));
    } on DioException catch (e) {
      final errorMessage =
          e.response?.data?['message']?.toString() ??
          'Failed to create book request';
      return Left(ServerFailure(errorMessage));
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }

  Future<Map<String, dynamic>> testDirectRequest(
    Map<String, dynamic> body,
  ) async {
    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: 'http://localhost:3000/api/v1',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
        ),
      );

      final token = await tokenStorage.getToken();

      // Add your auth token if needed
      dio.options.headers['Authorization'] = 'Bearer $token';

      final response = await dio.post(
        '/book-requests',
        data: body,
        options: Options(
          sendTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
        ),
      );

      print('Direct request successful!');
      print('Status code: ${response.statusCode}');
      print('Response data: ${response.data}');
      return response.data;
    } catch (e) {
      if (e is DioException) {
        print('Direct request failed with DioError:');
        print('Error: ${e.message}');
        print('Response: ${e.response?.data}');
        print('Status code: ${e.response?.statusCode}');
      } else {
        print('Direct request failed with error: $e');
      }
      rethrow;
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
              'Failed to fetch pending requests',
        ),
      );
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred'));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> approveBookRequest({
    required String requestId,
    required String preferredCopyId,
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
