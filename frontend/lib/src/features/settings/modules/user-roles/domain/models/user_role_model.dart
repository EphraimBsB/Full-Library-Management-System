import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'user_role_model.g.dart';

@JsonSerializable()
class UserRole extends Equatable {
  @JsonKey(name: 'id')
  final int id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'description', includeIfNull: true)
  final String? description;

  @JsonKey(name: 'permissions', defaultValue: <String>[])
  final List<String> permissions;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  @JsonKey(name: 'createdAt', required: false)
  final DateTime? createdAt;

  @JsonKey(name: 'updatedAt', required: false)
  final DateTime? updatedAt;

  const UserRole({
    required this.id,
    required this.name,
    this.description,
    List<String>? permissions,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  }) : permissions = permissions ?? const [];

  factory UserRole.fromJson(Map<String, dynamic> json) =>
      _$UserRoleFromJson(json);

  Map<String, dynamic> toJson() => _$UserRoleToJson(this);

  UserRole copyWith({
    int? id,
    String? name,
    String? description,
    List<String>? permissions,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserRole(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      permissions: permissions ?? this.permissions,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
    id,
    name,
    description,
    permissions,
    isActive,
    createdAt,
    updatedAt,
  ];

  @override
  String toString() {
    return 'UserRole(id: $id, name: $name, description: $description, '
        'permissions: $permissions, isActive: $isActive, '
        'createdAt: $createdAt, updatedAt: $updatedAt)';
  }
}
