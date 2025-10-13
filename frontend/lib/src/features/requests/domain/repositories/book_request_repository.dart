import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/requests/domain/models/book_request_model.dart';

abstract class BookRequestRepository {
  /// Creates a new book request
  /// Returns [BookRequest] if successful, or [Failure] if an error occurs
  Future<Either<Failure, BookRequest>> createBookRequest({
    required String bookId,
    String? reason,
  });

  /// Fetches all pending book requests
  /// Returns [List<BookRequest>] if successful, or [Failure] if an error occurs
  Future<Either<Failure, List<BookRequest>>> getPendingBookRequests();

  /// Approves a book request
  /// [requestId] The ID of the request to approve
  /// [preferredCopyId] The ID of the preferred book copy
  /// Returns a map containing the loan details if successful, or [Failure] if an error occurs
  Future<Either<Failure, Map<String, dynamic>>> approveBookRequest({
    required String requestId,
    required String preferredCopyId,
    String? notes,
  });

  /// Rejects a book request
  /// [requestId] The ID of the request to reject
  /// [notes] Optional notes for rejection
  /// Returns void if successful, or [Failure] if an error occurs
  Future<Either<Failure, void>> rejectBookRequest({
    required String requestId,
    required String notes,
  });
}
