// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'degree_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Degree _$DegreeFromJson(Map<String, dynamic> json) => Degree(
  id: (json['id'] as num).toInt(),
  name: json['name'] as String,
  code: json['code'] as String,
  description: json['description'] as String?,
  level: json['level'] as String?,
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$DegreeToJson(Degree instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'code': instance.code,
  'description': instance.description,
  'level': instance.level,
  'isActive': instance.isActive,
};
