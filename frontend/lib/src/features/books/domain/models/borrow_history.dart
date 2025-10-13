import 'package:management_side/src/features/books/domain/models/borrower.dart';

class BorrowHistory {
  final int copyId;
  final String copyAccessNumber;
  final Borrower borrower;
  final DateTime borrowedAt;
  final DateTime returnedAt;

  BorrowHistory({
    required this.copyId,
    required this.copyAccessNumber,
    required this.borrower,
    required this.borrowedAt,
    required this.returnedAt,
  });

  factory BorrowHistory.fromJson(Map<String, dynamic> json) {
    return BorrowHistory(
      copyId: json['copy_id'],
      copyAccessNumber: json['copy_access_number'],
      borrower: Borrower.fromJson(json['borrower']),
      borrowedAt: DateTime.parse(json['borrowed_at']),
      returnedAt: DateTime.parse(json['returned_at']),
    );
  }
}
