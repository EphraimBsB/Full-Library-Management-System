import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/models/location_model.dart';

part 'shelf_model.g.dart';

@JsonSerializable()
class Shelf {
  @JsonKey(name: 'id')
  final int? id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'description', includeIfNull: true)
  final String? description;

  @JsonKey(name: 'locationId')
  final int locationId;

  @JsonKey(name: 'location', includeIfNull: true)
  final Location? location;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  const Shelf({
    this.id,
    required this.name,
    this.description,
    required this.locationId,
    this.location,
    this.isActive = true,
  });

  factory Shelf.fromJson(Map<String, dynamic> json) => _$ShelfFromJson(json);

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (description != null) 'description': description,
      'locationId': locationId,
    };
  }
}
