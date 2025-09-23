import 'package:json_annotation/json_annotation.dart';

part 'book_model_new.g.dart';

@JsonSerializable()
class Category {
  final int id;
  final String name;
  
  const Category({required this.id, required this.name});
  
  factory Category.fromJson(Map<String, dynamic> json) => _$CategoryFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryToJson(this);
}

@JsonSerializable()
class Subject {
  final int id;
  final String name;
  
  const Subject({required this.id, required this.name});
  
  factory Subject.fromJson(Map<String, dynamic> json) => _$SubjectFromJson(json);
  Map<String, dynamic> toJson() => _$SubjectToJson(this);
}

@JsonSerializable()
class AccessNumber {
  final int id;
  final String number;
  
  const AccessNumber({required this.id, required this.number});
  
  factory AccessNumber.fromJson(Map<String, dynamic> json) => _$AccessNumberFromJson(json);
  Map<String, dynamic> toJson() => _$AccessNumberToJson(this);
}

@JsonSerializable(includeIfNull: false)
class BookModel {
  final int id;
  final String title;
  final String author;
  final String isbn;
  final String? publisher;
  @JsonKey(name: 'publicationYear')
  final int publicationYear;
  final String? edition;
  @JsonKey(name: 'totalCopies')
  final int totalCopies;
  @JsonKey(name: 'availableCopies')
  final int availableCopies;
  final String? description;
  @JsonKey(name: 'coverImageUrl')
  final String? coverImageUrl;
  final List<Category> categories;
  final List<Subject> subjects;
  final String type;
  @JsonKey(name: 'ebookUrl')
  final String? ebookUrl;
  final List<AccessNumber> accessNumbers;
  @JsonKey(fromJson: _ratingFromJson, toJson: _ratingToJson)
  final double rating;
  @JsonKey(name: 'createdAt')
  final DateTime createdAt;
  @JsonKey(name: 'updatedAt')
  final DateTime updatedAt;
  
  // Helper methods for rating conversion
  static double _ratingFromJson(String rating) => double.tryParse(rating) ?? 0.0;
  static String _ratingToJson(double rating) => rating.toStringAsFixed(2);

  const BookModel({
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
    this.ebookUrl,
    this.accessNumbers = const [],
    this.rating = 0.0,
    required this.createdAt,
    required this.updatedAt,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) => _$BookModelFromJson(json);
  
  Map<String, dynamic> toJson() => _$BookModelToJson(this);

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
    String? type,
    String? ebookUrl,
    List<AccessNumber>? accessNumbers,
    double? rating,
    DateTime? createdAt,
    DateTime? updatedAt,
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
      ebookUrl: ebookUrl ?? this.ebookUrl,
      accessNumbers: accessNumbers ?? this.accessNumbers,
      rating: rating ?? this.rating,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
