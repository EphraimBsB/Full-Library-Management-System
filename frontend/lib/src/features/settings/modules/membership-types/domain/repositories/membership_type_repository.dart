import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/models/membership_type_model.dart';

abstract class MembershipTypeRepository {
  Future<Either<Failure, List<MembershipType>>> getMembershipTypes({
    int page,
    int limit,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, MembershipType>> getMembershipType(int id);
  
  Future<Either<Failure, MembershipType>> createMembershipType(MembershipType membershipType);
  
  Future<Either<Failure, MembershipType>> updateMembershipType(MembershipType membershipType);
  
  Future<Either<Failure, void>> deleteMembershipType(int id);
  
  Future<Either<Failure, void>> toggleMembershipTypeStatus(int id, bool isActive);
}
