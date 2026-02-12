import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/members/domain/models/membership_model.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';
import 'package:management_side/src/core/data/pagination.dart';

abstract class MemberRepository {
  /// Get all memberships with optional filtering
  Future<Either<Failure, PaginatedResponse<Membership>>> getMemberships({
    String? status,
    int? page,
    int? limit,
  });

  /// Get a specific membership by ID
  Future<Either<Failure, Membership>> getMembership(String id);

  /// Create a new membership
  Future<Either<Failure, Membership>> createMembership(
    Map<String, dynamic> membershipData,
  );

  /// Create a new member directly
  Future<Either<Failure, User>> createMember(Map<String, dynamic> memberData);

  /// Update a membership
  Future<Either<Failure, Membership>> updateMembership(
    String id,
    Map<String, dynamic> updates,
  );

  /// Delete a membership
  Future<Either<Failure, void>> deleteMembership(String id);
}
