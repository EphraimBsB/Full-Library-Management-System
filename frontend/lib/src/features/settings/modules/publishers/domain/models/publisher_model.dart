import 'package:json_annotation/json_annotation.dart';

part 'publisher_model.g.dart';

@JsonSerializable()
class Publisher {
  @JsonKey(name: 'id')
  final int? id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'description', includeIfNull: true)
  final String? description;

  @JsonKey(name: 'phone', includeIfNull: true)
  final String? phone;

  @JsonKey(name: 'email', includeIfNull: true)
  final String? email;

  @JsonKey(name: 'address', includeIfNull: true)
  final String? address;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  const Publisher({
    this.id,
    required this.name,
    this.description,
    this.phone,
    this.email,
    this.address,
    this.isActive = true,
  });

  factory Publisher.fromJson(Map<String, dynamic> json) =>
      _$PublisherFromJson(json);

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (description != null) 'description': description,
      if (phone != null) 'phone': phone,
      if (email != null) 'email': email,
      if (address != null) 'address': address,
    };
  }
}
