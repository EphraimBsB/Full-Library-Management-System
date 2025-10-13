import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'subject_model.g.dart';

@JsonSerializable()
class Subject extends Equatable {
  @JsonKey(name: 'id')
  final int? id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'description', includeIfNull: true)
  final String? description;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  const Subject({
    this.id,
    required this.name,
    this.description,
    this.isActive = true,
  });

  factory Subject.fromJson(Map<String, dynamic> json) =>
      _$SubjectFromJson(json);

  Map<String, dynamic> toJson() => _$SubjectToJson(this);

  @override
  List<Object?> get props => [id, name, description, isActive];

  Subject copyWith({
    int? id,
    String? name,
    String? description,
    bool? isActive,
  }) {
    return Subject(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      isActive: isActive ?? this.isActive,
    );
  }
}
