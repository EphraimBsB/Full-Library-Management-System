import 'package:json_annotation/json_annotation.dart';

/// Represents the type of a book (e.g., ebook, physical, or both).
enum BookType {
  @JsonValue('ebook')
  ebook('E-book'),
  @JsonValue('physical')
  physical('Physical'),
  @JsonValue('both')
  both('E-book & Physical');

  /// Display label for the book type
  final String label;

  const BookType(this.label);

  @override
  String toString() => label;

  /// Creates a [BookType] from a JSON string value
  factory BookType.fromJson(dynamic value) {
    if (value is BookType) return value;
    if (value is String) {
      return BookType.values.firstWhere(
        (e) => e.name == value || e.toString() == value,
        orElse: () => BookType.physical,
      );
    }
    return BookType.physical;
  }

  /// Converts the [BookType] to a JSON string
  String toJson() => name;
}

/// Represents the source of a book (e.g., purchased, donated, made).
enum BookSource {
  @JsonValue('purchased')
  purchased('Purchased'),
  @JsonValue('donated')
  donated('Donated'),
  @JsonValue('made')
  made('Made');

  /// Display label for the book source
  final String label;

  const BookSource(this.label);

  @override
  String toString() => label;

  /// Creates a [BookSource] from a JSON string value
  factory BookSource.fromJson(dynamic value) {
    if (value is BookSource) return value;
    if (value is String) {
      return BookSource.values.firstWhere(
        (e) => e.name == value || e.toString() == value,
        orElse: () => BookSource.purchased,
      );
    }
    return BookSource.purchased;
  }

  /// Converts the [BookSource] to a JSON string
  String toJson() => name;
}
