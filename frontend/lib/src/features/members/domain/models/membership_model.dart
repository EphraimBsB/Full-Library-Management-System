import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/models/membership_type_model.dart';
part 'membership_model.g.dart';

typedef MembershipList = List<Membership>;
typedef MembershipMap = Map<String, dynamic>;

@JsonSerializable(explicitToJson: true)
class Membership {
  final String id;
  final String membershipNumber;
  final String userId;
  final User user;
  final int membershipTypeId;
  final MembershipType type;
  final String startDate;
  final String expiryDate;
  final String status;
  final int timesRenewed;
  final String outstandingFines;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Membership({
    required this.id,
    required this.membershipNumber,
    required this.userId,
    required this.user,
    required this.membershipTypeId,
    required this.type,
    required this.startDate,
    required this.expiryDate,
    required this.status,
    required this.timesRenewed,
    required this.outstandingFines,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Membership.fromJson(Map<String, dynamic> json) =>
      _$MembershipFromJson(json);

  Map<String, dynamic> toJson() => _$MembershipToJson(this);
}
