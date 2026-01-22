import 'package:json_annotation/json_annotation.dart';

part 'location_model.g.dart';

@JsonSerializable()
class Location {
  @JsonKey(name: 'id')
  final int? id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'description', includeIfNull: true)
  final String? description;

  @JsonKey(name: 'address', includeIfNull: true)
  final String? address;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  const Location({
    this.id,
    required this.name,
    this.description,
    this.address,
    this.isActive = true,
  });

  factory Location.fromJson(Map<String, dynamic> json) =>
      _$LocationFromJson(json);

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (description != null) 'description': description,
      if (address != null) 'address': address,
    };
  }
}
