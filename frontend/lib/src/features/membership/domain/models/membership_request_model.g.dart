// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'membership_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MembershipRequest _$MembershipRequestFromJson(Map<String, dynamic> json) =>
    MembershipRequest(
      id: json['id'] as String,
      userId: json['userId'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      membershipTypeId: (json['membershipTypeId'] as num).toInt(),
      membershipType: MembershipType.fromJson(
        json['membershipType'] as Map<String, dynamic>,
      ),
      status: json['status'] as String,
      rejectionReason: json['rejectionReason'] as String?,
      processedById: json['processedById'] as String?,
      processedBy: json['processedBy'] == null
          ? null
          : User.fromJson(json['processedBy'] as Map<String, dynamic>),
      processedAt: json['processedAt'] == null
          ? null
          : DateTime.parse(json['processedAt'] as String),
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$MembershipRequestToJson(MembershipRequest instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'user': instance.user.toJson(),
      'membershipTypeId': instance.membershipTypeId,
      'membershipType': instance.membershipType.toJson(),
      'status': instance.status,
      'rejectionReason': instance.rejectionReason,
      'processedById': instance.processedById,
      'processedBy': instance.processedBy?.toJson(),
      'processedAt': instance.processedAt?.toIso8601String(),
      'notes': instance.notes,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };
