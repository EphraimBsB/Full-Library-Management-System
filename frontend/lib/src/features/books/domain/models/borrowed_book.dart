import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';

part 'borrowed_book.g.dart';

// JSON conversion helpers
DateTime? _dateTimeFromJson(dynamic dateValue) {
  if (dateValue == null) return null;
  if (dateValue is String) {
    return DateTime.tryParse(dateValue)?.toLocal();
  } else if (dateValue is int) {
    return DateTime.fromMillisecondsSinceEpoch(dateValue).toLocal();
  }
  return null;
}

String? _dateTimeToJson(DateTime? date) {
  return date?.toUtc().toIso8601String();
}

// Convert dynamic ID to string
String? _idFromJson(dynamic id) {
  if (id == null) return null;
  if (id is String) return id;
  if (id is int) return id.toString();
  return null;
}

// Convert dynamic value to double
double? _doubleFromJson(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

// Convert dynamic value to bool
bool _boolFromJson(dynamic value) {
  if (value == null) return false;
  if (value is bool) return value;
  if (value is String) return value.toLowerCase() == 'true';
  if (value is int) return value != 0;
  return false;
}

/// Status of a borrowed book
enum BorrowedBookStatus {
  @JsonValue('requested')
  requested,
  @JsonValue('pending')
  pending,
  @JsonValue('borrowed')
  borrowed,
  @JsonValue('returned')
  returned,
  @JsonValue('overdue')
  overdue,
  @JsonValue('rejected')
  rejected,
}

/// Model representing a borrowed book
@JsonSerializable()
class BorrowedBook {
  @JsonKey(name: 'id', fromJson: _idFromJson)
  final String? id;
  
  @JsonKey(name: 'user')
  final UserModel? user;
  
  @JsonKey(name: 'userId', fromJson: _idFromJson)
  final String? userId;
  
  @JsonKey(name: 'book')
  final BookModel? book;
  
  @JsonKey(name: 'bookId', fromJson: _idFromJson)
  final String? bookId;
  
  @JsonKey(name: 'accessNumber')
  final dynamic accessNumber; // Can be String or Map
  
  @JsonKey(name: 'accessNumberId', fromJson: _idFromJson)
  final String? accessNumberId;
  
  @JsonKey(name: 'borrowedAt', fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
  final DateTime? borrowedAt;
  
  @JsonKey(name: 'dueDate', fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
  final DateTime? dueDate;
  
  @JsonKey(name: 'returnedAt', fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
  final DateTime? returnedAt;
  
  @JsonKey(name: 'fineAmount', fromJson: _doubleFromJson)
  final double? fineAmount;
  
  @JsonKey(name: 'isReturned', fromJson: _boolFromJson)
  final bool isReturned;
  
  @JsonKey(name: 'status')
  final BorrowedBookStatus status;
  
  @JsonKey(name: 'createdAt', fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
  final DateTime? createdAt;
  
  @JsonKey(name: 'updatedAt', fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
  final DateTime? updatedAt;

  const BorrowedBook({
    this.id,
    this.user,
    this.userId,
    this.bookId,
    this.book,
    this.accessNumber,
    this.accessNumberId,
    this.borrowedAt,
    this.dueDate,
    this.returnedAt,
    this.fineAmount,
    this.isReturned = false,
    this.status = BorrowedBookStatus.borrowed,
    this.createdAt,
    this.updatedAt,
  });

  factory BorrowedBook.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const BorrowedBook();
    }
    return _$BorrowedBookFromJson(json);
  }

  Map<String, dynamic> toJson() => _$BorrowedBookToJson(this);

  /// Creates a copy of this borrowed book with the given fields replaced by the non-null parameter values.
  BorrowedBook copyWith({
    String? id,
    UserModel? user,
    String? userId,
    String? bookId,
    BookModel? book,
    String? accessNumber,
    DateTime? borrowedAt,
    DateTime? dueDate,
    DateTime? returnedAt,
    double? fineAmount,
    BorrowedBookStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return BorrowedBook(
      id: id ?? this.id,
      user: user ?? this.user,
      userId: userId ?? this.userId,
      bookId: bookId ?? this.bookId,
      book: book ?? this.book,
      accessNumber: accessNumber ?? this.accessNumber,
      borrowedAt: borrowedAt ?? this.borrowedAt,
      dueDate: dueDate ?? this.dueDate,
      returnedAt: returnedAt ?? this.returnedAt,
      fineAmount: fineAmount ?? this.fineAmount,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Returns true if the book is overdue
  bool get isOverdue =>
      status == BorrowedBookStatus.borrowed &&
      dueDate != null &&
      dueDate!.isBefore(DateTime.now());

  /// Returns the number of days remaining until the due date
  /// Returns negative if overdue
  int get daysRemaining {
    if (dueDate == null) return 0;
    final now = DateTime.now();
    return dueDate!.difference(now).inDays;
  }
}
