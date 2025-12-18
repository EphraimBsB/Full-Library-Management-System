import 'package:management_side/src/features/books/domain/models/borrower.dart';

class CurrentBorrow {
  final int copyId;
  final String copyAccessNumber;
  final Borrower borrower;
  final DateTime borrowedAt;
  final DateTime dueDate;
  final bool isOverdue;

  CurrentBorrow({
    required this.copyId,
    required this.copyAccessNumber,
    required this.borrower,
    required this.borrowedAt,
    required this.dueDate,
    required this.isOverdue,
  });

  factory CurrentBorrow.fromJson(Map<String, dynamic> json) {
    return CurrentBorrow(
      copyId: json['copy_id'],
      copyAccessNumber: json['copy_access_number'],
      borrower: Borrower.fromJson(json['borrower']),
      borrowedAt: DateTime.parse(json['borrowed_at']),
      dueDate: DateTime.parse(json['due_date']),
      isOverdue: json['is_overdue'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'copy_id': copyId,
      'copy_access_number': copyAccessNumber,
      'borrower': borrower.toJson(),
      'borrowed_at': borrowedAt.toIso8601String(),
      'due_date': dueDate.toIso8601String(),
      'is_overdue': isOverdue,
    };
  }
}
