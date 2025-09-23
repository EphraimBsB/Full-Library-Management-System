import 'package:json_annotation/json_annotation.dart';

import 'book_enums.dart';

part 'book_model.g.dart';

/// A type definition for JSON maps used in serialization/deserialization
typedef JsonMap = Map<String, dynamic>;

@JsonSerializable(includeIfNull: false)
class Book {
  /// Creates a new [Book] instance from a JSON map
  factory Book.fromJson(JsonMap json) => _$BookFromJson(json);

  /// Creates a new [Book] instance with the given values
  const Book({
    required this.id,
    required this.title,
    required this.author,
    required this.isbn,
    this.publisher,
    required this.publicationYear,
    this.edition,
    required this.totalCopies,
    required this.availableCopies,
    this.description,
    this.coverImageUrl,
    this.categories = const [],
    this.subjects = const [],
    required this.type,
    required this.source,
    this.ddc,
    this.from,
    this.ebookUrl,
    this.location,
    this.shelf,
    this.accessNumbers = const [],
    this.rating = 0.0,
    required this.createdAt,
    required this.updatedAt,
  });
  @JsonKey(name: '_id')
  final String id;
  final String title;
  final String author;
  final String isbn;
  @JsonKey(includeIfNull: false)
  final String? publisher;
  final int publicationYear;
  final String? edition;
  final int totalCopies;
  final int availableCopies;
  final String? description;
  final String? coverImageUrl;
  final List<String> categories;
  final List<String> subjects;
  @JsonKey(fromJson: _bookTypeFromJson)
  final BookType type;
  @JsonKey(fromJson: _bookSourceFromJson)
  final BookSource source;
  // ...existing code...

  // Custom converters for enum mapping
  static BookType _bookTypeFromJson(String? value) =>
      BookType.values.firstWhere(
        (e) => e.name.toLowerCase() == (value?.toLowerCase() ?? ''),
        orElse: () => BookType.physical,
      );

  static BookSource _bookSourceFromJson(String? value) =>
      BookSource.values.firstWhere(
        (e) => e.name.toLowerCase() == (value?.toLowerCase() ?? ''),
        orElse: () => BookSource.purchased,
      );
  final String? ddc;
  final String? from;
  final String? ebookUrl;
  final String? location;
  final String? shelf;
  final List<String>
  accessNumbers; // Access numbers for each copy (e.g., ["001", "002", "003"])
  final double rating; // Rating from 0 to 5
  @JsonKey(name: 'created_at')
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Creates a copy of this book with the given fields replaced by the new values
  Book copyWith({
    String? id,
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
    List<String>? categories,
    List<String>? subjects,
    BookType? type,
    BookSource? source,
    String? ddc,
    String? from,
    String? ebookUrl,
    String? location,
    String? shelf,
    List<String>? accessNumbers,
    double? rating,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Book(
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
      source: source ?? this.source,
      ddc: ddc ?? this.ddc,
      from: from ?? this.from,
      ebookUrl: ebookUrl ?? this.ebookUrl,
      location: location ?? this.location,
      shelf: shelf ?? this.shelf,
      accessNumbers: accessNumbers ?? this.accessNumbers,
      rating: rating ?? this.rating,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  String toString() {
    return 'Book(id: $id, title: $title, author: $author, isbn: $isbn, availableCopies: $availableCopies/$totalCopies)';
  }

  /// Creates a [Book] from a map (legacy support)
  factory Book.fromMap(Map<String, dynamic> map) {
    return Book(
      id: map['id'].toString(),
      title: map['title'] as String,
      author: map['author'] as String,
      isbn: map['isbn'] as String,
      publisher: map['publisher'] as String?,
      publicationYear: map['publicationYear'] as int,
      edition: map['edition'] as String?,
      totalCopies: map['totalCopies'] as int,
      availableCopies: map['availableCopies'] as int,
      description: map['description'] as String?,
      coverImageUrl: map['coverImageUrl'] as String?,
      categories:
          ((map['categories'] as List<dynamic>? ?? [])
                  .map(
                    (cat) =>
                        cat is String ? cat : (cat['name'] ?? cat.toString()),
                  )
                  .toList())
              .cast<String>(),
      subjects:
          ((map['subjects'] as List<dynamic>? ?? [])
                  .map(
                    (subj) => subj is String
                        ? subj
                        : (subj['name'] ?? subj.toString()),
                  )
                  .toList())
              .cast<String>(),
      type: BookType.values.firstWhere(
        (e) => e.name.toLowerCase() == (map['type']?.toString().toLowerCase()),
        orElse: () => BookType.physical,
      ),
      source: BookSource.values.firstWhere(
        (e) =>
            e.name.toLowerCase() == (map['source']?.toString().toLowerCase()),
        orElse: () => BookSource.purchased,
      ),
      ddc: map['ddc'] as String?,
      from: map['from'] as String?,
      ebookUrl: map['ebookUrl'] as String?,
      location: map['location'] as String?,
      shelf: map['shelf'] as String?,
      accessNumbers:
          ((map['accessNumbers'] as List<dynamic>? ?? [])
                  .map(
                    (acc) =>
                        acc is String ? acc : (acc['number'] ?? acc.toString()),
                  )
                  .toList())
              .cast<String>(),
      rating:
          (map['rating'] is String
                  ? double.tryParse(map['rating'])
                  : (map['rating'] as num?))
              ?.toDouble() ??
          0.0,
      createdAt: map['createdAt'] is DateTime
          ? map['createdAt'] as DateTime
          : DateTime.parse(map['createdAt'] as String),
      updatedAt: map['updatedAt'] is DateTime
          ? map['updatedAt'] as DateTime
          : DateTime.parse(map['updatedAt'] as String),
    );
  }

  /// Converts this [Book] instance to a JSON map
  JsonMap toJson() => _$BookToJson(this);
}
