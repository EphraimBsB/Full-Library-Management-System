import 'package:json_annotation/json_annotation.dart';

part 'source_model.g.dart';

// In source_model.dart
@JsonSerializable()
class Source {
  @JsonKey(name: 'id')
  final int? id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'supplier', includeIfNull: true)
  final String? supplier;

  @JsonKey(name: 'dateAcquired', includeIfNull: true)
  final String? dateAcquired;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  const Source({
    this.id,
    required this.name,
    this.supplier,
    this.dateAcquired,
    this.isActive = true,
  });

  factory Source.fromJson(Map<String, dynamic> json) => _$SourceFromJson(json);

  Map<String, dynamic> toJson() {
    final jsonMap = {
      'name': name,
      if (supplier != null) 'supplier': supplier,
      if (dateAcquired != null) 'dateAcquired': dateAcquired,
      'isActive': isActive,
    };
    return jsonMap;
  }

  Source copyWith({
    int? id,
    String? name,
    String? supplier,
    String? dateAcquired,
    bool? isActive,
  }) {
    return Source(
      id: id ?? this.id,
      name: name ?? this.name,
      supplier: supplier ?? this.supplier,
      dateAcquired: dateAcquired ?? this.dateAcquired,
      isActive: isActive ?? this.isActive,
    );
  }
}
