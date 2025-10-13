import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/models/membership_type_model.dart';

part 'membership_request_model.g.dart';

typedef MembershipRequestList = List<MembershipRequest>;
typedef MembershipRequestMap = Map<String, dynamic>;

@JsonSerializable(explicitToJson: true)
class MembershipRequest {
  final String id;
  final String userId;
  final User user;
  final int membershipTypeId;
  final MembershipType membershipType;
  final String status;
  final String? rejectionReason;
  final String? processedById;
  final User? processedBy;
  final DateTime? processedAt;
  final String? notes;
  final DateTime createdAt;
  final DateTime updatedAt;

  const MembershipRequest({
    required this.id,
    required this.userId,
    required this.user,
    required this.membershipTypeId,
    required this.membershipType,
    required this.status,
    this.rejectionReason,
    this.processedById,
    this.processedBy,
    this.processedAt,
    this.notes,
    required this.createdAt,
    required this.updatedAt,
  });

  factory MembershipRequest.fromJson(Map<String, dynamic> json) =>
      _$MembershipRequestFromJson(json);

  Map<String, dynamic> toJson() => _$MembershipRequestToJson(this);

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MembershipRequest &&
          runtimeType == other.runtimeType &&
          id == other.id;

  @override
  int get hashCode => id.hashCode;
}
