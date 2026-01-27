// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'publisher_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Publisher _$PublisherFromJson(Map<String, dynamic> json) => Publisher(
  id: (json['id'] as num?)?.toInt(),
  name: json['name'] as String,
  description: json['description'] as String?,
  phone: json['phone'] as String?,
  email: json['email'] as String?,
  address: json['address'] as String?,
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$PublisherToJson(Publisher instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'phone': instance.phone,
  'email': instance.email,
  'address': instance.address,
  'isActive': instance.isActive,
};
