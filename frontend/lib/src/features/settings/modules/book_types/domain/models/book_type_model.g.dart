// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'book_type_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BookType _$BookTypeFromJson(Map<String, dynamic> json) => BookType(
  id: (json['id'] as num?)?.toInt(),
  name: json['name'] as String,
  description: json['description'] as String?,
  format: json['format'] as String?,
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$BookTypeToJson(BookType instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'format': instance.format,
  'isActive': instance.isActive,
};
