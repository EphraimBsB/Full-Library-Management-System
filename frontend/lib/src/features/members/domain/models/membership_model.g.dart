// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'membership_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Membership _$MembershipFromJson(Map<String, dynamic> json) => Membership(
  id: json['id'] as String,
  membershipNumber: json['membershipNumber'] as String,
  userId: json['userId'] as String,
  user: User.fromJson(json['user'] as Map<String, dynamic>),
  membershipTypeId: (json['membershipTypeId'] as num).toInt(),
  type: MembershipType.fromJson(json['type'] as Map<String, dynamic>),
  startDate: json['startDate'] as String,
  expiryDate: json['expiryDate'] as String,
  status: json['status'] as String,
  timesRenewed: (json['timesRenewed'] as num).toInt(),
  outstandingFines: json['outstandingFines'] as String,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$MembershipToJson(Membership instance) =>
    <String, dynamic>{
      'id': instance.id,
      'membershipNumber': instance.membershipNumber,
      'userId': instance.userId,
      'user': instance.user.toJson(),
      'membershipTypeId': instance.membershipTypeId,
      'type': instance.type.toJson(),
      'startDate': instance.startDate,
      'expiryDate': instance.expiryDate,
      'status': instance.status,
      'timesRenewed': instance.timesRenewed,
      'outstandingFines': instance.outstandingFines,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
