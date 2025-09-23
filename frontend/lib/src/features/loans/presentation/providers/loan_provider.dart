import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/loans/data/loan_repository.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/data/loan_repository_provider.dart';

enum LoanSortOption {
  newestFirst,
  oldestFirst,
  dueDateAscending,
  dueDateDescending,
  borrowerName,
  bookTitle,
  status,
}

// Create a provider for LoanProvider
final loanProvider = ChangeNotifierProvider<LoanProvider>((ref) {
  final repository = ref.watch(loanRepositoryProvider);
  return LoanProvider(repository);
});

class LoanProvider with ChangeNotifier {
  final LoanRepository _loanRepository;
  
  List<Loan> _loans = [];
  bool _isLoading = false;
  String? _error;

  LoanProvider(this._loanRepository);

  // Getters
  List<Loan> get loans => List.unmodifiable(_sortedLoans);
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Sorting state
  LoanSortOption _currentSortOption = LoanSortOption.newestFirst;
  LoanSortOption get currentSortOption => _currentSortOption;
  
  // Sorted loans list
  List<Loan> get _sortedLoans {
    final list = List<Loan>.from(_loans);
    list.sort((a, b) {
      switch (_currentSortOption) {
        case LoanSortOption.newestFirst:
          return b.borrowedDate.compareTo(a.borrowedDate);
        case LoanSortOption.oldestFirst:
          return a.borrowedDate.compareTo(b.borrowedDate);
        case LoanSortOption.dueDateAscending:
          return a.dueDate.compareTo(b.dueDate);
        case LoanSortOption.dueDateDescending:
          return b.dueDate.compareTo(a.dueDate);
        case LoanSortOption.borrowerName:
          return '${a.user.firstName} ${a.user.lastName}'
              .toLowerCase()
              .compareTo('${b.user.firstName} ${b.user.lastName}'.toLowerCase());
        case LoanSortOption.bookTitle:
          return a.book.title.toLowerCase().compareTo(b.book.title.toLowerCase());
        case LoanSortOption.status:
          return a.status.toString().compareTo(b.status.toString());
      }
    });
    return list;
  }

  // Sort loans by the current sort option
  void sortLoans(LoanSortOption option) {
    _currentSortOption = option;
    notifyListeners();
  }
  
  // Reset sorting to default
  void resetSorting() {
    _currentSortOption = LoanSortOption.newestFirst;
    notifyListeners();
  }
  
  // Load all loans with optional filters and sorting
  Future<void> loadLoans({
    String? searchQuery,
    LoanStatus? status,
    String? userId,
    String? bookId,
    bool forceRefresh = false,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _loans = await _loanRepository.getLoans(
        searchQuery: searchQuery,
        status: status,
        userId: userId,
        bookId: bookId,
      );
    } catch (e) {
      _error = 'Failed to load loans: $e';
      if (kDebugMode) {
        print('Error loading loans: $e');
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create a new loan
  Future<bool> createLoan({
    required String bookId,
    required String userId,
    required DateTime borrowedDate,
    required DateTime dueDate,
    String? notes,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final newLoan = await _loanRepository.createLoan(
        bookId: bookId,
        userId: userId,
        borrowedDate: borrowedDate,
        dueDate: dueDate,
        notes: notes,
      );
      
      _loans.add(newLoan);
      return true;
    } catch (e) {
      _error = 'Failed to create loan: $e';
      if (kDebugMode) {
        print('Error creating loan: $e');
      }
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Update a loan
  Future<bool> updateLoan({
    required String id,
    DateTime? returnedDate,
    LoanStatus? status,
    double? fineAmount,
    String? notes,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedLoan = await _loanRepository.updateLoan(
        id: id,
        returnedDate: returnedDate,
        status: status,
        fineAmount: fineAmount,
        notes: notes,
      );
      
      final index = _loans.indexWhere((loan) => loan.id == id);
      if (index != -1) {
        _loans[index] = updatedLoan;
      }
      return true;
    } catch (e) {
      _error = 'Failed to update loan: $e';
      if (kDebugMode) {
        print('Error updating loan: $e');
      }
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Delete a loan
  Future<bool> deleteLoan(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _loanRepository.deleteLoan(id);
      _loans.removeWhere((loan) => loan.id == id);
      return true;
    } catch (e) {
      _error = 'Failed to delete loan: $e';
      if (kDebugMode) {
        print('Error deleting loan: $e');
      }
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get overdue loans
  Future<List<Loan>> getOverdueLoans() async {
    try {
      return await _loanRepository.getOverdueLoans();
    } catch (e) {
      _error = 'Failed to load overdue loans: $e';
      if (kDebugMode) {
        print('Error loading overdue loans: $e');
      }
      return [];
    }
  }

  // Get loans by user
  Future<List<Loan>> getLoansByUser(String userId) async {
    try {
      return await _loanRepository.getLoansByUser(userId);
    } catch (e) {
      _error = 'Failed to load user loans: $e';
      if (kDebugMode) {
        print('Error loading user loans: $e');
      }
      return [];
    }
  }

  // Check if a book is available for loan
  Future<bool> isBookAvailable(String bookId) async {
    try {
      return await _loanRepository.isBookAvailable(bookId);
    } catch (e) {
      if (kDebugMode) {
        print('Error checking book availability: $e');
      }
      return false;
    }
  }
}
