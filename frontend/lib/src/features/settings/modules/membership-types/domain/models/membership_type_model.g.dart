// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'membership_type_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MembershipType _$MembershipTypeFromJson(Map<String, dynamic> json) =>
    MembershipType(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      maxBooks: (json['maxBooks'] as num).toInt(),
      maxDurationDays: (json['maxDurationDays'] as num).toInt(),
      renewalLimit: (json['renewalLimit'] as num).toInt(),
      fineRate: json['fineRate'] as String,
      description: json['description'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );

Map<String, dynamic> _$MembershipTypeToJson(MembershipType instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'maxBooks': instance.maxBooks,
      'maxDurationDays': instance.maxDurationDays,
      'renewalLimit': instance.renewalLimit,
      'fineRate': instance.fineRate,
      'description': instance.description,
      'isActive': instance.isActive,
    };
