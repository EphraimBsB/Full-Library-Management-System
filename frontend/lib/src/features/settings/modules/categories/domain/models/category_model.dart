import 'package:json_annotation/json_annotation.dart';

part 'category_model.g.dart';

@JsonSerializable()
class Category {
  final int? id;
  final String name;
  final String? description;
  final bool isActive;

  const Category({
    this.id,
    required this.name,
    this.description,
    this.isActive = true,
  });

  factory Category.fromJson(Map<String, dynamic> json) =>
      _$CategoryFromJson(json);
  // In category_model.dart
  Map<String, dynamic> toJson() {
    return {'name': name, if (description != null) 'description': description};
  }
}

// Category copyWith({
//   int? id,
//   String? name,
//   String? description,
//   bool? isActive,
// }) {
//   return Category(
//     id: id ?? this.id,
//     name: name ?? this.name,
//     description: description ?? this.description,
//     isActive: isActive ?? this.isActive,
//   );
// }
