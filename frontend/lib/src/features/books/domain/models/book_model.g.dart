// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'book_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Book _$BookFromJson(Map<String, dynamic> json) => Book(
  id: json['_id'] as String,
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
          ?.map((e) => e as String)
          .toList() ??
      const [],
  subjects:
      (json['subjects'] as List<dynamic>?)?.map((e) => e as String).toList() ??
      const [],
  type: Book._bookTypeFromJson(json['type'] as String?),
  source: Book._bookSourceFromJson(json['source'] as String?),
  ddc: json['ddc'] as String?,
  from: json['from'] as String?,
  ebookUrl: json['ebookUrl'] as String?,
  location: json['location'] as String?,
  shelf: json['shelf'] as String?,
  accessNumbers:
      (json['accessNumbers'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList() ??
      const [],
  rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
  createdAt: DateTime.parse(json['created_at'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$BookToJson(Book instance) => <String, dynamic>{
  '_id': instance.id,
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
  'source': instance.source,
  'ddc': ?instance.ddc,
  'from': ?instance.from,
  'ebookUrl': ?instance.ebookUrl,
  'location': ?instance.location,
  'shelf': ?instance.shelf,
  'accessNumbers': instance.accessNumbers,
  'rating': instance.rating,
  'created_at': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
};
