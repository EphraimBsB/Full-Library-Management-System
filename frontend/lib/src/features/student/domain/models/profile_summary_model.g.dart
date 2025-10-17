// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'profile_summary_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ProfileSummaryModel _$ProfileSummaryModelFromJson(Map<String, dynamic> json) =>
    ProfileSummaryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      email: json['email'] as String,
      avatar: json['avatar'] as String?,
      rollNumber: json['rollNumber'] as String,
      phoneNumber: json['phoneNumber'] as String?,
      program: json['program'] as String?,
      role: json['role'] as String,
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      expiryDate: json['expiryDate'] == null
          ? null
          : DateTime.parse(json['expiryDate'] as String),
      membershipStatus: json['membershipStatus'] as String,
      membershipType: json['membershipType'] as String,
      stats: json['stats'] as Map<String, dynamic>,
    );

Map<String, dynamic> _$ProfileSummaryModelToJson(
  ProfileSummaryModel instance,
) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'email': instance.email,
  'avatar': instance.avatar,
  'rollNumber': instance.rollNumber,
  'phoneNumber': instance.phoneNumber,
  'program': instance.program,
  'role': instance.role,
  'joinedAt': instance.joinedAt.toIso8601String(),
  'expiryDate': instance.expiryDate?.toIso8601String(),
  'membershipStatus': instance.membershipStatus,
  'membershipType': instance.membershipType,
  'stats': instance.stats,
};
