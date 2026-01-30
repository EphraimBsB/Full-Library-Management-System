import 'package:management_side/src/features/books/domain/models/book_copy.dart';

class BookCopyResponse {
  final bool success;
  final String message;
  final BookCopy? data;

  BookCopyResponse({
    required this.success,
    required this.message,
    this.data,
  });

  factory BookCopyResponse.fromJson(Map<String, dynamic> json) {
    return BookCopyResponse(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: json['data'] != null ? BookCopy.fromJson(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data': data?.toJson(),
    };
  }
}
