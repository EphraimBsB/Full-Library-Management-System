// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'location_model.dart';

// *************************************************************************
// JsonSerializableGenerator
// *************************************************************************

Location _$LocationFromJson(Map<String, dynamic> json) => Location(
  id: (json['id'] as num?)?.toInt(),
  name: json['name'] as String,
  description: json['description'] as String?,
  address: json['address'] as String?,
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$LocationToJson(Location instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'address': instance.address,
  'isActive': instance.isActive,
};
