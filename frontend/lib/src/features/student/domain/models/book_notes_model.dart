// lib/src/features/student/domain/models/book_note_model.dart
import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';

part 'book_notes_model.g.dart';

@JsonSerializable()
class BookNote {
  final String id;
  final String content;
  final int? pageNumber;
  final bool isPublic;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String userId;
  final int bookId;
  final DateTime? deletedAt;
  final BookModel book;

  const BookNote({
    required this.id,
    required this.content,
    this.pageNumber,
    required this.isPublic,
    required this.createdAt,
    required this.updatedAt,
    required this.userId,
    required this.bookId,
    this.deletedAt,
    required this.book,
  });

  factory BookNote.fromJson(Map<String, dynamic> json) =>
      _$BookNoteFromJson(json);
}
