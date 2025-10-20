import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';

/// Interface for loan data operations
abstract class LoanRepository {
  /// Get all loans with optional filters
  Future<Either<Failure, List<Loan>>> getLoans({
    String? status,
    String? userId,
    String? bookId,
    bool? overdueOnly,
    int? page,
    int? limit,
  });

  /// Get a single loan by ID
  Future<Either<Failure, Loan>> getLoanById(String id);

  /// Create a new loan
  Future<Either<Failure, Loan>> createLoan(Loan loan);

  /// Update an existing loan
  Future<Either<Failure, Loan>> updateLoan(
    String id,
    Map<String, dynamic> updates,
  );

  /// Delete a loan
  Future<Either<Failure, Unit>> deleteLoan(String id);

  /// Return a borrowed book
  Future<Either<Failure, Loan>> returnBook(String id);

  /// Renew a loan
  Future<Either<Failure, Loan>> renewLoan(String id);

  /// Get overdue loans
  Future<Either<Failure, List<Loan>>> getOverdueLoans({int? page, int? limit});

  /// Get loans for a specific user
  Future<Either<Failure, List<Loan>>> getUserLoans(
    String userId, {
    String? status,
    int? page,
    int? limit,
  });
}
