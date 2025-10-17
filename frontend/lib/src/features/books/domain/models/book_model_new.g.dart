// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'book_model_new.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BookModel _$BookModelFromJson(Map<String, dynamic> json) => BookModel(
  id: (json['id'] as num?)?.toInt(),
  title: json['title'] as String,
  author: json['author'] as String,
  isbn: json['isbn'] as String?,
  publisher: json['publisher'] as String?,
  publicationYear: (json['publicationYear'] as num?)?.toInt(),
  edition: json['edition'] as String?,
  totalCopies: (json['totalCopies'] as num).toInt(),
  availableCopies: (json['availableCopies'] as num?)?.toInt(),
  description: json['description'] as String?,
  coverImageUrl: json['coverImageUrl'] as String?,
  categories: (json['categories'] as List<dynamic>?)
      ?.map((e) => Category.fromJson(e as Map<String, dynamic>))
      .toList(),
  subjects: (json['subjects'] as List<dynamic>?)
      ?.map((e) => Subject.fromJson(e as Map<String, dynamic>))
      .toList(),
  type: json['type'] == null
      ? null
      : BookType.fromJson(json['type'] as Map<String, dynamic>),
  typeId: (json['typeId'] as num?)?.toInt(),
  source: json['source'] == null
      ? null
      : Source.fromJson(json['source'] as Map<String, dynamic>),
  sourceId: (json['sourceId'] as num?)?.toInt(),
  ddc: json['ddc'] as String?,
  price: json['price'] as String?,
  ebookUrl: json['ebookUrl'] as String?,
  location: json['location'] as String?,
  shelf: json['shelf'] as String?,
  queueCount: (json['queueCount'] as num?)?.toInt() ?? 0,
  rating: json['rating'] == null
      ? 0.0
      : BookModel._ratingFromJson(json['rating']),
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
  deletedAt: json['deletedAt'] == null
      ? null
      : DateTime.parse(json['deletedAt'] as String),
  copies: (json['copies'] as List<dynamic>?)
      ?.map((e) => BookCopy.fromJson(e as Map<String, dynamic>))
      .toList(),
  metadata: json['metadata'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$BookModelToJson(BookModel instance) => <String, dynamic>{
  'id': instance.id,
  'title': instance.title,
  'author': instance.author,
  'isbn': instance.isbn,
  'publisher': instance.publisher,
  'publicationYear': instance.publicationYear,
  'edition': instance.edition,
  'totalCopies': instance.totalCopies,
  'availableCopies': instance.availableCopies,
  'description': instance.description,
  'coverImageUrl': instance.coverImageUrl,
  'categories': instance.categories,
  'subjects': instance.subjects,
  'type': instance.type,
  'typeId': instance.typeId,
  'source': instance.source,
  'sourceId': instance.sourceId,
  'ddc': instance.ddc,
  'price': instance.price,
  'ebookUrl': instance.ebookUrl,
  'location': instance.location,
  'shelf': instance.shelf,
  'queueCount': instance.queueCount,
  'rating': BookModel._ratingToJson(instance.rating),
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
  'deletedAt': instance.deletedAt?.toIso8601String(),
  'copies': instance.copies,
  'metadata': instance.metadata,
};
