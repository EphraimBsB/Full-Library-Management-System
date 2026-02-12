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

  /// Fetches all renewal requests
  /// [status] Optional status filter
  /// Returns [List<BookRequest>] if successful, or [Failure] if an error occurs
  Future<Either<Failure, List<BookRequest>>> getRenewalRequests({
    String? status,
  });

  /// Approves a book request
  /// [requestId] The ID of the request to approve
  /// [preferredCopyId] The ID of the preferred book copy
  /// [notes] Optional notes for approval
  /// Returns a map containing the loan details if successful, or [Failure] if an error occurs
  Future<Either<Failure, Map<String, dynamic>>> approveBookRequest({
    required String requestId,
    String? preferredCopyId,
    String? notes,
  });

  /// Approves a renewal request
  /// [requestId] The ID of renewal request to approve
  /// [notes] Optional notes for approval
  /// Returns a map containing updated loan details if successful, or [Failure] if an error occurs
  Future<Either<Failure, Map<String, dynamic>>> approveRenewalRequest({
    required String requestId,
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

  /// Rejects a renewal request
  /// [requestId] The ID of renewal request to reject
  /// [notes] Optional notes for rejection
  /// Returns void if successful, or [Failure] if an error occurs
  Future<Either<Failure, void>> rejectRenewalRequest({
    required String requestId,
    required String notes,
  });
}
