// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'shelf_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Shelf _$ShelfFromJson(Map<String, dynamic> json) => Shelf(
  id: (json['id'] as num?)?.toInt(),
  name: json['name'] as String,
  description: json['description'] as String?,
  locationId: (json['locationId'] as num).toInt(),
  location: json['location'] == null
      ? null
      : Location.fromJson(json['location'] as Map<String, dynamic>),
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$ShelfToJson(Shelf instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'locationId': instance.locationId,
  'location': instance.location,
  'isActive': instance.isActive,
};
