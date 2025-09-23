import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/books/domain/models/borrowed_book.dart';
import 'package:management_side/src/features/books/domain/models/borrowing_stats.dart';

export 'package:management_side/src/features/books/domain/models/borrowing_stats.dart'
    show BorrowingStats;

/// Interface for book borrowing related operations
abstract class BorrowingRepository {
  /// Get current borrowing status for a specific book
  ///
  /// [bookId] The ID of the book to get borrowing status for
  /// [page] Page number for pagination (starts from 1)
  /// [limit] Number of items per page
  Future<Result<PaginatedResponse<BorrowedBook>>> getBookBorrowingStatus({
    required String bookId,
    int page = 1,
    int limit = 10,
  });

  /// Get borrowing history for a specific book
  ///
  /// [bookId] The ID of the book to get borrowing history for
  /// [page] Page number for pagination (starts from 1)
  /// [limit] Number of items per page
  Future<Result<PaginatedResponse<BorrowedBook>>> getBookBorrowingHistory({
    required String bookId,
    int page = 1,
    int limit = 10,
  });

  /// Get borrowing statistics for a specific book
  ///
  /// [bookId] The ID of the book to get statistics for
  Future<Result<BorrowingStats>> getBookBorrowingStats(String bookId);

  /// Get the request queue for a specific book
  ///
  /// [bookId] The ID of the book to get the request queue for
  Future<Result<List<BorrowedBook>>> getBookRequestQueue({
    required String bookId,
  });
}
