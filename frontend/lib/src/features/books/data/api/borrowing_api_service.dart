import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/core/data/base_repository.dart'
    show PaginatedResponse;
import 'package:management_side/src/features/books/domain/models/borrowed_book.dart';
import 'package:management_side/src/features/books/domain/models/borrowing_stats.dart';

part 'borrowing_api_service.g.dart';

/// API service for book borrowing related operations
@RestApi(baseUrl: '/api/books/borrow')
abstract class BorrowingApiService {
  factory BorrowingApiService(Dio dio, {String? baseUrl}) {
    return _BorrowingApiService(dio, baseUrl: baseUrl);
  }

  /// Get current borrowing status for a specific book
  @GET('/book/{bookId}/status')
  Future<PaginatedResponse<BorrowedBook>> getBookBorrowingStatus(
    @Path('bookId') String bookId,
    @Query('page') int page,
    @Query('limit') int limit,
  );

  /// Get borrowing history for a specific book
  @GET('/book/{bookId}/history')
  Future<PaginatedResponse<BorrowedBook>> getBookBorrowingHistory(
    @Path('bookId') String bookId,
    @Query('page') int page,
    @Query('limit') int limit,
  );

  /// Get borrowing statistics for a specific book
  @GET('/book/{bookId}/stats')
  Future<BorrowingStats> getBookBorrowingStats(@Path('bookId') String bookId);
}
