// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'source_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Source _$SourceFromJson(Map<String, dynamic> json) => Source(
  id: (json['id'] as num?)?.toInt(),
  name: json['name'] as String,
  supplier: json['supplier'] as String?,
  dateAcquired: json['dateAcquired'] as String?,
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$SourceToJson(Source instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'supplier': instance.supplier,
  'dateAcquired': instance.dateAcquired,
  'isActive': instance.isActive,
};
