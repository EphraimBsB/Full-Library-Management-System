// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

User _$UserFromJson(Map<String, dynamic> json) => User(
  id: json['id'] as String,
  firstName: json['firstName'] as String,
  lastName: json['lastName'] as String,
  email: json['email'] as String,
  rollNumber: json['rollNumber'] as String,
  phoneNumber: json['phoneNumber'] as String?,
  avatarUrl: json['avatarUrl'] as String?,
  course: json['course'] as String?,
  degree: json['degree'] as String?,
  dateOfBirth: json['dateOfBirth'] == null
      ? null
      : DateTime.parse(json['dateOfBirth'] as String),
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
  isActive: json['isActive'] as bool? ?? true,
  joinDate: json['joinDate'] == null
      ? null
      : DateTime.parse(json['joinDate'] as String),
  expiryDate: json['expiryDate'] == null
      ? null
      : DateTime.parse(json['expiryDate'] as String),
  borrowedBooks: (json['borrowedBooks'] as Map<String, dynamic>?)?.map(
    (k, e) => MapEntry(k, DateTime.parse(e as String)),
  ),
  role: json['role'] == null
      ? null
      : UserRole.fromJson(json['role'] as Map<String, dynamic>),
);

Map<String, dynamic> _$UserToJson(User instance) => <String, dynamic>{
  'id': instance.id,
  'firstName': instance.firstName,
  'lastName': instance.lastName,
  'email': instance.email,
  'rollNumber': instance.rollNumber,
  'phoneNumber': instance.phoneNumber,
  'avatarUrl': instance.avatarUrl,
  'course': instance.course,
  'degree': instance.degree,
  'dateOfBirth': instance.dateOfBirth?.toIso8601String(),
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
  'isActive': instance.isActive,
  'joinDate': instance.joinDate?.toIso8601String(),
  'expiryDate': instance.expiryDate?.toIso8601String(),
  'role': instance.role,
  'borrowedBooks': instance.borrowedBooks?.map(
    (k, e) => MapEntry(k, e.toIso8601String()),
  ),
};
