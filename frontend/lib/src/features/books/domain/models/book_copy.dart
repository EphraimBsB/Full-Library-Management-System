class BookCopy {
  final int? id;
  final int? bookId;
  final String accessNumber;
  final String status;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final bool? isActive;

  BookCopy({
    this.id,
    this.bookId,
    required this.accessNumber,
    required this.status,
    this.notes,
    this.createdAt,
    this.updatedAt,
    this.isActive,
  });

  factory BookCopy.fromJson(Map<String, dynamic> json) {
    try {
      // Check for required fields
      if (json['accessNumber'] == null) {
        throw ArgumentError('accessNumber is required but was null');
      }
      if (json['status'] == null) {
        json['status'] = 'AVAILABLE'; // Default status if not provided
      }

      // Set default timestamps if not provided
      final now = DateTime.now();
      DateTime parsedCreatedAt;
      DateTime parsedUpdatedAt;

      if (json['createdAt'] != null) {
        try {
          parsedCreatedAt = DateTime.parse(json['createdAt'].toString());
        } catch (e) {
          parsedCreatedAt = now;
        }
      } else {
        parsedCreatedAt = now;
      }

      if (json['updatedAt'] != null) {
        try {
          parsedUpdatedAt = DateTime.parse(json['updatedAt'].toString());
        } catch (e) {
          parsedUpdatedAt = now;
        }
      } else {
        parsedUpdatedAt = now;
      }

      return BookCopy(
        id: json['id'] as int?,
        bookId: json['bookId'] as int?,
        accessNumber: json['accessNumber'].toString(),
        status: json['status'] as String,
        notes: json['notes'] as String?,
        createdAt: parsedCreatedAt,
        updatedAt: parsedUpdatedAt,
        isActive: json['isActive'] as bool? ?? true,
      );
    } catch (e) {
      print('Error parsing BookCopy from JSON: $e');
      print('JSON data: $json');
      rethrow; // Re-throw to see the error in the UI
    }
  }

  Map<String, dynamic> toJson() {
    return {'accessNumber': accessNumber, 'status': status, 'notes': notes};
  }
}
