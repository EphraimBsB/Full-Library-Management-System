import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';
import 'package:management_side/src/features/requests/domain/models/book_request_model.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';

part 'dashboard_summary_model.g.dart';

@JsonSerializable()
class DashboardSummary {
  final DashboardStats stats;
  final List<BookModel> recentBooks;
  final List<BookModel> topRatedBooks;
  final List<BookModel> mostBorrowedBooks;
  final List<BookRequest> pendingRequests;
  final List<Loan> recentOverdues;
  final List<User> activeUsers;

  DashboardSummary({
    required this.stats,
    required this.recentBooks,
    required this.topRatedBooks,
    required this.mostBorrowedBooks,
    required this.pendingRequests,
    required this.recentOverdues,
    required this.activeUsers,
  });

  // Reusing existing models:
  // - BookModel from books/domain/models/book_model_new.dart
  // - User from auth/domain/models/user_model.dart
  // - BookRequest from requests/domain/models/book_request_model.dart
  // - Loan from loans/domain/models/loan_model.dart

  factory DashboardSummary.fromJson(Map<String, dynamic> json) =>
      _$DashboardSummaryFromJson(json);

  Map<String, dynamic> toJson() => _$DashboardSummaryToJson(this);
}

@JsonSerializable()
class DashboardStats {
  @JsonKey(name: 'books')
  final int totalBooks;

  @JsonKey(name: 'users')
  final int totalUsers;

  @JsonKey(name: 'loans')
  final int activeLoans;

  @JsonKey(name: 'overdue')
  final int overdueLoans;

  DashboardStats({
    required this.totalBooks,
    required this.totalUsers,
    required this.activeLoans,
    required this.overdueLoans,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) =>
      _$DashboardStatsFromJson(json);

  Map<String, dynamic> toJson() => _$DashboardStatsToJson(this);
}
