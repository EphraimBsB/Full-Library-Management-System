// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

UserModel _$UserModelFromJson(Map<String, dynamic> json) => UserModel(
  id: json['id'] as String?,
  firstName: json['firstName'] as String?,
  lastName: json['lastName'] as String?,
  email: json['email'] as String?,
  rollNumber: json['rollNumber'] as String?,
  phoneNumber: json['phoneNumber'] as String?,
  profileImageUrl: json['profileImageUrl'] as String?,
  course: json['course'] as String?,
  degree: json['degree'] as String?,
  dateOfBirth: json['dateOfBirth'] == null
      ? null
      : DateTime.parse(json['dateOfBirth'] as String),
  role: $enumDecodeNullable(_$UserRoleEnumMap, json['role']),
  avatarUrl: json['avatarUrl'] as String?,
  isActive: json['isActive'] as bool? ?? true,
  joinDate: json['joinDate'] == null
      ? null
      : DateTime.parse(json['joinDate'] as String),
  expiryDate: json['expiryDate'] == null
      ? null
      : DateTime.parse(json['expiryDate'] as String),
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$UserModelToJson(UserModel instance) => <String, dynamic>{
  'id': instance.id,
  'firstName': instance.firstName,
  'lastName': instance.lastName,
  'email': instance.email,
  'rollNumber': instance.rollNumber,
  'phoneNumber': instance.phoneNumber,
  'profileImageUrl': instance.profileImageUrl,
  'course': instance.course,
  'degree': instance.degree,
  'dateOfBirth': instance.dateOfBirth?.toIso8601String(),
  'role': _$UserRoleEnumMap[instance.role],
  'isActive': instance.isActive,
  'joinDate': instance.joinDate?.toIso8601String(),
  'expiryDate': instance.expiryDate?.toIso8601String(),
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
  'avatarUrl': instance.avatarUrl,
};

const _$UserRoleEnumMap = {
  UserRole.admin: 'admin',
  UserRole.librarian: 'librarian',
  UserRole.member: 'member',
  UserRole.guest: 'guest',
};
