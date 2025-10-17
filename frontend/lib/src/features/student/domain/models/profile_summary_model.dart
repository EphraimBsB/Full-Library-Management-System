import 'package:json_annotation/json_annotation.dart';

part 'profile_summary_model.g.dart';

@JsonSerializable()
class ProfileSummaryModel {
  final String id;
  final String name;
  final String email;
  final String? avatar;
  final String rollNumber;
  final String? phoneNumber;
  final String? program;
  final String role;
  final DateTime joinedAt;
  final DateTime? expiryDate;
  final String membershipStatus;
  final String membershipType;
  final Map<String, dynamic> stats;

  ProfileSummaryModel({
    required this.id,
    required this.name,
    required this.email,
    this.avatar,
    required this.rollNumber,
    this.phoneNumber,
    this.program,
    required this.role,
    required this.joinedAt,
    this.expiryDate,
    required this.membershipStatus,
    required this.membershipType,
    required this.stats,
  });

  factory ProfileSummaryModel.fromJson(Map<String, dynamic> json) =>
      _$ProfileSummaryModelFromJson(json);

  Map<String, dynamic> toJson() => _$ProfileSummaryModelToJson(this);
}
