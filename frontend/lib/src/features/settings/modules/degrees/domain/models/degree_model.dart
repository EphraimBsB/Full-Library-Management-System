import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'degree_model.g.dart';

@JsonSerializable()
class Degree extends Equatable {
  @JsonKey(name: 'id')
  final int id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'code')
  final String code;

  @JsonKey(name: 'description', includeIfNull: true)
  final String? description;

  @JsonKey(name: 'level', includeIfNull: true)
  final String? level;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  const Degree({
    required this.id,
    required this.name,
    required this.code,
    this.description,
    this.level,
    this.isActive = true,
  });

  factory Degree.fromJson(Map<String, dynamic> json) => _$DegreeFromJson(json);

  Map<String, dynamic> toJson() => _$DegreeToJson(this);

  @override
  List<Object?> get props => [id, name, code, description, isActive];

  Degree copyWith({
    int? id,
    String? name,
    String? code,
    String? description,
    String? level,
    bool? isActive,
  }) {
    return Degree(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      description: description ?? this.description,
      level: level ?? this.level,
      isActive: isActive ?? this.isActive,
    );
  }
}
