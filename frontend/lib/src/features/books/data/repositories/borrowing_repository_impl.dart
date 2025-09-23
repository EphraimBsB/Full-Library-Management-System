import 'dart:developer';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/data/base_repository.dart'
    show BaseRepository, PaginatedResponse;
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/utils/result.dart'
    show Result, Success, Failure;
import 'package:management_side/src/features/books/data/api/borrowing_api_service.dart';
import 'package:management_side/src/features/books/data/api/book_request_api_service.dart';
import 'package:management_side/src/features/books/domain/models/borrowed_book.dart';
import 'package:management_side/src/features/books/domain/repositories/borrowing_repository.dart';

/// Implementation of [BorrowingRepository] that handles book borrowing related operations
class BorrowingRepositoryImpl extends BaseRepository
    implements BorrowingRepository {
  final BorrowingApiService _apiService;
  final BookRequestApiService _bookRequestApiService;

  /// Creates a new [BorrowingRepositoryImpl]
  ///
  /// [apiService] The API service to use for borrowing related requests.
  /// [bookRequestApiService] The API service to use for book request related requests.
  /// If not provided, new instances will be created using the default [ApiClient].
  BorrowingRepositoryImpl({
    BorrowingApiService? apiService,
    BookRequestApiService? bookRequestApiService,
  }) : _apiService = apiService ?? BorrowingApiService(ApiClient().dio),
       _bookRequestApiService =
           bookRequestApiService ?? BookRequestApiService(ApiClient().dio);

  @override
  Future<Result<PaginatedResponse<BorrowedBook>>> getBookBorrowingStatus({
    required String bookId,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      log('Fetching borrowing status for book: $bookId');
      final response = await _apiService.getBookBorrowingStatus(
        bookId,
        page,
        limit,
      );
      return Success(response);
    } on DioException catch (e) {
      log('Error fetching book borrowing status: ${e.message}');
      return Failure(
        Exception(
          e.response?.data?['message'] ??
              'Failed to load book borrowing status',
        ),
        StackTrace.current,
      );
    } catch (e, stackTrace) {
      log('Unexpected error in getBookBorrowingStatus: $e');
      return Failure(
        Exception('Failed to load book borrowing status'),
        stackTrace,
      );
    }
  }

  @override
  Future<Result<PaginatedResponse<BorrowedBook>>> getBookBorrowingHistory({
    required String bookId,
    int page = 1,
    int limit = 10,
  }) async {
    try {
      log('Fetching borrowing history for book: $bookId');
      final response = await _apiService.getBookBorrowingHistory(
        bookId,
        page,
        limit,
      );
      return Success(response);
    } on DioException catch (e) {
      log('Error fetching book borrowing history: ${e.message}');
      return Failure(
        Exception(
          e.response?.data?['message'] ??
              'Failed to load book borrowing history',
        ),
        StackTrace.current,
      );
    } catch (e, stackTrace) {
      log('Unexpected error in getBookBorrowingHistory: $e');
      return Failure(
        Exception('Failed to load book borrowing history'),
        stackTrace,
      );
    }
  }

  @override
  Future<Result<BorrowingStats>> getBookBorrowingStats(String bookId) async {
    try {
      log('Fetching borrowing stats for book: $bookId');
      final response = await _apiService.getBookBorrowingStats(bookId);
      return Success(response);
    } on DioException catch (e) {
      log('Error fetching book borrowing stats: ${e.message}');
      return Failure(
        Exception(
          e.response?.data?['message'] ?? 'Failed to load book borrowing stats',
        ),
        StackTrace.current,
      );
    } catch (e, stackTrace) {
      log('Unexpected error in getBookBorrowingStats: $e');
      return Failure(
        Exception('Failed to load book borrowing stats'),
        stackTrace,
      );
    }
  }

  @override
  Future<Result<List<BorrowedBook>>> getBookRequestQueue({
    required String bookId,
  }) async {
    try {
      log('Fetching request queue for book: $bookId');
      final response = await _bookRequestApiService.getBookRequestQueue(bookId);
      log('Request queue response: ${response.length} items');
      return Success(response);
    } on DioException catch (e) {
      log('Error fetching book request queue: ${e.message}');
      log('Error response: ${e.response?.data}');
      return Failure(
        Exception(
          e.response?.data?['message'] ?? 'Failed to load book request queue',
        ),
        StackTrace.current,
      );
    } catch (e, stackTrace) {
      log('Unexpected error in getBookRequestQueue: $e');
      log('Stack trace: $stackTrace');
      return Failure(
        Exception('Failed to load book request queue: $e'),
        stackTrace,
      );
    }
  }
}
