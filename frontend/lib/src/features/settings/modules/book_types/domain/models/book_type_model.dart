import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'book_type_model.g.dart';

@JsonSerializable()
class BookType extends Equatable {
  @JsonKey(name: 'id')
  final int? id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'description', includeIfNull: true)
  final String? description;

  @JsonKey(name: 'format', includeIfNull: true)
  final String? format;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  const BookType({
    this.id,
    required this.name,
    this.description,
    this.format,
    this.isActive = true,
  });

  factory BookType.fromJson(Map<String, dynamic> json) =>
      _$BookTypeFromJson(json);

  Map<String, dynamic> toJson() => _$BookTypeToJson(this);

  @override
  List<Object?> get props => [id, name, description, isActive];

  BookType copyWith({
    int? id,
    String? name,
    String? description,
    String? format,
    bool? isActive,
  }) {
    return BookType(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      format: format ?? this.format,
      isActive: isActive ?? this.isActive,
    );
  }
}
