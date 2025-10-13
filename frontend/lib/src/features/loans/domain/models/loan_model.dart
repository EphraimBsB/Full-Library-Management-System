import 'package:json_annotation/json_annotation.dart';

part 'loan_model.g.dart';

enum LoanStatus {
  @JsonValue('ACTIVE')
  active,
  @JsonValue('BORROWED')
  borrowed,
  @JsonValue('RETURNED')
  returned,
  @JsonValue('OVERDUE')
  overdue,
  @JsonValue('LOST')
  lost,
  @JsonValue('DAMAGED')
  damaged,
}

@JsonSerializable()
class Loan {
  final String id;
  final int bookCopyId;
  final String userId;
  final String? queueEntryId;
  final DateTime borrowedAt;
  final DateTime dueDate;
  final DateTime? lastRenewedAt;
  final DateTime? returnedAt;
  final double? fineAmount;
  final int renewalCount;
  final LoanStatus status;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  @JsonKey(name: 'bookCopy')
  final Map<String, dynamic>? bookCopy;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final Map<String, dynamic>? user;

  @JsonKey(name: 'returnedBy')
  final String? returnedById;

  @JsonKey(includeFromJson: false, includeToJson: false)
  final Map<String, dynamic>? request;

  @JsonKey(name: 'requestId')
  final String? requestId;

  const Loan({
    required this.id,
    required this.bookCopyId,
    required this.userId,
    this.queueEntryId,
    required this.borrowedAt,
    required this.dueDate,
    this.lastRenewedAt,
    this.returnedAt,
    this.fineAmount,
    this.renewalCount = 0,
    required this.status,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
    this.bookCopy,
    this.user,
    this.returnedById,
    this.request,
    this.requestId,
  });

  // Getter for book data (from bookCopy.book or direct book)
  Map<String, dynamic>? get bookData =>
      bookCopy?['book'] as Map<String, dynamic>?;

  // Getter for user data
  Map<String, dynamic>? get userData => user;

  // Getter for request data
  Map<String, dynamic>? get requestData => request;

  // Parse a double from dynamic value
  static double? parseDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  // Parse a date from dynamic value
  static DateTime? parseDate(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) return DateTime.tryParse(value);
    return null;
  }

  // Parse a string from dynamic value
  static String parseString(dynamic value, String fieldName) {
    if (value == null) {
      throw FormatException('$fieldName is required');
    }
    return value.toString();
  }

  // Parse a string or null from dynamic value
  static String? parseOptionalString(dynamic value) {
    if (value == null) return null;
    return value.toString();
  }

  // Parse an int from dynamic value
  static int parseInt(dynamic value, {int defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) return int.tryParse(value) ?? defaultValue;
    return defaultValue;
  }

  // Parse LoanStatus from string
  static LoanStatus parseStatus(dynamic value) {
    if (value == null) return LoanStatus.active;
    if (value is LoanStatus) return value;
    if (value is String) {
      return LoanStatus.values.firstWhere(
        (e) =>
            e.toString().split('.').last == value.toLowerCase() ||
            e.name == value.toUpperCase(),
        orElse: () => LoanStatus.active,
      );
    }
    return LoanStatus.active;
  }

  // Create Loan from JSON
  factory Loan.fromJson(Map<String, dynamic> json) {
    try {
      return Loan(
        id: parseString(json['id'], 'id'),
        bookCopyId: parseInt(json['bookCopyId'], defaultValue: 0),
        userId: parseString(json['userId'], 'userId'),
        queueEntryId: parseOptionalString(json['queueEntryId']),
        borrowedAt: parseDate(json['borrowedAt']) ?? DateTime.now(),
        dueDate:
            parseDate(json['dueDate']) ??
            (parseDate(json['borrowedAt']) ?? DateTime.now()).add(
              const Duration(days: 14),
            ),
        lastRenewedAt: parseDate(json['lastRenewedAt']),
        returnedAt: parseDate(json['returnedAt']),
        fineAmount: parseDouble(json['fineAmount']),
        renewalCount: parseInt(json['renewalCount']),
        status: parseStatus(json['status']),
        notes: parseOptionalString(json['notes']),
        createdAt: parseDate(json['createdAt']) ?? DateTime.now(),
        updatedAt: parseDate(json['updatedAt']) ?? DateTime.now(),
        bookCopy: json['bookCopy'] is Map
            ? Map<String, dynamic>.from(json['bookCopy'])
            : null,
        user: json['user'] is Map
            ? Map<String, dynamic>.from(json['user'])
            : null,
        returnedById: parseOptionalString(json['returnedBy']),
        request: json['request'] is Map
            ? Map<String, dynamic>.from(json['request'])
            : null,
        requestId: parseOptionalString(json['requestId']),
      );
    } catch (e) {
      throw FormatException('Error parsing Loan: $e');
    }
  }

  // Convert Loan to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'bookCopyId': bookCopyId,
      'userId': userId,
      if (queueEntryId != null) 'queueEntryId': queueEntryId,
      'borrowedAt': borrowedAt.toIso8601String(),
      'dueDate': dueDate.toIso8601String(),
      if (lastRenewedAt != null)
        'lastRenewedAt': lastRenewedAt!.toIso8601String(),
      if (returnedAt != null) 'returnedAt': returnedAt!.toIso8601String(),
      if (fineAmount != null) 'fineAmount': fineAmount,
      'renewalCount': renewalCount,
      'status': status.name,
      if (notes != null) 'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      if (bookCopy != null) 'bookCopy': bookCopy,
      if (user != null) 'user': user,
      if (returnedById != null) 'returnedBy': returnedById,
      if (request != null) 'request': request,
      if (requestId != null) 'requestId': requestId,
    };
  }

  // Copy with method for immutability
  Loan copyWith({
    String? id,
    int? bookCopyId,
    String? userId,
    String? queueEntryId,
    DateTime? borrowedAt,
    DateTime? dueDate,
    DateTime? lastRenewedAt,
    DateTime? returnedAt,
    double? fineAmount,
    int? renewalCount,
    LoanStatus? status,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
    Map<String, dynamic>? bookCopy,
    Map<String, dynamic>? user,
    String? returnedById,
    Map<String, dynamic>? request,
    String? requestId,
  }) {
    return Loan(
      id: id ?? this.id,
      bookCopyId: bookCopyId ?? this.bookCopyId,
      userId: userId ?? this.userId,
      queueEntryId: queueEntryId ?? this.queueEntryId,
      borrowedAt: borrowedAt ?? this.borrowedAt,
      dueDate: dueDate ?? this.dueDate,
      lastRenewedAt: lastRenewedAt ?? this.lastRenewedAt,
      returnedAt: returnedAt ?? this.returnedAt,
      fineAmount: fineAmount ?? this.fineAmount,
      renewalCount: renewalCount ?? this.renewalCount,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      bookCopy: bookCopy ?? this.bookCopy,
      user: user ?? this.user,
      returnedById: returnedById ?? this.returnedById,
      request: request ?? this.request,
      requestId: requestId ?? this.requestId,
    );
  }

  @override
  List<Object?> get props => [
    id,
    bookCopyId,
    userId,
    queueEntryId,
    borrowedAt,
    dueDate,
    lastRenewedAt,
    returnedAt,
    fineAmount,
    renewalCount,
    status,
    notes,
    createdAt,
    updatedAt,
    bookCopy,
    user,
    returnedById,
    request,
    requestId,
  ];
}
