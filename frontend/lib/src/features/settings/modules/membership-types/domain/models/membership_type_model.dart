import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'membership_type_model.g.dart';

@JsonSerializable()
class MembershipType extends Equatable {
  @JsonKey(name: 'id')
  final int id;

  @JsonKey(name: 'name')
  final String name;

  @JsonKey(name: 'maxBooks')
  final int maxBooks;

  @JsonKey(name: 'maxDurationDays')
  final int maxDurationDays;

  @JsonKey(name: 'renewalLimit')
  final int renewalLimit;

  @JsonKey(name: 'fineRate')
  final String fineRate;

  @JsonKey(name: 'description', includeIfNull: true)
  final String? description;

  @JsonKey(name: 'isActive', defaultValue: true)
  final bool isActive;

  const MembershipType({
    required this.id,
    required this.name,
    required this.maxBooks,
    required this.maxDurationDays,
    required this.renewalLimit,
    required this.fineRate,
    this.description,
    this.isActive = true,
  });

  factory MembershipType.fromJson(Map<String, dynamic> json) =>
      _$MembershipTypeFromJson(json);

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (description != null) 'description': description,
      'maxBooks': maxBooks,
      'maxDurationDays': maxDurationDays,
      'renewalLimit': renewalLimit,
      'fineRate': fineRate,
      'isActive': isActive,
    };
  }

  @override
  List<Object?> get props => [
    id,
    name,
    maxBooks,
    maxDurationDays,
    renewalLimit,
    fineRate,
    description,
    isActive,
  ];
}
