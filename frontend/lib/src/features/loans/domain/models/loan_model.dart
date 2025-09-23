import 'package:management_side/src/features/books/domain/models/book_model.dart';
import 'package:management_side/src/features/users/domain/models/user_model.dart';

class Loan {
  final String id;
  final Book book;
  final User user;
  final DateTime borrowedDate;
  final DateTime dueDate;
  final DateTime? returnedDate;
  final LoanStatus status;
  final double? fineAmount;
  final String? notes;
  final String accessNumber; // The specific copy of the book that was borrowed
  final DateTime createdAt;
  final DateTime updatedAt;

  const Loan({
    required this.id,
    required this.book,
    required this.user,
    required this.borrowedDate,
    required this.dueDate,
    this.returnedDate,
    required this.status,
    this.fineAmount,
    this.notes,
    required this.accessNumber,
    required this.createdAt,
    required this.updatedAt,
  });

  // Create a copyWith method for immutability
  Loan copyWith({
    String? id,
    Book? book,
    User? user,
    DateTime? borrowedDate,
    DateTime? dueDate,
    DateTime? returnedDate,
    LoanStatus? status,
    double? fineAmount,
    String? notes,
    String? accessNumber,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Loan(
      id: id ?? this.id,
      book: book ?? this.book,
      user: user ?? this.user,
      borrowedDate: borrowedDate ?? this.borrowedDate,
      dueDate: dueDate ?? this.dueDate,
      returnedDate: returnedDate ?? this.returnedDate,
      status: status ?? this.status,
      fineAmount: fineAmount ?? this.fineAmount,
      notes: notes ?? this.notes,
      accessNumber: accessNumber ?? this.accessNumber,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

enum LoanStatus {
  borrowed,
  returned,
  overdue,
  lost,
  damaged,
}

// Extension for LoanStatus to get display string
extension LoanStatusExtension on LoanStatus {
  String get displayName {
    switch (this) {
      case LoanStatus.borrowed:
        return 'Borrowed';
      case LoanStatus.returned:
        return 'Returned';
      case LoanStatus.overdue:
        return 'Overdue';
      case LoanStatus.lost:
        return 'Lost';
      case LoanStatus.damaged:
        return 'Damaged';
    }
  }
}
