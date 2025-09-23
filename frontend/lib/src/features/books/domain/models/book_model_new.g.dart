// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'book_model_new.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Category _$CategoryFromJson(Map<String, dynamic> json) =>
    Category(id: (json['id'] as num).toInt(), name: json['name'] as String);

Map<String, dynamic> _$CategoryToJson(Category instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
};

Subject _$SubjectFromJson(Map<String, dynamic> json) =>
    Subject(id: (json['id'] as num).toInt(), name: json['name'] as String);

Map<String, dynamic> _$SubjectToJson(Subject instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
};

AccessNumber _$AccessNumberFromJson(Map<String, dynamic> json) => AccessNumber(
  id: (json['id'] as num).toInt(),
  number: json['number'] as String,
);

Map<String, dynamic> _$AccessNumberToJson(AccessNumber instance) =>
    <String, dynamic>{'id': instance.id, 'number': instance.number};

BookModel _$BookModelFromJson(Map<String, dynamic> json) => BookModel(
  id: (json['id'] as num).toInt(),
  title: json['title'] as String,
  author: json['author'] as String,
  isbn: json['isbn'] as String,
  publisher: json['publisher'] as String?,
  publicationYear: (json['publicationYear'] as num).toInt(),
  edition: json['edition'] as String?,
  totalCopies: (json['totalCopies'] as num).toInt(),
  availableCopies: (json['availableCopies'] as num).toInt(),
  description: json['description'] as String?,
  coverImageUrl: json['coverImageUrl'] as String?,
  categories:
      (json['categories'] as List<dynamic>?)
          ?.map((e) => Category.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  subjects:
      (json['subjects'] as List<dynamic>?)
          ?.map((e) => Subject.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  type: json['type'] as String,
  ebookUrl: json['ebookUrl'] as String?,
  accessNumbers:
      (json['accessNumbers'] as List<dynamic>?)
          ?.map((e) => AccessNumber.fromJson(e as Map<String, dynamic>))
          .toList() ??
      const [],
  rating: json['rating'] == null
      ? 0.0
      : BookModel._ratingFromJson(json['rating'] as String),
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$BookModelToJson(BookModel instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'author': instance.author,
  'isbn': instance.isbn,
  'publisher': ?instance.publisher,
  'publicationYear': instance.publicationYear,
  'edition': ?instance.edition,
  'totalCopies': instance.totalCopies,
  'availableCopies': instance.availableCopies,
  'description': ?instance.description,
  'coverImageUrl': ?instance.coverImageUrl,
  'categories': instance.categories,
  'subjects': instance.subjects,
  'type': instance.type,
  'ebookUrl': ?instance.ebookUrl,
  'accessNumbers': instance.accessNumbers,
  'rating': BookModel._ratingToJson(instance.rating),
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
};
