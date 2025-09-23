import 'package:management_side/src/features/loans/data/loan_repository.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/data/mock_data.dart';

class LoanRepositoryImpl implements LoanRepository {
  @override
  @override
  Future<List<Loan>> getLoans({
    String? searchQuery,
    LoanStatus? status,
    String? userId,
    String? bookId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Start with all mock loans
    var loans = List<Loan>.from(mockLoans);
    
    // Apply filters
    if (status != null) {
      loans = loans.where((loan) => loan.status == status).toList();
    }
    
    if (userId != null) {
      loans = loans.where((loan) => loan.user.id == userId).toList();
    }
    
    if (bookId != null) {
      loans = loans.where((loan) => loan.book.id == bookId).toList();
    }
    
    if (searchQuery != null && searchQuery.isNotEmpty) {
      final query = searchQuery.toLowerCase();
      loans = loans.where((loan) => 
        '${loan.user.firstName} ${loan.user.lastName}'.toLowerCase().contains(query) ||
        loan.book.title.toLowerCase().contains(query) ||
        loan.id == searchQuery
      ).toList();
    }
    
    if (startDate != null) {
      loans = loans.where((loan) => 
        loan.borrowedDate.isAfter(startDate) || 
        loan.borrowedDate.isAtSameMomentAs(startDate)
      ).toList();
    }
    
    if (endDate != null) {
      loans = loans.where((loan) => 
        loan.dueDate.isBefore(endDate) || 
        loan.dueDate.isAtSameMomentAs(endDate)
      ).toList();
    }
    
    return loans;
  }

  @override
  Future<Loan> getLoan(String id) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return mockLoans.firstWhere((loan) => loan.id == id,
      orElse: () => throw Exception('Loan not found')
    );
  }

  @override
  Future<Loan> createLoan({
    required String bookId,
    required String userId,
    required DateTime borrowedDate,
    required DateTime dueDate,
    String? notes,
  }) async {
    // TODO: Implement actual creation logic here
    throw UnimplementedError('createLoan() has not been implemented');
  }

  @override
  Future<Loan> updateLoan({
    required String id,
    DateTime? returnedDate,
    LoanStatus? status,
    double? fineAmount,
    String? notes,
  }) async {
    // TODO: Implement actual update logic here
    throw UnimplementedError('updateLoan() has not been implemented');
  }

  @override
  Future<void> deleteLoan(String id) async {
    // TODO: Implement actual deletion logic here
    throw UnimplementedError('deleteLoan() has not been implemented');
  }

  @override
  Future<List<Loan>> getOverdueLoans() async {
    await Future.delayed(const Duration(milliseconds: 300));
    final now = DateTime.now();
    return mockLoans.where((loan) => 
      loan.dueDate.isBefore(now) && 
      loan.status != LoanStatus.returned
    ).toList();
  }

  @override
  Future<List<Loan>> getLoansByUser(String userId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return mockLoans.where((loan) => loan.user.id == userId).toList();
  }

  @override
  Future<List<Loan>> getLoansByBook(String bookId) async {
    await Future.delayed(const Duration(milliseconds: 300));
    return mockLoans.where((loan) => loan.book.id == bookId).toList();
  }

  @override
  Future<bool> isBookAvailable(String bookId) async {
    await Future.delayed(const Duration(milliseconds: 200));
    // A book is available if it's not currently borrowed or overdue
    final activeLoans = await getLoans(bookId: bookId);
    return !activeLoans.any((loan) => 
      loan.status == LoanStatus.borrowed || 
      loan.status == LoanStatus.overdue
    );
  }
}
