// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'book_notes_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BookNote _$BookNoteFromJson(Map<String, dynamic> json) => BookNote(
  id: json['id'] as String,
  content: json['content'] as String,
  pageNumber: (json['pageNumber'] as num?)?.toInt(),
  isPublic: json['isPublic'] as bool,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  userId: json['userId'] as String,
  bookId: (json['bookId'] as num).toInt(),
  deletedAt: json['deletedAt'] == null
      ? null
      : DateTime.parse(json['deletedAt'] as String),
  book: BookModel.fromJson(json['book'] as Map<String, dynamic>),
);

Map<String, dynamic> _$BookNoteToJson(BookNote instance) => <String, dynamic>{
  'id': instance.id,
  'content': instance.content,
  'pageNumber': instance.pageNumber,
  'isPublic': instance.isPublic,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
  'userId': instance.userId,
  'bookId': instance.bookId,
  'deletedAt': instance.deletedAt?.toIso8601String(),
  'book': instance.book,
};
