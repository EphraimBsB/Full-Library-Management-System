import 'package:json_annotation/json_annotation.dart';

part 'borrowing_stats.g.dart';

/// Model representing borrowing statistics for a user
@JsonSerializable()
class BorrowingStats {
  /// Total number of books borrowed by the user
  @JsonKey(name: 'totalBorrowed')
  final int totalBorrowed;

  /// Total number of books returned by the user
  @JsonKey(name: 'totalReturned')
  final int totalReturned;

  /// Number of books currently borrowed
  @JsonKey(name: 'currentlyBorrowed')
  final int currentlyBorrowed;

  /// Number of overdue books
  @JsonKey(name: 'totalOverdue')
  final int totalOverdue;

  /// Total fine amount (if any)
  @JsonKey(name: 'totalFines')
  final double totalFines;

  /// Creates a new [BorrowingStats] instance
  const BorrowingStats({
    required this.totalBorrowed,
    required this.totalReturned,
    required this.currentlyBorrowed,
    required this.totalOverdue,
    this.totalFines = 0.0,
  });

  /// Creates a [BorrowingStats] from JSON data
  factory BorrowingStats.fromJson(Map<String, dynamic> json) =>
      _$BorrowingStatsFromJson(json);

  /// Converts this [BorrowingStats] to JSON
  Map<String, dynamic> toJson() => _$BorrowingStatsToJson(this);

  /// Creates a copy of this [BorrowingStats] with the given fields replaced
  BorrowingStats copyWith({
    int? totalBorrowed,
    int? totalReturned,
    int? currentlyBorrowed,
    int? totalOverdue,
    double? totalFines,
  }) {
    return BorrowingStats(
      totalBorrowed: totalBorrowed ?? this.totalBorrowed,
      totalReturned: totalReturned ?? this.totalReturned,
      currentlyBorrowed: currentlyBorrowed ?? this.currentlyBorrowed,
      totalOverdue: totalOverdue ?? this.totalOverdue,
      totalFines: totalFines ?? this.totalFines,
    );
  }
}
