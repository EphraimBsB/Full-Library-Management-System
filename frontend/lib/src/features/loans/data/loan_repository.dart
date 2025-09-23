import 'package:management_side/src/features/loans/domain/models/loan_model.dart';

abstract class LoanRepository {
  // Get all loans
  Future<List<Loan>> getLoans({
    String? searchQuery,
    LoanStatus? status,
    String? userId,
    String? bookId,
    DateTime? startDate,
    DateTime? endDate,
  });

  // Get a single loan by ID
  Future<Loan> getLoan(String id);

  // Create a new loan
  Future<Loan> createLoan({
    required String bookId,
    required String userId,
    required DateTime borrowedDate,
    required DateTime dueDate,
    String? notes,
  });

  // Update an existing loan
  Future<Loan> updateLoan({
    required String id,
    DateTime? returnedDate,
    LoanStatus? status,
    double? fineAmount,
    String? notes,
  });

  // Delete a loan
  Future<void> deleteLoan(String id);

  // Get overdue loans
  Future<List<Loan>> getOverdueLoans();

  // Get loans by user
  Future<List<Loan>> getLoansByUser(String userId);

  // Get loans by book
  Future<List<Loan>> getLoansByBook(String bookId);

  // Check if a book is available for loan
  Future<bool> isBookAvailable(String bookId);
}
