import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';
import 'book_copy.dart';

part 'book_model_new.g.dart';

@JsonSerializable()
class BookModel {
  final int? id;
  final String title;
  final String author;
  final String? isbn;
  final String? publisher;
  final int? publicationYear;
  final String? edition;
  final int totalCopies;
  final int? availableCopies;
  final String? description;
  @JsonKey(name: 'coverImageUrl')
  final String? coverImageUrl;
  final List<Category> categories;
  final List<Subject> subjects;
  @JsonKey(name: 'type')
  final BookType? type; // Added type object
  @JsonKey(name: 'typeId')
  final int? typeId;
  @JsonKey(name: 'source')
  final Source? source; // Added source object
  @JsonKey(name: 'sourceId')
  final int? sourceId;
  final String? ddc;
  final String? price;
  @JsonKey(name: 'ebookUrl')
  final String? ebookUrl;
  final String? location;
  final String? shelf;
  @JsonKey(name: 'queueCount', defaultValue: 0)
  final int? queueCount;
  @JsonKey(
    name: 'rating',
    fromJson: _ratingFromJson,
    toJson: _ratingToJson,
    defaultValue: 0.0,
  )
  final double rating;
  @JsonKey(name: 'createdAt')
  final DateTime? createdAt;
  @JsonKey(name: 'updatedAt')
  final DateTime? updatedAt;
  @JsonKey(name: 'deletedAt')
  final DateTime? deletedAt;
  final List<BookCopy> copies;
  final Map<String, dynamic>? metadata;

  const BookModel({
    required this.id,
    required this.title,
    required this.author,
    this.isbn,
    this.publisher,
    this.publicationYear,
    this.edition,
    required this.totalCopies,
    this.availableCopies,
    this.description,
    this.coverImageUrl,
    required this.categories,
    required this.subjects,
    this.type,
    this.typeId,
    this.source,
    this.sourceId,
    this.ddc,
    this.price,
    this.ebookUrl,
    this.location,
    this.shelf,
    this.queueCount,
    this.rating = 0.0,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
    required this.copies,
    this.metadata,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) =>
      _$BookModelFromJson(json);

  Map<String, dynamic> toJson() => _$BookModelToJson(this);

  // Helper methods for rating conversion
  static double _ratingFromJson(dynamic rating) {
    if (rating == null) return 0.0;
    if (rating is double) return rating;
    if (rating is int) return rating.toDouble();
    if (rating is String) return double.tryParse(rating) ?? 0.0;
    return 0.0;
  }

  static String _ratingToJson(double rating) => rating.toStringAsFixed(2);

  // Add this method to your BookModel class
  Map<String, dynamic> toCreateJson() {
    return {
      'title': title,
      'author': author,
      if (isbn != null) 'isbn': isbn,
      if (publisher != null) 'publisher': publisher,
      if (publicationYear != null) 'publicationYear': publicationYear,
      if (edition != null) 'edition': edition,
      'totalCopies': totalCopies,
      if (description != null) 'description': description,
      if (coverImageUrl != null) 'coverImageUrl': coverImageUrl,
      'categories': categories.map((c) => {'name': c.name}).toList(),
      'subjects': subjects.map((s) => {'name': s.name}).toList(),
      if (typeId != null) 'typeId': typeId,
      if (sourceId != null) 'sourceId': sourceId,
      if (ddc != null) 'ddc': ddc,
      if (price != null) 'price': price,
      if (ebookUrl != null) 'ebookUrl': ebookUrl,
      if (location != null) 'location': location,
      if (shelf != null) 'shelf': shelf,
      'copies': copies
          .map(
            (copy) => {'accessNumber': copy.accessNumber, 'notes': copy.notes},
          )
          .toList(),
    };
  }

  // Copy with method for immutability
  BookModel copyWith({
    int? id,
    String? title,
    String? author,
    String? isbn,
    String? publisher,
    int? publicationYear,
    String? edition,
    int? totalCopies,
    int? availableCopies,
    String? description,
    String? coverImageUrl,
    List<Category>? categories,
    List<Subject>? subjects,
    BookType? type,
    int? typeId,
    Source? source,
    int? sourceId,
    String? ddc,
    String? price,
    String? ebookUrl,
    String? location,
    String? shelf,
    int? queueCount,
    double? rating,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? deletedAt,
    List<BookCopy>? copies,
    Map<String, dynamic>? metadata,
  }) {
    return BookModel(
      id: id ?? this.id,
      title: title ?? this.title,
      author: author ?? this.author,
      isbn: isbn ?? this.isbn,
      publisher: publisher ?? this.publisher,
      publicationYear: publicationYear ?? this.publicationYear,
      edition: edition ?? this.edition,
      totalCopies: totalCopies ?? this.totalCopies,
      availableCopies: availableCopies ?? this.availableCopies,
      description: description ?? this.description,
      coverImageUrl: coverImageUrl ?? this.coverImageUrl,
      categories: categories ?? this.categories,
      subjects: subjects ?? this.subjects,
      type: type ?? this.type,
      typeId: typeId ?? this.typeId,
      source: source ?? this.source,
      sourceId: sourceId ?? this.sourceId,
      ddc: ddc ?? this.ddc,
      price: price ?? this.price,
      ebookUrl: ebookUrl ?? this.ebookUrl,
      location: location ?? this.location,
      shelf: shelf ?? this.shelf,
      queueCount: queueCount ?? this.queueCount,
      rating: rating ?? this.rating,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? DateTime.now(),
      deletedAt: deletedAt ?? this.deletedAt,
      copies: copies ?? this.copies,
      metadata: metadata ?? this.metadata,
    );
  }
}
