// lib/src/features/student/domain/models/book_note_model.dart
import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';

part 'book_notes_model.g.dart';

@JsonSerializable()
class BookNote {
  final String? id;
  final String content;
  final int? pageNumber;
  final bool? isPublic;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? userId;
  final int? bookId;
  final DateTime? deletedAt;
  final BookModel? book;
  final User? user;

  const BookNote({
    this.id,
    required this.content,
    this.pageNumber,
    this.isPublic,
    this.createdAt,
    this.updatedAt,
    this.userId,
    this.bookId,
    this.deletedAt,
    this.book,
    this.user,
  });

  factory BookNote.fromJson(Map<String, dynamic> json) =>
      _$BookNoteFromJson(json);

  //toJson
  Map<String, dynamic> toJson() => <String, dynamic>{
    'content': content,
    'pageNumber': pageNumber,
    'isPublic': isPublic,
    'bookId': bookId,
  };
}
